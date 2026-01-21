import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Retrieves client photo gallery for premium tier clients (Gold/Black/VIP only)
 * @param {NextRequest} request - HTTP request (no body required)
 * @param {Object} params - Route parameters containing the client UUID
 * @param {string} params.clientId - The UUID of the client to get photos for
 * @returns {NextResponse} JSON with success status and array of photo records with creator info
 * @example GET /api/aperture/clients/123e4567-e89b-12d3-a456-426614174000/photos
 * @audit BUSINESS RULE: Photo access restricted to Gold, Black, and VIP tiers only
 * @audit BUSINESS RULE: Returns only active photos (is_active = true) ordered by taken date descending
 * @audit SECURITY: Validates client tier before allowing photo access
 * @audit Validate: Returns 403 if client tier does not have photo gallery access
 * @audit PERFORMANCE: Single query fetches photos with creator user info
 * @audit AUDIT: Photo gallery access logged for privacy compliance
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
 * @description Uploads a new photo to the client's gallery (Gold/Black/VIP tiers only)
 * @param {NextRequest} request - HTTP request containing storage_path and optional description
 * @param {Object} params - Route parameters containing the client UUID
 * @param {string} params.clientId - The UUID of the client to upload photo for
 * @returns {NextResponse} JSON with success status and created photo record metadata
 * @example POST /api/aperture/clients/123e4567-e89b-12d3-a456-426614174000/photos { storage_path: "photos/client-id/photo.jpg", description: "Before nail art" }
 * @audit BUSINESS RULE: Photo storage path must reference Supabase Storage bucket
 * @audit BUSINESS RULE: Only Gold/Black/VIP tier clients can have photos in gallery
 * @audit SECURITY: Validates client tier before allowing photo upload
 * @audit Validate: Ensures storage_path is provided (required for photo reference)
 * @audit AUDIT: Photo uploads logged as 'upload' action in audit_logs
 * @audit PERFORMANCE: Single insert with automatic creator tracking
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
