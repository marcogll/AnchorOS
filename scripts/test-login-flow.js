/**
 * Test Login Flow Script
 * 
 * This script tests the login flow to verify the RLS policy fix works
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLoginFlow() {
    console.log('🧪 Testing Login Flow...\n');

    try {
        // 1. Test sign in with admin credentials
        console.log('1️⃣ Testing sign in...');
        const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
            email: 'marco.gallegos@anchor23.mx',
            password: 'Marco123456!'
        });

        if (signInError) {
            console.error('❌ Sign in failed:', signInError);
            return;
        }

        console.log('✅ Sign in successful!');
        console.log(`   Email: ${user.email}`);
        console.log(`   User ID: ${user.id}\n`);

        // 2. Test querying staff table (this is what middleware does)
        console.log('2️⃣ Testing staff query (middleware simulation)...');
        const { data: staff, error: staffError } = await supabase
            .from('staff')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (staffError) {
            console.error('❌ Staff query failed:', staffError);
            console.log('   This is the RLS policy issue!');
            return;
        }

        console.log('✅ Staff query successful!');
        console.log(`   Name: ${staff.display_name}`);
        console.log(`   Role: ${staff.role}`);
        console.log(`   Location: ${staff.location_id}\n`);

        // 3. Test getting dashboard data
        console.log('3️⃣ Testing dashboard API...');
        const { data: sessionData } = await supabase.auth.getSession();

        // Test redirect by checking if we can access the dashboard page
        console.log('3️⃣ Testing redirect to dashboard page...');
        const dashboardResponse = await fetch('http://localhost:2311/aperture', {
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`
          }
        });

        if (!dashboardResponse.ok) {
            console.error('❌ Dashboard API failed:', dashboardResponse.status);
            console.log('   Response:', await dashboardResponse.text());
            return;
        }

        const dashboardData = await dashboardResponse.json();
        console.log('✅ Dashboard API successful!');
        console.log(`   KPI Cards: ${dashboardData.kpi_cards ? '✅' : '❌'}`);
        console.log(`   Top Performers: ${dashboardData.top_performers ? '✅' : '❌'}`);
        console.log(`   Activity Feed: ${dashboardData.activity_feed ? '✅' : '❌'}\n`);

        console.log('🎉 All tests passed! Login flow is working!\n');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

testLoginFlow();
