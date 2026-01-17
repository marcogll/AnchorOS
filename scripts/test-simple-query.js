/**
 * Test simple dashboard query
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSimpleQuery() {
  console.log('Testing simple bookings query...');

  const { data, error } = await supabase
    .from('bookings')
    .select('id, status, total_amount')
    .limit(5);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data);
  }
}

testSimpleQuery();