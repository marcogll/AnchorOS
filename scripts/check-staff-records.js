/**
 * Check Staff Records Script
 * 
 * This script checks which staff records exist for the admin user
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkStaffRecords() {
    console.log('🔍 Checking staff records...\n');

    try {
        // 1. Get admin user from auth.users
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

        if (usersError) {
            console.error('❌ Error fetching auth.users:', usersError);
            return;
        }

        const adminUser = users.find(u => u.email === 'marco.gallegos@anchor23.mx');
        
        if (!adminUser) {
            console.error('❌ No admin user found in auth.users');
            return;
        }

        console.log('✅ Found admin user in auth.users:');
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   ID: ${adminUser.id}\n`);

        // 2. Check which staff records exist with this user_id
        const { data: staffRecords, error: staffError } = await supabase
            .from('staff')
            .select('*')
            .eq('user_id', adminUser.id);

        if (staffError) {
            console.error('❌ Error fetching staff records:', staffError);
            return;
        }

        if (staffRecords.length > 0) {
            console.log(`✅ Found ${staffRecords.length} staff records with user_id = ${adminUser.id}:`);
            staffRecords.forEach((staff, index) => {
                console.log(`   ${index + 1}. ${staff.display_name} (${staff.role})`);
                console.log(`      Location ID: ${staff.location_id}`);
                console.log(`      Active: ${staff.is_active}`);
            });
            console.log('\n✅ Admin user already has valid staff records!');
            console.log('   No fix needed.\n');
        } else {
            console.log('❌ No staff records found with user_id = ${adminUser.id}');
            console.log('   This is the problem - admin user has no staff record!\n');
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

checkStaffRecords();
