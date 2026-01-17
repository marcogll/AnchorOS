const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pvvwbnybkadhreuqijsl.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * @description CRITICAL: Create admin user with full system access permissions
 * @param {string} locationId - UUID of location where admin will be assigned
 * @param {string} email - Admin email (default: marco.gallegos@anchor23.mx)
 * @param {string} password - Admin password (default: Anchor23!2026)
 * @param {string} phone - Admin phone number
 * @audit BUSINESS RULE: Only one admin user should exist per system instance
 * @audit SECURITY: Admin gets full access to all Aperture dashboard features
 * @audit Validate: Location must exist before admin creation
 * @audit Validate: Admin user gets role='admin' for maximum permissions
 * @audit AUDIT: Creation logged in both auth.users and staff tables
 * @audit RELIABILITY: Script validates all prerequisites before creation
 */
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUser() {
  try {
    console.log('=== Creating Admin User: Marco Gallegos ===')

    const locationId = process.argv[2]
    const email = process.argv[3] || 'marco.gallegos@anchor23.mx'
    const password = process.argv[4] || 'Anchor23!2026'
    const displayName = 'Marco Gallegos'
    const role = 'admin'
    const phone = process.argv[5] || '+525512345678'

    if (!locationId) {
      console.error('ERROR: location_id is required')
      console.log('Usage: node scripts/create-admin-user.js <location_id> [email] [password] [phone]')
      process.exit(1)
    }

    console.log('Step 1: Checking if location exists...')
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id, name, timezone')
      .eq('id', locationId)
      .single()

    if (locationError || !location) {
      console.error('ERROR: Location not found:', locationId)
      console.error('Location error:', locationError)
      process.exit(1)
    }

    console.log(`✓ Location found: ${location.name} (${location.timezone})`)

    console.log('Step 2: Creating Supabase Auth user...')
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: 'Marco',
        last_name: 'Gallegos'
      }
    })

    if (authError || !authUser) {
      console.error('ERROR: Failed to create auth user:', authError)
      process.exit(1)
    }

    console.log(`✓ Auth user created: ${authUser.user.id}`)

    console.log('Step 3: Creating staff record...')
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .insert({
        user_id: authUser.user.id,
        location_id: locationId,
        role: role,
        display_name: displayName,
        phone: phone,
        is_active: true
      })
      .select()
      .single()

    if (staffError || !staff) {
      console.error('ERROR: Failed to create staff record:', staffError)
      console.log('Cleaning up auth user...')
      await supabase.auth.admin.deleteUser(authUser.user.id)
      process.exit(1)
    }

    console.log(`✓ Staff record created: ${staff.id}`)
    console.log('\n=== Admin User Created Successfully ===')
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
    console.log(`Name: ${displayName}`)
    console.log(`Role: ${role}`)
    console.log(`Location: ${location.name}`)
    console.log(`Staff ID: ${staff.id}`)
    console.log(`Auth User ID: ${authUser.user.id}`)
    console.log('\nLogin at: http://localhost:2311/aperture/login')
    console.log('=======================================\n')
  } catch (error) {
    console.error('ERROR:', error)
    process.exit(1)
  }
}

createAdminUser()
