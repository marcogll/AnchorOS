/**
 * Check for completed bookings
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCompletedBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, status, end_time_utc')
    .eq('status', 'completed')
    .order('end_time_utc', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Completed bookings:', data);
  }
}

checkCompletedBookings();