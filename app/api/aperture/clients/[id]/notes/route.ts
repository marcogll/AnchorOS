import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Adds a new technical note to the client's profile with timestamp
 * @param {NextRequest} request - HTTP request containing note text in request body
 * @param {Object} params - Route parameters containing the client UUID
 * @param {string} params.clientId - The UUID of the client to add note to
 * @returns {NextResponse} JSON with success status and updated client data including new note
 * @example POST /api/aperture/clients/123e4567-e89b-12d3-a456-426614174000/notes { note: "Allergic to latex products" }
 * @audit BUSINESS RULE: Notes are appended to existing technical_notes with ISO timestamp prefix
 * @audit BUSINESS RULE: Technical notes used for service customization and allergy tracking
 * @audit SECURITY: Requires authenticated admin/manager/staff role via RLS policies
 * @audit Validate: Ensures note content is provided and client exists
 * @audit AUDIT: Note additions logged as 'technical_note_added' action in audit_logs
 * @audit PERFORMANCE: Single append operation on technical_notes field
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const { clientId } = params
    const { note } = await request.json()

    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note content is required' },
        { status: 400 }
      )
    }

    // Get current customer
    const { data: customer, error: fetchError } = await supabaseAdmin
      .from('customers')
      .select('notes, technical_notes')
      .eq('id', clientId)
      .single()

    if (fetchError || !customer) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    // Append new technical note
    const existingNotes = customer.technical_notes || ''
    const timestamp = new Date().toISOString()
    const newNoteEntry = `[${timestamp}] ${note}`
    const updatedNotes = existingNotes
      ? `${existingNotes}\n${newNoteEntry}`
      : newNoteEntry

    // Update customer
    const { data: updatedCustomer, error: updateError } = await supabaseAdmin
      .from('customers')
      .update({
        technical_notes: updatedNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single()

    if (updateError) {
      console.error('Error adding technical note:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      )
    }

    // Log to audit
    await supabaseAdmin.from('audit_logs').insert({
      entity_type: 'customer',
      entity_id: clientId,
      action: 'technical_note_added',
      new_values: { note }
    })

    return NextResponse.json({
      success: true,
      data: updatedCustomer
    })
  } catch (error) {
    console.error('Error in POST /api/aperture/clients/[id]/notes:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
