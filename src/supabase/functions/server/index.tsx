import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import { addUsersEndpoints } from "./users-endpoints.tsx";

// Constants
const publicAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndW9oc3Z1YXJrY2lpb3psanZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MDUxMjAsImV4cCI6MjA3NDA4MTEyMH0.Lvg8MtN3FE1P-25XD6FY6FX-mVVJjigwqsqvuHqvXAg";

// Helper function to format time ago
function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor(
    (now.getTime() - time.getTime()) / 1000,
  );

  if (diffInSeconds < 60) {
    return "hace menos de 1 minuto";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? "s" : ""}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `hace ${diffInHours} hora${diffInHours !== 1 ? "s" : ""}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `hace ${diffInDays} día${diffInDays !== 1 ? "s" : ""}`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `hace ${diffInMonths} mes${diffInMonths !== 1 ? "es" : ""}`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `hace ${diffInYears} año${diffInYears !== 1 ? "s" : ""}`;
}

// Helper function to validate auth token
async function validateAuthToken(
  c: any,
  endpoint: string,
): Promise<string | null> {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      console.log(
        `❌ ${endpoint}: No Authorization header provided`,
      );
      return null;
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      console.log(
        `❌ ${endpoint}: Invalid Authorization header format`,
      );
      return null;
    }

    const accessToken = parts[1];
    if (!accessToken || accessToken === publicAnonKey) {
      console.log(
        `❌ ${endpoint}: No valid auth token provided`,
      );
      return null;
    }

    // Validate token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      console.log(
        `❌ ${endpoint}: Invalid token - ${error?.message || "No user found"}`,
      );
      return null;
    }

    console.log(
      `✅ ${endpoint}: Auth validated for user ${user.id}`,
    );
    return accessToken;
  } catch (error) {
    console.log(
      `❌ ${endpoint}: Token validation error:`,
      error?.message || "Unknown error",
    );
    return null;
  }
}

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    allowMethods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
      "HEAD",
    ],
    exposeHeaders: ["Content-Length", "X-Total-Count"],
    maxAge: 86400,
    credentials: false,
  }),
);

// Add explicit OPTIONS handler for preflight requests
app.options("/*", (c) => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods":
        "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Requested-With, Accept, Origin",
      "Access-Control-Max-Age": "86400",
    },
  });
});

// Health check endpoint
app.get("/make-server-2e05cbde/health", (c) => {
  console.log("🏥 Health check requested");
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    server: "make-server-2e05cbde",
  });
});

// Test authenticated endpoint
app.get("/make-server-2e05cbde/test", async (c) => {
  try {
    console.log("🧪 Test endpoint requested");
    const token = await validateAuthToken(c, "Test endpoint");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    return c.json({
      status: "authenticated",
      timestamp: new Date().toISOString(),
      message: "Test endpoint working correctly",
    });
  } catch (error) {
    console.log("💥 Error in test endpoint:", error);
    return c.json(
      { error: "Test endpoint error: " + error.message },
      500,
    );
  }
});

// Simple PATCH test endpoint - for debugging connectivity issues
app.patch("/make-server-2e05cbde/test-patch", async (c) => {
  try {
    console.log("🧪 Test PATCH endpoint requested");
    const token = await validateAuthToken(
      c,
      "Test PATCH endpoint",
    );
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    const body = await c.req.json();
    console.log("🧪 Test PATCH body:", body);

    return c.json({
      status: "patch_successful",
      timestamp: new Date().toISOString(),
      message: "PATCH endpoint working correctly",
      receivedData: body,
    });
  } catch (error) {
    console.log("💥 Error in test PATCH endpoint:", error);
    return c.json(
      { error: "Test PATCH endpoint error: " + error.message },
      500,
    );
  }
});

// Add users endpoints
addUsersEndpoints(app, supabase, validateAuthToken);

// FAQ endpoints - Get all FAQs
app.get("/make-server-2e05cbde/faqs", async (c) => {
  try {
    console.log("📝 FAQ GET /faqs requested");
    
    // Check authentication
    const token = await validateAuthToken(c, "FAQs");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    console.log('📖 Fetching all FAQs...');
    
    // First try basic query to test table access
    const { data: faqs, error } = await supabase
      .from('faqs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching FAQs:', error);
      return c.json(
        { error: 'Error al obtener las FAQs' },
        500
      );
    }

    console.log(`✅ Found ${faqs?.length || 0} FAQs`);
    return c.json(faqs || []);

  } catch (error) {
    console.error('❌ FAQ GET Error:', error);
    return c.json(
      { error: 'Error interno del servidor' },
      500
    );
  }
});

// FAQ endpoints - Create FAQ
app.post("/make-server-2e05cbde/faqs", async (c) => {
  try {
    console.log("📝 FAQ POST /faqs requested");
    
    // Check authentication
    const token = await validateAuthToken(c, "Create FAQ");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return c.json(
        { error: "Token inválido" },
        401
      );
    }

    const body = await c.req.json();
    console.log('📝 Creating FAQ:', body);

    // Validaciones
    if (!body.question || !body.answer) {
      return c.json(
        { error: 'La pregunta y respuesta son obligatorias' },
        400
      );
    }

    // Preparar datos para insertar
    const faqData = {
      question: body.question.trim(),
      answer: body.answer.trim(),
      category: body.category || null,
      manual_md: body.manual_md || null,
      references_links: body.references_links || null,
      video_urls: body.video_urls || null,
      asset_id: body.asset_id || null,
      created_by: user.id
    };

    console.log('💾 Inserting FAQ data:', faqData);

    const { data: newFAQ, error } = await supabase
      .from('faqs')
      .insert(faqData)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error creating FAQ:', error);
      return c.json(
        { error: 'Error al crear la FAQ' },
        500
      );
    }

    console.log(`✅ FAQ created successfully: ${newFAQ.question}`);
    return c.json(newFAQ, 201);

  } catch (error) {
    console.error('❌ FAQ POST Error:', error);
    return c.json(
      { error: 'Error interno del servidor' },
      500
    );
  }
});

// FAQ endpoints - Update FAQ
app.put("/make-server-2e05cbde/faqs/:id", async (c) => {
  try {
    const faqId = c.req.param('id');
    console.log(`📝 FAQ PUT /faqs/${faqId} requested`);
    
    // Check authentication
    const token = await validateAuthToken(c, "Update FAQ");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    const body = await c.req.json();
    console.log(`📝 Updating FAQ ${faqId}:`, body);

    // Validaciones
    if (!body.question || !body.answer) {
      return c.json(
        { error: 'La pregunta y respuesta son obligatorias' },
        400
      );
    }

    // Preparar datos para actualizar
    const faqData = {
      question: body.question.trim(),
      answer: body.answer.trim(),
      category: body.category || null,
      manual_md: body.manual_md || null,
      references_links: body.references_links || null,
      video_urls: body.video_urls || null,
      asset_id: body.asset_id || null
    };

    console.log('💾 Updating FAQ data:', faqData);

    const { data: updatedFAQ, error } = await supabase
      .from('faqs')
      .update(faqData)
      .eq('id', faqId)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error updating FAQ:', error);
      return c.json(
        { error: 'Error al actualizar la FAQ' },
        500
      );
    }

    if (!updatedFAQ) {
      return c.json(
        { error: 'FAQ no encontrada' },
        404
      );
    }

    console.log(`✅ FAQ updated successfully: ${updatedFAQ.question}`);
    return c.json(updatedFAQ);

  } catch (error) {
    console.error('❌ FAQ PUT Error:', error);
    return c.json(
      { error: 'Error interno del servidor' },
      500
    );
  }
});

// FAQ endpoints - Delete FAQ
app.delete("/make-server-2e05cbde/faqs/:id", async (c) => {
  try {
    const faqId = c.req.param('id');
    console.log(`🗑️ FAQ DELETE /faqs/${faqId} requested`);
    
    // Check authentication
    const token = await validateAuthToken(c, "Delete FAQ");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    console.log(`🗑️ Deleting FAQ ${faqId}...`);

    const { data: deletedFAQ, error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', faqId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error deleting FAQ:', error);
      return c.json(
        { error: 'Error al eliminar la FAQ' },
        500
      );
    }

    if (!deletedFAQ) {
      return c.json(
        { error: 'FAQ no encontrada' },
        404
      );
    }

    console.log(`✅ FAQ deleted successfully: ${deletedFAQ.question}`);
    return c.json({ message: 'FAQ eliminada exitosamente' });

  } catch (error) {
    console.error('❌ FAQ DELETE Error:', error);
    return c.json(
      { error: 'Error interno del servidor' },
      500
    );
  }
});

// Login endpoint - validates token from frontend auth and checks admin role
app.post("/make-server-2e05cbde/auth/login", async (c) => {
  try {
    console.log("🔐 Server: Login validation started");
    const body = await c.req.json();
    const { access_token } = body;

    if (!access_token) {
      console.log("❌ Server: No access token provided");
      return c.json(
        { error: "Token de acceso requerido" },
        400,
      );
    }

    console.log("🔍 Server: Validating token...");

    // Validate token with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(access_token);

    if (authError || !user) {
      console.log(
        "❌ Server: Invalid token:",
        authError?.message,
      );
      return c.json(
        { error: "Token inválido o expirado" },
        401,
      );
    }

    console.log("✅ Server: Token valid for user:", user.id);

    // Get user profile and check admin role
    console.log("📋 Server: Fetching user profile...");
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select(
          `
        id,
        full_name,
        role_id,
        roles(name)
      `,
        )
        .eq("id", user.id)
        .single();

    if (profileError) {
      console.log("❌ Server: Profile error:", profileError);
      return c.json(
        {
          error:
            "Error obteniendo perfil de usuario: " +
            profileError.message,
        },
        500,
      );
    }

    if (!profile) {
      console.log("❌ Server: No profile found for user");
      return c.json(
        { error: "Perfil de usuario no encontrado" },
        404,
      );
    }

    console.log(
      "✅ Server: Profile found:",
      profile.full_name,
      "Role ID:",
      profile.role_id,
    );

    // Check if user has admin role (assuming role_id 1 is admin)
    if (profile.role_id !== 1) {
      console.log(
        "❌ Server: Usuario sin permisos de administrador:",
        profile.full_name,
        "Role ID:",
        profile.role_id,
      );
      return c.json(
        {
          error:
            "Acceso denegado. Solo los administradores pueden acceder al sistema.",
        },
        403,
      );
    }

    const userResponse = {
      id: user.id,
      email: user.email,
      full_name: profile.full_name,
      role_id: profile.role_id,
      role_name: profile.roles?.name,
    };

    console.log(
      "🎉 Server: Admin validation successful for:",
      userResponse.full_name,
    );

    return c.json({
      user: userResponse,
    });
  } catch (error) {
    console.log("💥 Server: Unexpected login error:", error);
    return c.json(
      { error: "Error interno del servidor: " + error.message },
      500,
    );
  }
});

app.get("/make-server-2e05cbde/auth/me", async (c) => {
  try {
    const token = await validateAuthToken(c, "Auth Me");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    console.log("🔍 Getting user data from validated token...");

    // Use Supabase token validation
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log("❌ Invalid token:", error?.message);
      return c.json(
        { error: "Token inválido o expirado" },
        401,
      );
    }

    console.log("✅ Token valid for user:", user.id);

    // Get user profile
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select(
          `
        id,
        full_name,
        role_id,
        roles(name)
      `,
        )
        .eq("id", user.id)
        .single();

    if (profileError) {
      console.log("❌ Profile error:", profileError);
      return c.json(
        { error: "Error obteniendo perfil de usuario" },
        500,
      );
    }

    if (!profile) {
      console.log("❌ No profile found for user");
      return c.json(
        { error: "Perfil de usuario no encontrado" },
        404,
      );
    }

    // Check if user has admin role
    if (profile.role_id !== 1) {
      console.log(
        "❌ Usuario sin permisos de administrador en validación de sesión:",
        profile.full_name,
      );
      return c.json(
        {
          error:
            "Acceso denegado. Solo los administradores pueden acceder.",
        },
        403,
      );
    }

    const userData = {
      id: user.id,
      email: user.email,
      full_name: profile.full_name,
      role_id: profile.role_id,
      role_name: profile.roles?.name,
    };

    console.log(
      "✅ Admin data retrieved for:",
      userData.full_name,
    );
    return c.json(userData);
  } catch (error) {
    console.log("💥 Me endpoint error:", error);
    return c.json({ error: "Error interno del servidor" }, 500);
  }
});

// Session validation endpoint
app.get("/make-server-2e05cbde/auth/validate", async (c) => {
  try {
    const token = await validateAuthToken(
      c,
      "Validate Session",
    );
    if (!token) {
      return c.json(
        {
          valid: false,
          error: "Token de autenticación requerido",
        },
        401,
      );
    }

    console.log("🔍 Validating session...");

    // Use Supabase token validation
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log(
        "❌ Session validation failed:",
        error?.message,
      );
      return c.json(
        { valid: false, error: "Sesión inválida o expirada" },
        401,
      );
    }

    console.log("✅ Session valid for user:", user.id);
    return c.json({
      valid: true,
      user_id: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log("💥 Session validation error:", error);
    return c.json(
      { valid: false, error: "Error validando sesión" },
      500,
    );
  }
});

// Dashboard stats endpoint
app.get("/make-server-2e05cbde/dashboard/stats", async (c) => {
  try {
    // Check authentication
    const token = await validateAuthToken(c, "Dashboard stats");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    // Get counts for each status according to DB schema:
    // 1=Disponible, 2=En Uso, 3=En Mantenimiento, 4=Retirado
    const [
      { count: totalAssets },
      { count: availableAssets },
      { count: inUseAssets },
      { count: maintenanceAssets },
      { count: retiredAssets },
    ] = await Promise.all([
      supabase
        .from("assets")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("assets")
        .select("*", { count: "exact", head: true })
        .eq("status_id", 1), // Disponible
      supabase
        .from("assets")
        .select("*", { count: "exact", head: true })
        .eq("status_id", 2), // En Uso
      supabase
        .from("assets")
        .select("*", { count: "exact", head: true })
        .eq("status_id", 3), // En Mantenimiento
      supabase
        .from("assets")
        .select("*", { count: "exact", head: true })
        .eq("status_id", 4), // Retirado
    ]);

    // Count assets with active loans (these are "En Préstamo")
    const { count: loanedAssets } = await supabase
      .from("loans")
      .select("asset_id", { count: "exact", head: true })
      .is("actual_checkin_date", null)
      .in("status", ["active", "overdue", "pending"]);

    // Get ticket stats
    const [
      { count: totalTickets },
      { count: openTickets },
      { count: inProgressTickets },
      { count: resolvedTickets },
    ] = await Promise.all([
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "abierto"),
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "en_progreso"),
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .in("status", ["resuelto", "cerrado"]),
    ]);

    return c.json({
      totalAssets: totalAssets || 0,
      availableAssets: availableAssets || 0,
      inUseAssets: inUseAssets || 0,
      loanedAssets: loanedAssets || 0,
      maintenanceAssets: maintenanceAssets || 0,
      retiredAssets: retiredAssets || 0,
      totalTickets: totalTickets || 0,
      openTickets: openTickets || 0,
      inProgressTickets: inProgressTickets || 0,
      resolvedTickets: resolvedTickets || 0,
    });
  } catch (error) {
    console.log("💥 Error fetching dashboard stats:", error);
    return c.json(
      { error: "Failed to fetch dashboard stats" },
      500,
    );
  }
});

// Asset status distribution for chart
app.get(
  "/make-server-2e05cbde/dashboard/asset-status",
  async (c) => {
    try {
      // Check authentication
      const token = await validateAuthToken(c, "Asset status");
      if (!token) {
        return c.json(
          { error: "Token de autenticación requerido" },
          401,
        );
      }

      const { data, error } = await supabase.from("assets")
        .select(`
        status_id,
        asset_status(name)
      `);

      if (error) throw error;

      // Group by status
      const statusCounts = data.reduce(
        (acc: any, asset: any) => {
          const statusName =
            asset.asset_status?.name || "Unknown";
          acc[statusName] = (acc[statusName] || 0) + 1;
          return acc;
        },
        {},
      );

      const chartData = Object.entries(statusCounts).map(
        ([name, value]) => ({
          name,
          value,
        }),
      );

      return c.json(chartData);
    } catch (error) {
      console.log(
        "💥 Error fetching asset status distribution:",
        error,
      );
      return c.json(
        { error: "Failed to fetch asset status distribution" },
        500,
      );
    }
  },
);

// Asset types distribution for chart
app.get(
  "/make-server-2e05cbde/dashboard/asset-types",
  async (c) => {
    try {
      // Check authentication
      const token = await validateAuthToken(c, "Asset types");
      if (!token) {
        return c.json(
          { error: "Token de autenticación requerido" },
          401,
        );
      }

      const { data, error } = await supabase.from("assets")
        .select(`
        type_id,
        asset_types(name)
      `);

      if (error) throw error;

      // Group by type
      const typeCounts = data.reduce((acc: any, asset: any) => {
        const typeName = asset.asset_types?.name || "Unknown";
        acc[typeName] = (acc[typeName] || 0) + 1;
        return acc;
      }, {});

      const chartData = Object.entries(typeCounts).map(
        ([name, cantidad]) => ({
          name,
          cantidad,
        }),
      );

      return c.json(chartData);
    } catch (error) {
      console.log(
        "💥 Error fetching asset types distribution:",
        error,
      );
      return c.json(
        { error: "Failed to fetch asset types distribution" },
        500,
      );
    }
  },
);

// Recent activity feed
app.get(
  "/make-server-2e05cbde/dashboard/recent-activity",
  async (c) => {
    try {
      // Check authentication
      const token = await validateAuthToken(
        c,
        "Recent activity",
      );
      if (!token) {
        return c.json(
          { error: "Token de autenticación requerido" },
          401,
        );
      }

      // Get recent loans
      const { data: recentLoans } = await supabase
        .from("loans")
        .select(
          `
        id,
        checkout_date,
        actual_checkin_date,
        status,
        assets(name),
        profiles(full_name)
      `,
        )
        .order("checkout_date", { ascending: false })
        .limit(5);

      // Get recent tickets
      const { data: recentTickets } = await supabase
        .from("tickets")
        .select(
          `
        id,
        title,
        created_at,
        status,
        assets(name)
      `,
        )
        .order("created_at", { ascending: false })
        .limit(5);

      const activities = [];

      // Process loans
      if (recentLoans) {
        recentLoans.forEach((loan) => {
          if (loan.actual_checkin_date) {
            activities.push({
              id: `loan-return-${loan.id}`,
              type: "return",
              message: `Equipo devuelto: ${loan.assets?.name} por ${loan.profiles?.full_name}`,
              timestamp: new Date(
                loan.actual_checkin_date,
              ).toISOString(),
              user: loan.profiles?.full_name,
            });
          } else {
            activities.push({
              id: `loan-${loan.id}`,
              type: "loan",
              message: `Préstamo iniciado: ${loan.assets?.name} a ${loan.profiles?.full_name}`,
              timestamp: new Date(
                loan.checkout_date,
              ).toISOString(),
              user: loan.profiles?.full_name,
            });
          }
        });
      }

      // Process tickets
      if (recentTickets) {
        recentTickets.forEach((ticket) => {
          activities.push({
            id: `ticket-${ticket.id}`,
            type: "ticket",
            message: `Ticket creado: ${ticket.title} para ${ticket.assets?.name}`,
            timestamp: new Date(
              ticket.created_at,
            ).toISOString(),
          });
        });
      }

      // Sort by timestamp and limit to 10 most recent
      const sortedActivities = activities
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() -
            new Date(a.timestamp).getTime(),
        )
        .slice(0, 10)
        .map((activity) => ({
          ...activity,
          timestamp: formatTimeAgo(activity.timestamp),
        }));

      return c.json(sortedActivities);
    } catch (error) {
      console.log("💥 Error fetching recent activity:", error);
      return c.json(
        { error: "Failed to fetch recent activity" },
        500,
      );
    }
  },
);

// Get all assets
app.get("/make-server-2e05cbde/assets", async (c) => {
  try {
    // Check authentication
    const token = await validateAuthToken(c, "Assets");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    // Get query parameters for filtering
    const statusFilter = c.req.query("status");

    let query = supabase.from("assets").select(`
        id,
        name,
        qr_code,
        serial_number,
        description,
        purchase_date,
        status_id,
        type_id,
        created_at,
        asset_types(id, name, description),
        asset_status(id, name)
      `);

    // Apply status filter if provided
    if (statusFilter) {
      const statuses = statusFilter.split(",");
      const statusIds = [];

      // Map status names to IDs
      for (const status of statuses) {
        switch (status.toLowerCase()) {
          case "available":
            statusIds.push(1);
            break;
          case "in_use":
            statusIds.push(2);
            break;
          case "maintenance":
            statusIds.push(3);
            break;
          case "retired":
            statusIds.push(4);
            break;
        }
      }

      if (statusIds.length > 0) {
        query = query.in("status_id", statusIds);
      }
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    // For each asset, check if it has an active loan and determine real status
    const assetsWithLoans = await Promise.all(
      data.map(async (asset) => {
        const { data: currentLoan } = await supabase
          .from("loans")
          .select(
            `
            id,
            user_id,
            checkout_date,
            expected_checkin_date,
            status,
            profiles(full_name)
          `,
          )
          .eq("asset_id", asset.id)
          .is("actual_checkin_date", null)
          .in("status", ["active", "overdue", "pending"]) // Consider these as active loans
          .order("checkout_date", { ascending: false })
          .limit(1)
          .single();

        // Determine the real status based on loan status
        let realStatus = asset.asset_status;
        if (currentLoan) {
          // If there's an active loan, override the status to "En Préstamo"
          // Note: "En Préstamo" is not a DB status, it's a virtual status for display
          realStatus = {
            id: 99, // Virtual ID for "En Préstamo"
            name: "En Préstamo",
          };
        }

        return {
          ...asset,
          asset_status: realStatus, // Override with real status
          current_loan: currentLoan || null,
        };
      }),
    );

    return c.json(assetsWithLoans);
  } catch (error) {
    console.log("💥 Error fetching assets:", error);
    return c.json({ error: "Failed to fetch assets" }, 500);
  }
});

// Get all tickets
app.get("/make-server-2e05cbde/tickets", async (c) => {
  try {
    // Check authentication
    const token = await validateAuthToken(c, "Tickets");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    const { data, error } = await supabase
      .from("tickets")
      .select(
        `
        id,
        title,
        description,
        status,
        priority,
        created_at,
        updated_at,
        asset_id,
        reported_by,
        assigned_to,
        assets(id, name, serial_number, asset_types(name)),
        reported_by_profile:profiles!tickets_reported_by_fkey(id, full_name),
        assigned_to_profile:profiles!tickets_assigned_to_fkey(id, full_name)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return c.json(data);
  } catch (error) {
    console.log("💥 Error fetching tickets:", error);
    return c.json({ error: "Failed to fetch tickets" }, 500);
  }
});

// Get profiles - filtered for ticket assignment
app.get("/make-server-2e05cbde/profiles", async (c) => {
  try {
    // Check authentication
    const token = await validateAuthToken(c, "Profiles");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    // Check if this is for assignment filtering
    const forAssignment = c.req.query("for_assignment");

    let query = supabase.from("profiles").select(`
        id,
        full_name,
        role_id,
        roles(name)
      `);

    // If for_assignment=true, only return technicians (role_id = 2)
    if (forAssignment === "true") {
      console.log(
        "📋 Server: Filtering profiles for technicians only (role_id = 2)",
      );
      query = query.eq("role_id", 2);
    }

    const { data, error } = await query.order("full_name", {
      ascending: true,
    });

    if (error) throw error;

    console.log(
      `✅ Server: Retrieved ${data.length} profiles${forAssignment === "true" ? " (technicians only)" : ""}`,
    );
    return c.json(data);
  } catch (error) {
    console.log("💥 Error fetching profiles:", error);
    return c.json({ error: "Failed to fetch profiles" }, 500);
  }
});

// Create new ticket
app.post("/make-server-2e05cbde/tickets", async (c) => {
  try {
    // Check authentication
    const token = await validateAuthToken(c, "Create ticket");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    const body = await c.req.json();
    const {
      title,
      description,
      priority,
      asset_id,
      assigned_to,
      reported_by,
      status,
    } = body;

    if (!title?.trim()) {
      return c.json({ error: "El título es obligatorio" }, 400);
    }

    const { data, error } = await supabase
      .from("tickets")
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || "media",
        asset_id: asset_id || null,
        assigned_to: assigned_to || null,
        reported_by: reported_by,
        status: status || "abierto",
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Ticket created successfully: ${data.id}`);
    return c.json(data);
  } catch (error) {
    console.log("💥 Error creating ticket:", error);
    return c.json(
      { error: "Failed to create ticket: " + error.message },
      500,
    );
  }
});

// Update ticket
app.patch("/make-server-2e05cbde/tickets/:id", async (c) => {
  try {
    console.log("🎫 Server: PATCH ticket request received");

    // Safely log headers without iterating
    try {
      const authHeader = c.req.header("Authorization");
      const contentType = c.req.header("Content-Type");
      console.log("🔍 Request headers:", {
        hasAuth: !!authHeader,
        contentType,
        authLength: authHeader?.length || 0,
      });
    } catch (headerError) {
      console.log(
        "⚠️ Server: Could not log headers:",
        headerError.message,
      );
    }

    // Check authentication
    const token = await validateAuthToken(c, "Update ticket");
    if (!token) {
      console.log(
        "❌ Server: Authentication failed for PATCH ticket",
      );
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    const ticketId = c.req.param("id");
    console.log("🎫 Server: Updating ticket ID:", ticketId);

    if (!ticketId || isNaN(parseInt(ticketId))) {
      console.log("❌ Server: Invalid ticket ID:", ticketId);
      return c.json({ error: "ID de ticket inválido" }, 400);
    }

    const body = await c.req.json();
    console.log("🎫 Server: Request body:", body);

    // Validate assignment - only technicians (role_id = 2) can be assigned
    if (
      body.assigned_to !== undefined &&
      body.assigned_to !== null
    ) {
      console.log(
        "🔍 Server: Validating assignment to user:",
        body.assigned_to,
      );

      const { data: assignedProfile, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, full_name, role_id")
          .eq("id", body.assigned_to)
          .single();

      if (profileError) {
        console.log(
          "❌ Server: Error fetching assigned user profile:",
          profileError,
        );
        return c.json(
          { error: "Usuario asignado no encontrado" },
          400,
        );
      }

      if (assignedProfile.role_id !== 2) {
        console.log(
          "❌ Server: User is not a technician. Role ID:",
          assignedProfile.role_id,
        );
        return c.json(
          {
            error:
              "Solo los técnicos (role_id = 2) pueden ser asignados a tickets",
          },
          400,
        );
      }

      console.log(
        "✅ Server: Assignment validated. User is a technician:",
        assignedProfile.full_name,
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Only update provided fields
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.status !== undefined)
      updateData.status = body.status;
    if (body.priority !== undefined)
      updateData.priority = body.priority;
    if (body.asset_id !== undefined)
      updateData.asset_id = body.asset_id;
    if (body.assigned_to !== undefined)
      updateData.assigned_to = body.assigned_to;

    console.log("🎫 Server: Update data:", updateData);

    const { data, error } = await supabase
      .from("tickets")
      .update(updateData)
      .eq("id", parseInt(ticketId))
      .select(
        `
        id,
        title,
        description,
        status,
        priority,
        created_at,
        updated_at,
        asset_id,
        reported_by,
        assigned_to,
        assets(id, name, serial_number),
        reported_by_profile:profiles!tickets_reported_by_fkey(id, full_name),
        assigned_to_profile:profiles!tickets_assigned_to_fkey(id, full_name)
      `,
      )
      .single();

    if (error) {
      console.log(
        "❌ Server: Database error updating ticket:",
        error,
      );
      throw error;
    }

    console.log(
      "✅ Server: Ticket updated successfully:",
      data.id,
    );
    return c.json(data);
  } catch (error) {
    console.log("💥 Server: Error updating ticket:", error);
    return c.json(
      { error: "Failed to update ticket: " + error.message },
      500,
    );
  }
});

// Start server
console.log("🚀 Server starting...");
// Get all loans/prestamos with full details including assets and user profiles
app.get("/make-server-2e05cbde/prestamos", async (c) => {
  try {
    // Check authentication
    const token = await validateAuthToken(c, "Prestamos");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    // Get query parameters for filtering and pagination
    const statusFilter = c.req.query("status");
    const searchQuery = c.req.query("search");
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "10");
    const offset = (page - 1) * limit;

    let query = supabase.from("loans").select(`
        id,
        asset_id,
        user_id,
        checkout_date,
        expected_checkin_date,
        actual_checkin_date,
        status,
        notes,
        assets(id, name, serial_number, asset_types(name)),
        profiles(id, full_name)
      `);

    // Apply status filter if provided
    if (statusFilter) {
      const statuses = statusFilter.split(",");
      query = query.in("status", statuses);
    }

    // Apply search filter if provided
    if (searchQuery) {
      query = query.or(
        `assets.name.ilike.%${searchQuery}%,profiles.full_name.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%`,
      );
    }

    // Get total count for pagination
    const { count } = await supabase
      .from("loans")
      .select("*", { count: "exact", head: true });

    // Apply pagination and ordering
    const { data, error } = await query
      .order("checkout_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Calculate derived status for each loan
    const loansWithStatus = data.map((loan) => {
      let derivedStatus = loan.status;

      if (loan.actual_checkin_date) {
        derivedStatus = "returned";
      } else {
        const today = new Date();
        const expectedDate = new Date(
          loan.expected_checkin_date,
        );

        if (today > expectedDate) {
          derivedStatus = "overdue";
        } else if (!loan.status || loan.status === "pending") {
          derivedStatus = "active";
        }
      }

      return {
        ...loan,
        derived_status: derivedStatus,
      };
    });

    return c.json({
      data: loansWithStatus,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.log("💥 Error fetching prestamos:", error);
    return c.json({ error: "Failed to fetch prestamos" }, 500);
  }
});

// Get single loan/prestamo by ID
app.get("/make-server-2e05cbde/prestamos/:id", async (c) => {
  try {
    // Check authentication
    const token = await validateAuthToken(c, "Get prestamo");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    const loanId = c.req.param("id");

    if (!loanId || isNaN(parseInt(loanId))) {
      return c.json({ error: "ID de préstamo inválido" }, 400);
    }

    const { data, error } = await supabase
      .from("loans")
      .select(
        `
        id,
        asset_id,
        user_id,
        checkout_date,
        expected_checkin_date,
        actual_checkin_date,
        status,
        notes,
        assets(id, name, serial_number, description, asset_types(name)),
        profiles(id, full_name)
      `,
      )
      .eq("id", loanId)
      .single();

    if (error) throw error;

    if (!data) {
      return c.json({ error: "Préstamo no encontrado" }, 404);
    }

    // Calculate derived status
    let derivedStatus = data.status;

    if (data.actual_checkin_date) {
      derivedStatus = "returned";
    } else {
      const today = new Date();
      const expectedDate = new Date(data.expected_checkin_date);

      if (today > expectedDate) {
        derivedStatus = "overdue";
      } else if (!data.status || data.status === "pending") {
        derivedStatus = "active";
      }
    }

    return c.json({
      ...data,
      derived_status: derivedStatus,
    });
  } catch (error) {
    console.log("💥 Error fetching prestamo:", error);
    return c.json({ error: "Failed to fetch prestamo" }, 500);
  }
});

// Create new loan/prestamo
app.post("/make-server-2e05cbde/prestamos", async (c) => {
  try {
    // Check authentication
    const token = await validateAuthToken(c, "Create prestamo");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    const body = await c.req.json();
    const {
      asset_id,
      user_id,
      checkout_date,
      expected_checkin_date,
      status,
      notes,
    } = body;

    if (
      !asset_id ||
      !user_id ||
      !checkout_date ||
      !expected_checkin_date
    ) {
      return c.json(
        {
          error:
            "Los campos asset_id, user_id, checkout_date y expected_checkin_date son obligatorios",
        },
        400,
      );
    }

    // Validate that the asset exists and is available
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("id, name, status_id, asset_status(name)")
      .eq("id", asset_id)
      .single();

    if (assetError || !asset) {
      return c.json({ error: "Equipo no encontrado" }, 400);
    }

    if (asset.asset_status?.name !== "Disponible") {
      return c.json(
        { error: "El equipo no está disponible para préstamo" },
        400,
      );
    }

    // Check if asset already has an active loan
    const { data: existingLoan } = await supabase
      .from("loans")
      .select("id")
      .eq("asset_id", asset_id)
      .is("actual_checkin_date", null)
      .in("status", ["active", "overdue", "pending"])
      .single();

    if (existingLoan) {
      return c.json(
        { error: "El equipo ya tiene un préstamo activo" },
        400,
      );
    }

    // Validate that the user exists
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", user_id)
      .single();

    if (userError || !user) {
      return c.json({ error: "Usuario no encontrado" }, 400);
    }

    const { data, error } = await supabase
      .from("loans")
      .insert({
        asset_id: asset_id,
        user_id: user_id,
        checkout_date: checkout_date,
        expected_checkin_date: expected_checkin_date,
        status: status || "active",
        notes: notes?.trim() || null,
      })
      .select(
        `
        id,
        asset_id,
        user_id,
        checkout_date,
        expected_checkin_date,
        actual_checkin_date,
        status,
        notes,
        assets(id, name, serial_number, asset_types(name)),
        profiles(id, full_name)
      `,
      )
      .single();

    if (error) throw error;

    console.log(
      `✅ Loan created successfully: ${data.id} - Asset: ${asset.name} to User: ${user.full_name}`,
    );

    // Calculate derived status
    let derivedStatus = data.status;

    if (data.actual_checkin_date) {
      derivedStatus = "returned";
    } else {
      const today = new Date();
      const expectedDate = new Date(data.expected_checkin_date);

      if (today > expectedDate) {
        derivedStatus = "overdue";
      } else if (!data.status || data.status === "pending") {
        derivedStatus = "active";
      }
    }

    return c.json({
      ...data,
      derived_status: derivedStatus,
    });
  } catch (error) {
    console.log("💥 Error creating prestamo:", error);
    return c.json(
      { error: "Failed to create prestamo: " + error.message },
      500,
    );
  }
});

// Update loan/prestamo
app.patch("/make-server-2e05cbde/prestamos/:id", async (c) => {
  try {
    console.log("🏦 Server: PATCH prestamo request received");

    // Check authentication
    const token = await validateAuthToken(c, "Update prestamo");
    if (!token) {
      console.log(
        "❌ Server: Authentication failed for PATCH prestamo",
      );
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    const loanId = c.req.param("id");
    console.log("🏦 Server: Updating prestamo ID:", loanId);

    if (!loanId || isNaN(parseInt(loanId))) {
      console.log("❌ Server: Invalid prestamo ID:", loanId);
      return c.json({ error: "ID de préstamo inválido" }, 400);
    }

    const body = await c.req.json();
    console.log("🏦 Server: Request body:", body);

    const updateData: any = {};

    // Only update provided fields
    if (body.asset_id !== undefined)
      updateData.asset_id = body.asset_id;
    if (body.user_id !== undefined)
      updateData.user_id = body.user_id;
    if (body.checkout_date !== undefined)
      updateData.checkout_date = body.checkout_date;
    if (body.expected_checkin_date !== undefined)
      updateData.expected_checkin_date =
        body.expected_checkin_date;
    if (body.actual_checkin_date !== undefined)
      updateData.actual_checkin_date = body.actual_checkin_date;
    if (body.status !== undefined)
      updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;

    console.log("🏦 Server: Update data:", updateData);

    const { data, error } = await supabase
      .from("loans")
      .update(updateData)
      .eq("id", loanId)
      .select(
        `
        id,
        asset_id,
        user_id,
        checkout_date,
        expected_checkin_date,
        actual_checkin_date,
        status,
        notes,
        assets(id, name, serial_number, asset_types(name)),
        profiles(id, full_name)
      `,
      )
      .single();

    if (error) {
      console.log(
        "❌ Server: Database error updating prestamo:",
        error,
      );
      return c.json(
        {
          error:
            "Error actualizando préstamo: " + error.message,
        },
        500,
      );
    }

    if (!data) {
      console.log("❌ Server: Prestamo not found:", loanId);
      return c.json({ error: "Préstamo no encontrado" }, 404);
    }

    console.log(
      "✅ Server: Prestamo updated successfully:",
      data.id,
    );

    // Calculate derived status
    let derivedStatus = data.status;

    if (data.actual_checkin_date) {
      derivedStatus = "returned";
    } else {
      const today = new Date();
      const expectedDate = new Date(data.expected_checkin_date);

      if (today > expectedDate) {
        derivedStatus = "overdue";
      } else if (!data.status || data.status === "pending") {
        derivedStatus = "active";
      }
    }

    return c.json({
      ...data,
      derived_status: derivedStatus,
    });
  } catch (error) {
    console.log("💥 Error updating prestamo:", error);
    return c.json(
      { error: "Failed to update prestamo: " + error.message },
      500,
    );
  }
});

// Get asset_status lookup data
app.get("/make-server-2e05cbde/asset-status", async (c) => {
  try {
    console.log("🏷️ Server: Asset status request received");

    // Check authentication
    const token = await validateAuthToken(
      c,
      "Get asset status",
    );
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    const { data, error } = await supabase
      .from("asset_status")
      .select("id, name")
      .order("id", { ascending: true });

    if (error) throw error;

    console.log(
      `✅ Server: Retrieved ${data.length} asset statuses`,
    );
    return c.json(data);
  } catch (error) {
    console.log("💥 Error fetching asset status:", error);
    return c.json(
      {
        error: "Failed to fetch asset status: " + error.message,
      },
      500,
    );
  }
});

// Get asset_types lookup data
app.get("/make-server-2e05cbde/asset-types", async (c) => {
  try {
    console.log("🏷️ Server: Asset types request received");

    // Check authentication
    const token = await validateAuthToken(c, "Get asset types");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    const { data, error } = await supabase
      .from("asset_types")
      .select("id, name, description")
      .order("name", { ascending: true });

    if (error) throw error;

    console.log(
      `✅ Server: Retrieved ${data.length} asset types`,
    );
    return c.json(data);
  } catch (error) {
    console.log("💥 Error fetching asset types:", error);
    return c.json(
      {
        error: "Failed to fetch asset types: " + error.message,
      },
      500,
    );
  }
});

// CREATE asset endpoint
app.post("/make-server-2e05cbde/assets", async (c) => {
  try {
    console.log("📦 Server: POST asset request received");

    // Check authentication
    const token = await validateAuthToken(c, "Create asset");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    const body = await c.req.json();
    console.log("📦 Server: Request body:", body);

    const {
      name,
      serial_number,
      description,
      purchase_date,
      status_id,
      type_id,
    } = body;

    // Validate required fields
    if (!name?.trim()) {
      return c.json({ error: "El nombre es obligatorio" }, 400);
    }

    if (!serial_number?.trim()) {
      return c.json(
        { error: "El número de serie es obligatorio" },
        400,
      );
    }

    if (!status_id || !Number.isInteger(status_id)) {
      return c.json(
        {
          error:
            "El estado es obligatorio y debe ser un número entero",
        },
        400,
      );
    }

    if (!type_id || !Number.isInteger(type_id)) {
      return c.json(
        {
          error:
            "El tipo de equipo es obligatorio y debe ser un número entero",
        },
        400,
      );
    }

    // Validate foreign keys exist
    const { data: statusExists } = await supabase
      .from("asset_status")
      .select("id")
      .eq("id", status_id)
      .single();

    if (!statusExists) {
      return c.json(
        { error: "El estado especificado no existe" },
        400,
      );
    }

    const { data: typeExists } = await supabase
      .from("asset_types")
      .select("id")
      .eq("id", type_id)
      .single();

    if (!typeExists) {
      return c.json(
        { error: "El tipo de equipo especificado no existe" },
        400,
      );
    }

    // Generate UUID for QR code
    const qr_code = crypto.randomUUID();

    const { data, error } = await supabase
      .from("assets")
      .insert({
        name: name.trim(),
        serial_number: serial_number.trim(),
        description: description?.trim() || null,
        purchase_date: purchase_date || null,
        status_id,
        type_id,
        qr_code,
        created_at: new Date().toISOString(),
      })
      .select(
        `
        id,
        name,
        qr_code,
        serial_number,
        description,
        purchase_date,
        status_id,
        type_id,
        created_at
      `,
      )
      .single();

    if (error) {
      console.log("❌ Server: Create asset error:", error);

      // Handle unique constraint violations
      if (
        error.code === "23505" &&
        error.message.includes("serial_number")
      ) {
        return c.json(
          {
            error:
              "El número de serie ya existe. Debe ser único.",
          },
          400,
        );
      }

      throw error;
    }

    console.log(
      "✅ Server: Asset created successfully:",
      data.id,
    );
    return c.json(data);
  } catch (error) {
    console.log("💥 Error creating asset:", error);
    return c.json(
      { error: "Failed to create asset: " + error.message },
      500,
    );
  }
});

// UPDATE asset endpoint
app.patch("/make-server-2e05cbde/assets/:id", async (c) => {
  try {
    console.log("📦 Server: PATCH asset request received");

    // Check authentication
    const token = await validateAuthToken(c, "Update asset");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    const assetId = c.req.param("id");
    console.log("📦 Server: Updating asset ID:", assetId);

    if (!assetId || isNaN(parseInt(assetId))) {
      console.log("❌ Server: Invalid asset ID:", assetId);
      return c.json({ error: "ID de equipo inválido" }, 400);
    }

    const body = await c.req.json();
    console.log("📦 Server: Request body:", body);

    const {
      name,
      serial_number,
      description,
      purchase_date,
      status_id,
      type_id,
    } = body;

    // Validate required fields
    if (!name?.trim()) {
      return c.json({ error: "El nombre es obligatorio" }, 400);
    }

    if (!serial_number?.trim()) {
      return c.json(
        { error: "El número de serie es obligatorio" },
        400,
      );
    }

    if (!status_id || !Number.isInteger(status_id)) {
      return c.json(
        {
          error:
            "El estado es obligatorio y debe ser un número entero",
        },
        400,
      );
    }

    if (!type_id || !Number.isInteger(type_id)) {
      return c.json(
        {
          error:
            "El tipo de equipo es obligatorio y debe ser un número entero",
        },
        400,
      );
    }

    // Validate foreign keys exist
    const { data: statusExists } = await supabase
      .from("asset_status")
      .select("id")
      .eq("id", status_id)
      .single();

    if (!statusExists) {
      return c.json(
        { error: "El estado especificado no existe" },
        400,
      );
    }

    const { data: typeExists } = await supabase
      .from("asset_types")
      .select("id")
      .eq("id", type_id)
      .single();

    if (!typeExists) {
      return c.json(
        { error: "El tipo de equipo especificado no existe" },
        400,
      );
    }

    const { data, error } = await supabase
      .from("assets")
      .update({
        name: name.trim(),
        serial_number: serial_number.trim(),
        description: description?.trim() || null,
        purchase_date: purchase_date || null,
        status_id,
        type_id,
      })
      .eq("id", parseInt(assetId))
      .select(
        `
        id,
        name,
        qr_code,
        serial_number,
        description,
        purchase_date,
        status_id,
        type_id,
        created_at
      `,
      )
      .single();

    if (error) {
      console.log("❌ Server: Update asset error:", error);

      // Handle unique constraint violations
      if (
        error.code === "23505" &&
        error.message.includes("serial_number")
      ) {
        return c.json(
          {
            error:
              "El número de serie ya existe. Debe ser único.",
          },
          400,
        );
      }

      throw error;
    }

    console.log(
      "✅ Server: Asset updated successfully:",
      data.id,
    );
    return c.json(data);
  } catch (error) {
    console.log("💥 Error updating asset:", error);
    return c.json(
      { error: "Failed to update asset: " + error.message },
      500,
    );
  }
});

// GET loans endpoint with search and pagination
app.get("/make-server-2e05cbde/prestamos", async (c) => {
  try {
    console.log("📚 Server: Loans request received");

    // Check authentication
    const token = await validateAuthToken(c, "Get loans");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    // Get query parameters
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "10");
    const search = c.req.query("search");
    const status = c.req.query("status");
    const offset = (page - 1) * limit;

    console.log("📚 Server: Query params:", {
      page,
      limit,
      search,
      status,
      offset,
    });

    // Build base query
    let countQuery = supabase
      .from("loans")
      .select("*", { count: "exact", head: true });

    let dataQuery = supabase.from("loans").select(`
        id,
        asset_id,
        user_id,
        checkout_date,
        expected_checkin_date,
        actual_checkin_date,
        status,
        notes,
        derived_status,
        assets(
          id,
          name,
          serial_number,
          description,
          asset_types(name)
        ),
        profiles(
          id,
          full_name
        )
      `);

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchTerm = search.trim();
      console.log(
        "🔍 Server: Applying search filter:",
        searchTerm,
      );

      // Search in asset name, user name, and notes
      const searchFilter = `assets.name.ilike.%${searchTerm}%,profiles.full_name.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`;

      countQuery = countQuery.or(searchFilter);
      dataQuery = dataQuery.or(searchFilter);
    }

    // Apply status filter if provided
    if (status && status !== "all") {
      console.log("📊 Server: Applying status filter:", status);
      countQuery = countQuery.eq("status", status);
      dataQuery = dataQuery.eq("status", status);
    }

    // Get total count
    const { count: totalCount, error: countError } =
      await countQuery;

    if (countError) {
      console.log("❌ Server: Count query error:", countError);
      throw countError;
    }

    // Get paginated data
    const { data: loans, error: dataError } = await dataQuery
      .order("checkout_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (dataError) {
      console.log("❌ Server: Data query error:", dataError);
      throw dataError;
    }

    const totalPages = Math.ceil((totalCount || 0) / limit);

    console.log(
      `✅ Server: Retrieved ${loans?.length || 0} loans (${totalCount} total)`,
    );

    return c.json({
      data: loans || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages,
      },
    });
  } catch (error) {
    console.log("💥 Error fetching loans:", error);
    return c.json(
      { error: "Failed to fetch loans: " + error.message },
      500,
    );
  }
});

// UPDATE loan endpoint
app.patch("/make-server-2e05cbde/prestamos/:id", async (c) => {
  try {
    console.log("📚 Server: PATCH loan request received");

    // Check authentication
    const token = await validateAuthToken(c, "Update loan");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    const loanId = c.req.param("id");
    console.log("📚 Server: Updating loan ID:", loanId);

    if (!loanId || isNaN(parseInt(loanId))) {
      console.log("❌ Server: Invalid loan ID:", loanId);
      return c.json({ error: "ID de préstamo inválido" }, 400);
    }

    const body = await c.req.json();
    console.log("📚 Server: Request body:", body);

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Only update provided fields
    if (body.asset_id !== undefined)
      updateData.asset_id = body.asset_id;
    if (body.user_id !== undefined)
      updateData.user_id = body.user_id;
    if (body.checkout_date !== undefined)
      updateData.checkout_date = body.checkout_date;
    if (body.expected_checkin_date !== undefined)
      updateData.expected_checkin_date =
        body.expected_checkin_date;
    if (body.actual_checkin_date !== undefined)
      updateData.actual_checkin_date = body.actual_checkin_date;
    if (body.status !== undefined)
      updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;

    console.log("📚 Server: Update data:", updateData);

    const { data, error } = await supabase
      .from("loans")
      .update(updateData)
      .eq("id", parseInt(loanId))
      .select(
        `
        id,
        asset_id,
        user_id,
        checkout_date,
        expected_checkin_date,
        actual_checkin_date,
        status,
        notes,
        derived_status,
        assets(
          id,
          name,
          serial_number,
          description,
          asset_types(name)
        ),
        profiles(
          id,
          full_name
        )
      `,
      )
      .single();

    if (error) {
      console.log("❌ Server: Update loan error:", error);
      throw error;
    }

    console.log(
      "✅ Server: Loan updated successfully:",
      data.id,
    );
    return c.json(data);
  } catch (error) {
    console.log("💥 Error updating loan:", error);
    return c.json(
      { error: "Failed to update loan: " + error.message },
      500,
    );
  }
});

// CREATE loan endpoint
app.post("/make-server-2e05cbde/prestamos", async (c) => {
  try {
    console.log("📚 Server: POST loan request received");

    // Check authentication
    const token = await validateAuthToken(c, "Create loan");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    const body = await c.req.json();
    console.log("📚 Server: Request body:", body);

    const {
      asset_id,
      user_id,
      checkout_date,
      expected_checkin_date,
      actual_checkin_date,
      status,
      notes,
    } = body;

    if (!asset_id || !user_id) {
      return c.json(
        { error: "El equipo y usuario son obligatorios" },
        400,
      );
    }

    const { data, error } = await supabase
      .from("loans")
      .insert({
        asset_id,
        user_id,
        checkout_date:
          checkout_date || new Date().toISOString(),
        expected_checkin_date,
        actual_checkin_date: actual_checkin_date || null,
        status: status || "active",
        notes: notes || null,
      })
      .select(
        `
        id,
        asset_id,
        user_id,
        checkout_date,
        expected_checkin_date,
        actual_checkin_date,
        status,
        notes,
        derived_status,
        assets(
          id,
          name,
          serial_number,
          description,
          asset_types(name)
        ),
        profiles(
          id,
          full_name
        )
      `,
      )
      .single();

    if (error) {
      console.log("❌ Server: Create loan error:", error);
      throw error;
    }

    console.log(
      "✅ Server: Loan created successfully:",
      data.id,
    );
    return c.json(data);
  } catch (error) {
    console.log("💥 Error creating loan:", error);
    return c.json(
      { error: "Failed to create loan: " + error.message },
      500,
    );
  }
});

// ============================================================================
// ASSET TYPES ENDPOINTS
// ============================================================================

// GET /asset-types - List all asset types
app.get("/make-server-2e05cbde/asset-types", async (c) => {
  try {
    console.log("📋 Server: GET asset-types request received");

    // Check authentication
    const token = await validateAuthToken(c, "Get asset-types");
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    const { data, error } = await supabase
      .from("asset_types")
      .select("id, name, description, created_at")
      .order("name", { ascending: true });

    if (error) {
      console.log("❌ Server: Asset types error:", error);
      throw error;
    }

    console.log(
      `✅ Server: Retrieved ${data.length} asset types`,
    );
    return c.json(data);
  } catch (error) {
    console.log("💥 Error fetching asset types:", error);
    return c.json(
      { error: "Failed to fetch asset types" },
      500,
    );
  }
});

// POST /asset-types - Create new asset type
app.post("/make-server-2e05cbde/asset-types", async (c) => {
  try {
    console.log("📋 Server: POST asset-types request received");

    // Check authentication
    const token = await validateAuthToken(
      c,
      "Create asset-type",
    );
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    const body = await c.req.json();
    console.log("📋 Server: Request body:", body);

    const { name, description } = body;

    // Validate required fields
    if (!name?.trim()) {
      return c.json(
        {
          error: "El nombre del tipo de equipo es obligatorio",
        },
        400,
      );
    }

    // Check if asset type already exists
    const { data: existing } = await supabase
      .from("asset_types")
      .select("id, name")
      .eq("name", name.trim())
      .single();

    if (existing) {
      return c.json(
        {
          error: `Ya existe un tipo de equipo con el nombre "${name.trim()}"`,
        },
        400,
      );
    }

    // Create the asset type
    const { data, error } = await supabase
      .from("asset_types")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
      })
      .select("id, name, description, created_at")
      .single();

    if (error) {
      console.log("❌ Server: Create asset type error:", error);
      throw error;
    }

    console.log(
      "✅ Server: Asset type created successfully:",
      data.id,
    );
    return c.json(data);
  } catch (error) {
    console.log("💥 Error creating asset type:", error);
    return c.json(
      {
        error: "Failed to create asset type: " + error.message,
      },
      500,
    );
  }
});

// GET /asset-status - List all asset statuses
app.get("/make-server-2e05cbde/asset-status", async (c) => {
  try {
    console.log("📋 Server: GET asset-status request received");

    // Check authentication
    const token = await validateAuthToken(
      c,
      "Get asset-status",
    );
    if (!token) {
      return c.json(
        { error: "Token de autenticación requerido" },
        401,
      );
    }

    const { data, error } = await supabase
      .from("asset_status")
      .select("id, name")
      .order("id", { ascending: true });

    if (error) {
      console.log("❌ Server: Asset status error:", error);
      throw error;
    }

    console.log(
      `✅ Server: Retrieved ${data.length} asset statuses`,
    );
    return c.json(data);
  } catch (error) {
    console.log("💥 Error fetching asset statuses:", error);
    return c.json(
      { error: "Failed to fetch asset statuses" },
      500,
    );
  }
});

Deno.serve(app.fetch);