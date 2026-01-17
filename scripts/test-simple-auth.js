/**
 * Simple Login Test Script
 * Tests the authentication flow without browser automation
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuthFlow() {
    console.log('🧪 Testing Authentication Flow...\n');

    try {
        console.log('1️⃣ Testing sign in...');
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email: 'marco.gallegos@anchor23.mx',
            password: 'Marco123456!'
        });

        if (signInError) {
            console.error('❌ Sign in failed:', signInError.message);
            return;
        }

        console.log('✅ Sign in successful!');
        console.log(`   User: ${authData.user.email}`);
        console.log(`   Session: ${authData.session ? '✅' : '❌'}`);

        if (authData.session) {
            console.log(`   Access Token: ${authData.session.access_token.substring(0, 20)}...`);
            console.log(`   Refresh Token: ${authData.session.refresh_token.substring(0, 20)}...`);
        }

        console.log('\n2️⃣ Testing staff query (middleware simulation)...');
        const { data: staff, error: staffError } = await supabase
            .from('staff')
            .select('*')
            .eq('user_id', authData.user.id)
            .single();

        if (staffError) {
            console.error('❌ Staff query failed:', staffError.message);
            return;
        }

        console.log('✅ Staff query successful!');
        console.log(`   Name: ${staff.display_name}`);
        console.log(`   Role: ${staff.role}`);

        console.log('\n3️⃣ Testing session persistence with same client...');
        // Test with the same client
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error('❌ Session error:', sessionError.message);
        } else if (sessionData.session) {
            console.log('✅ Session persisted!');
            console.log(`   User: ${sessionData.session.user.email}`);
        } else {
            console.error('❌ Session lost!');
        }

        console.log('\n4️⃣ Testing dashboard access with authenticated client...');
        const { data: dashboardData, error: dashboardError } = await supabase
            .from('staff')
            .select('*')
            .eq('user_id', authData.user.id);

        if (dashboardError) {
            console.error('❌ Dashboard access failed:', dashboardError.message);
        } else {
            console.log('✅ Dashboard access successful!');
            console.log(`   Staff records: ${dashboardData.length}`);
        }

        console.log(`   Status: ${dashboardResponse.status}`);
        console.log(`   Location: ${dashboardResponse.headers.get('location') || 'none'}`);

        if (dashboardResponse.status === 200) {
            console.log('✅ Dashboard accessible!');
        } else if (dashboardResponse.status >= 300 && dashboardResponse.status < 400) {
            console.log(`➡️  Redirect to: ${dashboardResponse.headers.get('location')}`);
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

testAuthFlow();