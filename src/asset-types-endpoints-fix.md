# Fix para Asset Types Endpoints

## Problema Identificado
Los endpoints para asset-types están definidos en `/supabase/functions/server/asset-types-endpoints.tsx` pero no están incluidos en el archivo principal del servidor `/supabase/functions/server/index.tsx`. Esto causa que la interfaz no pueda obtener los tipos de equipos desde la base de datos.

## Solución
Agregar los siguientes endpoints al archivo `/supabase/functions/server/index.tsx` antes de la línea `export default { fetch: app.fetch.bind(app) }`:

```typescript
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
    const token = await validateAuthToken(c, "Get asset-status");
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
```

## Ubicación Exacta
Estos endpoints deben agregarse en el archivo `/supabase/functions/server/index.tsx` después del último endpoint existente y antes de la línea final `export default { fetch: app.fetch.bind(app) }`.

## Resultado Esperado
Una vez aplicada esta corrección:

1. El endpoint `/asset-types` estará disponible para el componente `CreateAssetDialog`
2. Los tipos de equipos se cargarán desde la base de datos en lugar de estar estáticos
3. El componente `CreateAssetTypeDialog` podrá crear nuevos tipos correctamente
4. La interfaz mostrará todos los tipos de equipos reales de la BD

## Verificación
Para verificar que funciona:

1. Abrir el formulario de crear equipo
2. El dropdown de "Tipo de Equipo" debe mostrar los tipos reales de la BD
3. Crear un nuevo tipo de equipo usando el diálogo
4. El nuevo tipo debe aparecer inmediatamente en el dropdown
