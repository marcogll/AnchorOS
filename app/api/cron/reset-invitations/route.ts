import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * @description CRITICAL: Weekly reset of Gold tier invitation quotas
 * @param {NextRequest} request - Must include Bearer token with CRON_SECRET
 * @returns {NextResponse} Success confirmation with reset statistics
 * @example curl -H "Authorization: Bearer YOUR_CRON_SECRET" /api/cron/reset-invitations
 * @audit BUSINESS RULE: Gold tier gets 5 weekly invitations, resets every Monday UTC
 * @audit SECURITY: Requires CRON_SECRET environment variable for authentication
 * @audit Validate: Only Gold tier customers affected, count matches expectations
 * @audit AUDIT: Reset action logged in audit_logs with customer count affected
 * @audit PERFORMANCE: Single bulk update query, efficient for large customer base
 * @audit RELIABILITY: Cron job should run exactly at Monday 00:00 UTC weekly
 */

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Missing Supabase environment variables' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const cronKey = authHeader.replace('Bearer ', '').trim()
    
    if (cronKey !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Invalid cron key' },
        { status: 403 }
      )
    }

    const { data: goldCustomers, error: fetchError } = await supabase
      .from('customers')
      .select('id, first_name, last_name')
      .eq('tier', 'gold')

    if (fetchError) {
      console.error('Error fetching gold customers:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch gold customers' },
        { status: 500 }
      )
    }

    if (!goldCustomers || goldCustomers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No gold customers found. Reset skipped.',
        resetCount: 0
      })
    }

    const customerIds = goldCustomers.map(c => c.id)
    
    const { error: updateError } = await supabase
      .from('customers')
      .update({ weekly_invitations_used: 0 })
      .in('id', customerIds)

    if (updateError) {
      console.error('Error resetting weekly invitations:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to reset weekly invitations' },
        { status: 500 }
      )
    }

    const { error: logError } = await supabase
      .from('audit_logs')
      .insert([{
        action: 'weekly_invitations_reset',
        entity_type: 'customer',
        entity_id: null,
        details: {
          customer_count: goldCustomers.length,
          customer_ids: customerIds
        },
        performed_by: 'system',
        created_at: new Date().toISOString()
      }])

    if (logError) {
      console.error('Error logging reset action:', logError)
    }

    console.log(`Weekly invitations reset completed for ${goldCustomers.length} gold customers`)

    return NextResponse.json({
      success: true,
      message: 'Weekly invitations reset completed successfully',
      resetCount: goldCustomers.length
    })

  } catch (error) {
    console.error('Error in weekly invitations reset:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
