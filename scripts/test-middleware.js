/**
 * Test Middleware Authentication
 * Tests if the middleware properly recognizes authenticated requests
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testMiddleware() {
    console.log('🧪 Testing Middleware Authentication...\n');

    // Create authenticated client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    });

    console.log('1️⃣ Signing in...');
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'marco.gallegos@anchor23.mx',
        password: 'Marco123456!'
    });

    if (signInError) {
        console.error('❌ Sign in failed:', signInError.message);
        return;
    }

    console.log('✅ Sign in successful!');

    // Test middleware by simulating the same logic
    console.log('\n2️⃣ Testing middleware logic...');

    const middlewareSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // This simulates what the middleware does
    const { data: { session }, error: sessionError } = await middlewareSupabase.auth.getSession();

    if (sessionError) {
        console.error('❌ Middleware session error:', sessionError.message);
        return;
    }

    if (!session) {
        console.error('❌ Middleware: No session found');
        return;
    }

    console.log('✅ Middleware: Session found');
    console.log(`   User: ${session.user.email}`);

    const { data: staff, error: staffError } = await middlewareSupabase
        .from('staff')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

    if (staffError) {
        console.error('❌ Middleware staff query error:', staffError.message);
        return;
    }

    if (!staff || !['admin', 'manager', 'staff'].includes(staff.role)) {
        console.error('❌ Middleware: Invalid role or no staff record');
        return;
    }

    console.log('✅ Middleware: Role check passed');
    console.log(`   Role: ${staff.role}`);

    console.log('\n🎉 Middleware test passed! Authentication should work.');
}

testMiddleware();