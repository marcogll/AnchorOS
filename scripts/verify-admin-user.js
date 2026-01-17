const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pvvwbnybkadhreuqijsl.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyAdminUser() {
  try {
    console.log('=== Verifying Admin User: Marco Gallegos ===\n')

    const email = 'marco.gallegos@anchor23.mx'

    console.log('Step 1: Checking auth user...')
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('ERROR listing users:', authError)
      process.exit(1)
    }

    const authUser = users.find(u => u.email === email)

    if (!authUser) {
      console.error('ERROR: Auth user not found')
      process.exit(1)
    }

    console.log(`✓ Auth user found: ${authUser.id}`)

    console.log('Step 2: Checking staff record...')
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('user_id', authUser.id)
      .single()

    if (staffError || !staff) {
      console.error('ERROR: Staff record not found:', staffError)
      process.exit(1)
    }

    console.log(`✓ Staff record found: ${staff.id}`)
    console.log(`✓ Role: ${staff.role}`)
    console.log(`✓ Display Name: ${staff.display_name}`)
    console.log(`✓ Location ID: ${staff.location_id}`)
    console.log(`✓ Is Active: ${staff.is_active}`)
    console.log(`✓ Phone: ${staff.phone || 'N/A'}`)

    if (!['admin', 'manager', 'staff'].includes(staff.role)) {
      console.error('\n✗ ERROR: User role is NOT authorized for Aperture!')
      console.error(`   Current role: ${staff.role}`)
      console.error(`   Expected: admin, manager, or staff`)
      process.exit(1)
    }

    console.log('\n=== Admin User Verified Successfully ===')
    console.log('User can access Aperture dashboard')
    console.log('=========================================\n')
  } catch (error) {
    console.error('ERROR:', error)
    process.exit(1)
  }
}

verifyAdminUser()
