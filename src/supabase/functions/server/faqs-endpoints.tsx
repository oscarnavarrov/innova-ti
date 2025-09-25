import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Create a Supabase client with the service role key for server operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function handleFAQsEndpoints(request: Request, pathname: string): Promise<Response> {
  console.log(`📝 FAQ Request: ${request.method} ${pathname}`)

  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header')
      return new Response(
        JSON.stringify({ error: 'Token de autorización requerido' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.split(' ')[1]
    
    // Verificar el token con Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.log('❌ Invalid token:', authError)
      return new Response(
        JSON.stringify({ error: 'Token inválido o expirado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verificar que el usuario sea administrador
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role_id, active')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('❌ Profile not found:', profileError)
      return new Response(
        JSON.stringify({ error: 'Perfil de usuario no encontrado' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (profile.role_id !== 1) {
      console.log('❌ User is not admin:', profile)
      return new Response(
        JSON.stringify({ error: 'Solo los administradores pueden acceder a este recurso' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!profile.active) {
      console.log('❌ User account is inactive:', profile)
      return new Response(
        JSON.stringify({ error: 'Cuenta de usuario inactiva' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Routing de FAQs
    if (pathname === '/faqs') {
      if (request.method === 'GET') {
        return await getFAQs()
      } else if (request.method === 'POST') {
        return await createFAQ(request, user.id)
      }
    } else if (pathname.startsWith('/faqs/')) {
      const faqId = pathname.split('/')[2]
      if (request.method === 'GET') {
        return await getFAQ(faqId)
      } else if (request.method === 'PUT') {
        return await updateFAQ(request, faqId, user.id)
      } else if (request.method === 'DELETE') {
        return await deleteFAQ(faqId, user.id)
      }
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint no encontrado' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ FAQ Endpoints Error:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// GET /faqs - Obtener todas las FAQs
async function getFAQs(): Promise<Response> {
  try {
    console.log('📖 Fetching all FAQs...')
    
    const { data: faqs, error } = await supabase
      .from('faqs')
      .select(`
        *,
        profiles:created_by (
          full_name
        ),
        assets:asset_id (
          name,
          serial_number,
          asset_types (
            name
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching FAQs:', error)
      return new Response(
        JSON.stringify({ error: 'Error al obtener las FAQs' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Found ${faqs?.length || 0} FAQs`)
    return new Response(
      JSON.stringify(faqs || []),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Get FAQs Error:', error)
    return new Response(
      JSON.stringify({ error: 'Error al obtener las FAQs' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// GET /faqs/:id - Obtener una FAQ específica
async function getFAQ(faqId: string): Promise<Response> {
  try {
    console.log(`📖 Fetching FAQ ${faqId}...`)
    
    const { data: faq, error } = await supabase
      .from('faqs')
      .select(`
        *,
        profiles:created_by (
          full_name
        ),
        assets:asset_id (
          name,
          serial_number,
          asset_types (
            name
          )
        )
      `)
      .eq('id', faqId)
      .single()

    if (error) {
      console.error('❌ Error fetching FAQ:', error)
      return new Response(
        JSON.stringify({ error: 'FAQ no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Found FAQ: ${faq.question}`)
    return new Response(
      JSON.stringify(faq),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Get FAQ Error:', error)
    return new Response(
      JSON.stringify({ error: 'Error al obtener la FAQ' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// POST /faqs - Crear una nueva FAQ
async function createFAQ(request: Request, userId: string): Promise<Response> {
  try {
    const body = await request.json()
    console.log('📝 Creating FAQ:', body)

    // Validaciones
    if (!body.question || !body.answer) {
      return new Response(
        JSON.stringify({ error: 'La pregunta y respuesta son obligatorias' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
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
      created_by: userId
    }

    console.log('💾 Inserting FAQ data:', faqData)

    const { data: newFAQ, error } = await supabase
      .from('faqs')
      .insert(faqData)
      .select(`
        *,
        profiles:created_by (
          full_name
        ),
        assets:asset_id (
          name,
          serial_number,
          asset_types (
            name
          )
        )
      `)
      .single()

    if (error) {
      console.error('❌ Error creating FAQ:', error)
      return new Response(
        JSON.stringify({ error: 'Error al crear la FAQ' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ FAQ created successfully: ${newFAQ.question}`)
    return new Response(
      JSON.stringify(newFAQ),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Create FAQ Error:', error)
    return new Response(
      JSON.stringify({ error: 'Error al crear la FAQ' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// PUT /faqs/:id - Actualizar una FAQ
async function updateFAQ(request: Request, faqId: string, userId: string): Promise<Response> {
  try {
    const body = await request.json()
    console.log(`📝 Updating FAQ ${faqId}:`, body)

    // Validaciones
    if (!body.question || !body.answer) {
      return new Response(
        JSON.stringify({ error: 'La pregunta y respuesta son obligatorias' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
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
    }

    console.log('💾 Updating FAQ data:', faqData)

    const { data: updatedFAQ, error } = await supabase
      .from('faqs')
      .update(faqData)
      .eq('id', faqId)
      .select(`
        *,
        profiles:created_by (
          full_name
        ),
        assets:asset_id (
          name,
          serial_number,
          asset_types (
            name
          )
        )
      `)
      .single()

    if (error) {
      console.error('❌ Error updating FAQ:', error)
      return new Response(
        JSON.stringify({ error: 'Error al actualizar la FAQ' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!updatedFAQ) {
      return new Response(
        JSON.stringify({ error: 'FAQ no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ FAQ updated successfully: ${updatedFAQ.question}`)
    return new Response(
      JSON.stringify(updatedFAQ),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Update FAQ Error:', error)
    return new Response(
      JSON.stringify({ error: 'Error al actualizar la FAQ' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// DELETE /faqs/:id - Eliminar una FAQ
async function deleteFAQ(faqId: string, userId: string): Promise<Response> {
  try {
    console.log(`🗑️ Deleting FAQ ${faqId}...`)

    const { data: deletedFAQ, error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', faqId)
      .select()
      .single()

    if (error) {
      console.error('❌ Error deleting FAQ:', error)
      return new Response(
        JSON.stringify({ error: 'Error al eliminar la FAQ' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!deletedFAQ) {
      return new Response(
        JSON.stringify({ error: 'FAQ no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ FAQ deleted successfully: ${deletedFAQ.question}`)
    return new Response(
      JSON.stringify({ message: 'FAQ eliminada exitosamente' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Delete FAQ Error:', error)
    return new Response(
      JSON.stringify({ error: 'Error al eliminar la FAQ' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}