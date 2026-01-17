const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pvvwbnybkadhreuqijsl.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listLocations() {
  try {
    console.log('=== Listing Available Locations ===\n')

    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, timezone, address, is_active')
      .order('name', { ascending: true })

    if (error) {
      console.error('ERROR fetching locations:', error)
      process.exit(1)
    }

    if (!locations || locations.length === 0) {
      console.log('No locations found. You need to create locations first.')
      process.exit(1)
    }

    console.log('Available locations:\n')
    locations.forEach((loc, index) => {
      console.log(`${index + 1}. ${loc.name}`)
      console.log(`   ID: ${loc.id}`)
      console.log(`   Timezone: ${loc.timezone}`)
      if (loc.address) console.log(`   Address: ${loc.address}`)
      console.log(`   Active: ${loc.is_active ? 'Yes' : 'No'}`)
      console.log('')
    })

    console.log('To create an admin user, run:')
    console.log(`  node scripts/create-admin-user.js <location_id>`)
    console.log('\nExample:')
    console.log(`  node scripts/create-admin-user.js ${locations[0].id}`)
    console.log('\n========================================\n')
  } catch (error) {
    console.error('ERROR:', error)
    process.exit(1)
  }
}

listLocations()
