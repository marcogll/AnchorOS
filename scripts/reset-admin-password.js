const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pvvwbnybkadhreuqijsl.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetAdminPassword() {
  try {
    console.log('=== Resetting Admin Password ===\n')

    const email = 'marco.gallegos@anchor23.mx'
    const newPassword = 'Marco123456!'

    console.log('Step 1: Finding auth user...')
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('ERROR listing users:', listError)
      process.exit(1)
    }

    const authUser = users.find(u => u.email === email)

    if (!authUser) {
      console.error('ERROR: Auth user not found')
      process.exit(1)
    }

    console.log(`✓ Auth user found: ${authUser.id}`)

    console.log('Step 2: Resetting password...')
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authUser.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('ERROR updating password:', updateError)
      process.exit(1)
    }

    console.log(`✓ Password updated successfully`)

    console.log('\n=== Password Reset Successfully ===')
    console.log(`Email: ${email}`)
    console.log(`New Password: ${newPassword}`)
    console.log('\nLogin at: http://localhost:2311/aperture/login')
    console.log('====================================\n')
  } catch (error) {
    console.error('ERROR:', error)
    process.exit(1)
  }
}

resetAdminPassword()
