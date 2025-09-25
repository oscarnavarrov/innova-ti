// User management endpoints for the admin system

// Get all users (profiles with auth info)
export function addUsersEndpoints(app: any, supabase: any, validateAuthToken: any) {
  
  app.get("/make-server-2e05cbde/users", async (c: any) => {
    try {
      // Check authentication
      const token = await validateAuthToken(c, "Users");
      if (!token) {
        return c.json(
          { error: "Token de autenticación requerido" },
          401,
        );
      }

      // Get profiles with roles info
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          role_id,
          active,
          created_at,
          roles(id, name, permissions)
        `)
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.log("❌ Error fetching profiles:", profilesError);
        throw profilesError;
      }

      // Get user emails from auth.users for each profile
      const usersWithEmails = await Promise.all(
        profiles.map(async (profile: any) => {
          try {
            const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id);
            
            return {
              id: profile.id,
              email: authUser?.user?.email || 'Sin email',
              full_name: profile.full_name,
              role_id: profile.role_id,
              active: profile.active !== undefined ? profile.active : true,
              created_at: profile.created_at,
              last_sign_in_at: authUser?.user?.last_sign_in_at || null,
              roles: profile.roles
            };
          } catch (authError) {
            console.log("⚠️ Error getting auth user for profile:", profile.id, authError);
            return {
              id: profile.id,
              email: 'Error obteniendo email',
              full_name: profile.full_name,
              role_id: profile.role_id,
              active: profile.active !== undefined ? profile.active : false,
              created_at: profile.created_at,
              last_sign_in_at: null,
              roles: profile.roles
            };
          }
        })
      );

      return c.json(usersWithEmails);
    } catch (error) {
      console.log("💥 Error fetching users:", error);
      return c.json({ error: "Failed to fetch users" }, 500);
    }
  });

  // Create new user
  app.post("/make-server-2e05cbde/users", async (c: any) => {
    try {
      // Check authentication
      const token = await validateAuthToken(c, "Create user");
      if (!token) {
        return c.json(
          { error: "Token de autenticación requerido" },
          401,
        );
      }

      const body = await c.req.json();
      const {
        email,
        password,
        full_name,
        role_id,
        active
      } = body;

      // Validate required fields
      if (!email || !password || !full_name || !role_id) {
        return c.json(
          { error: "Email, password, full_name y role_id son requeridos" },
          400,
        );
      }

      // Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
        },
      });

      if (authError) {
        console.log("❌ Error creating auth user:", authError);
        return c.json(
          { error: "Error creando usuario: " + authError.message },
          400,
        );
      }

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authUser.user.id,
          full_name,
          role_id: parseInt(role_id),
          active: active !== undefined ? active : true,
        })
        .select(`
          id,
          full_name,
          role_id,
          active,
          created_at,
          roles(id, name, permissions)
        `)
        .single();

      if (profileError) {
        console.log("❌ Error creating profile:", profileError);
        // Try to clean up auth user if profile creation failed
        await supabase.auth.admin.deleteUser(authUser.user.id);
        return c.json(
          { error: "Error creando perfil de usuario: " + profileError.message },
          500,
        );
      }

      // Return user data in expected format
      const userResponse = {
        id: profile.id,
        email: authUser.user.email,
        full_name: profile.full_name,
        role_id: profile.role_id,
        active: profile.active,
        created_at: profile.created_at,
        last_sign_in_at: null,
        roles: profile.roles
      };

      console.log("✅ User created successfully:", full_name);
      return c.json(userResponse);
    } catch (error) {
      console.log("💥 Error creating user:", error);
      return c.json({ error: "Failed to create user" }, 500);
    }
  });

  // Update user
  app.put("/make-server-2e05cbde/users/:id", async (c: any) => {
    try {
      // Check authentication
      const token = await validateAuthToken(c, "Update user");
      if (!token) {
        return c.json(
          { error: "Token de autenticación requerido" },
          401,
        );
      }

      const userId = c.req.param("id");
      const body = await c.req.json();
      const {
        email,
        password,
        full_name,
        role_id,
        active
      } = body;

      console.log("🔍 Update user request:", {
        userId,
        email,
        full_name,
        role_id,
        active,
        activeType: typeof active
      });

      // Validate required fields
      if (!email || !full_name || !role_id) {
        return c.json(
          { error: "Email, full_name y role_id son requeridos" },
          400,
        );
      }

      // Update auth user
      const updateData: any = {
        email,
        user_metadata: {
          full_name,
        },
      };

      if (password) {
        updateData.password = password;
      }

      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        updateData
      );

      if (authError) {
        console.log("❌ Error updating auth user:", authError);
        return c.json(
          { error: "Error actualizando usuario: " + authError.message },
          400,
        );
      }

      // Update profile
      const profileUpdateData = {
        full_name,
        role_id: parseInt(role_id),
        active: active !== undefined ? active : true,
      };

      console.log("📝 Profile update data:", profileUpdateData);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdateData)
        .eq("id", userId)
        .select(`
          id,
          full_name,
          role_id,
          active,
          created_at,
          roles(id, name, permissions)
        `)
        .single();

      if (profileError) {
        console.log("❌ Error updating profile:", profileError);
        return c.json(
          { error: "Error actualizando perfil: " + profileError.message },
          500,
        );
      }

      // Return user data in expected format
      const userResponse = {
        id: profile.id,
        email: email,
        full_name: profile.full_name,
        role_id: profile.role_id,
        active: profile.active,
        created_at: profile.created_at,
        last_sign_in_at: null,
        roles: profile.roles
      };

      console.log("✅ User updated successfully:", full_name);
      return c.json(userResponse);
    } catch (error) {
      console.log("💥 Error updating user:", error);
      return c.json({ error: "Failed to update user" }, 500);
    }
  });

  // Delete user
  app.delete("/make-server-2e05cbde/users/:id", async (c: any) => {
    try {
      // Check authentication
      const token = await validateAuthToken(c, "Delete user");
      if (!token) {
        return c.json(
          { error: "Token de autenticación requerido" },
          401,
        );
      }

      const userId = c.req.param("id");

      // Delete from auth.users (this will cascade to profiles)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        console.log("❌ Error deleting auth user:", authError);
        return c.json(
          { error: "Error eliminando usuario: " + authError.message },
          500,
        );
      }

      console.log("✅ User deleted successfully:", userId);
      return c.json({ message: "Usuario eliminado exitosamente" });
    } catch (error) {
      console.log("💥 Error deleting user:", error);
      return c.json({ error: "Failed to delete user" }, 500);
    }
  });

  // Get all roles
  app.get("/make-server-2e05cbde/roles", async (c: any) => {
    try {
      // Check authentication
      const token = await validateAuthToken(c, "Roles");
      if (!token) {
        return c.json(
          { error: "Token de autenticación requerido" },
          401,
        );
      }

      const { data, error } = await supabase
        .from("roles")
        .select("id, name, permissions")
        .order("id", { ascending: true });

      if (error) throw error;

      // Transform roles to add description from permissions if needed
      const rolesWithDescription = data.map((role: any) => ({
        id: role.id,
        name: role.name,
        description: role.permissions?.description || `Rol: ${role.name}`,
        permissions: role.permissions
      }));

      return c.json(rolesWithDescription);
    } catch (error) {
      console.log("💥 Error fetching roles:", error);
      return c.json({ error: "Failed to fetch roles" }, 500);
    }
  });
}