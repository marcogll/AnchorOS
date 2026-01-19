import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Get client photo gallery (VIP/Black/Gold only)
 * @param {NextRequest} request - URL params: clientId in path
 * @returns {NextResponse} Client photos with metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const { clientId } = params

    // Check if customer tier allows photo access
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('tier')
      .eq('id', clientId)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    // Check tier access
    const canAccess = ['gold', 'black', 'VIP'].includes(customer.tier)
    if (!canAccess) {
      return NextResponse.json(
        { success: false, error: 'Photo gallery not available for this tier' },
        { status: 403 }
      )
    }

    // Get photos
    const { data: photos, error: photosError } = await supabaseAdmin
      .from('customer_photos')
      .select(`
        *,
        creator:auth.users(id, email)
      `)
      .eq('customer_id', clientId)
      .eq('is_active', true)
      .order('taken_at', { ascending: false })

    if (photosError) {
      console.error('Error fetching photos:', photosError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch photos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: photos || []
    })
  } catch (error) {
    console.error('Error in GET /api/aperture/clients/[id]/photos:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @description Upload photo to client gallery (VIP/Black/Gold only)
 * @param {NextRequest} request - Body with photo data
 * @returns {NextResponse} Uploaded photo metadata
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const { clientId } = params
    const { storage_path, description } = await request.json()

    if (!storage_path) {
      return NextResponse.json(
        { success: false, error: 'Storage path is required' },
        { status: 400 }
      )
    }

    // Check if customer tier allows photo gallery
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('tier')
      .eq('id', clientId)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    const canAccess = ['gold', 'black', 'VIP'].includes(customer.tier)
    if (!canAccess) {
      return NextResponse.json(
        { success: false, error: 'Photo gallery not available for this tier' },
        { status: 403 }
      )
    }

    // Create photo record
    const { data: photo, error: photoError } = await supabaseAdmin
      .from('customer_photos')
      .insert({
        customer_id: clientId,
        storage_path,
        description,
        created_by: (await supabaseAdmin.auth.getUser()).data.user?.id
      })
      .select()
      .single()

    if (photoError) {
      console.error('Error uploading photo:', photoError)
      return NextResponse.json(
        { success: false, error: photoError.message },
        { status: 400 }
      )
    }

    // Log to audit
    await supabaseAdmin.from('audit_logs').insert({
      entity_type: 'customer_photo',
      entity_id: photo.id,
      action: 'upload',
      new_values: { customer_id: clientId, storage_path }
    })

    return NextResponse.json({
      success: true,
      data: photo
    })
  } catch (error) {
    console.error('Error in POST /api/aperture/clients/[id]/photos:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
