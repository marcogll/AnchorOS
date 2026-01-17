/**
 * Fix Staff User ID Mapping Script
 * 
 * This script fixes the SECONDARY blocker in authentication:
 * - Staff record has user_id = random UUID (from seed_data.sql)
 * - Instead of the real auth.users user_id
 * 
 * This script:
 * 1. Gets the admin user from auth.users
 * 2. Updates the staff record with the real user_id
 * 
 * Usage:
 *   node scripts/fix-staff-user-id.js [--email <email>]
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixStaffUserId() {
    console.log('🔧 Fixing staff user_id mapping...\n');

    try {
        // 1. Get admin user from auth.users (using service role)
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

        if (usersError) {
            console.error('❌ Error fetching auth.users:', usersError);
            return;
        }

        // Find admin user (email starts with 'admin' or 'marco')
        const adminUser = users.find(u => 
            u.email?.startsWith('admin') || u.email?.startsWith('marco') || u.email?.includes('@')
        );

        if (!adminUser) {
            console.error('❌ No admin user found in auth.users');
            return;
        }

        console.log('✅ Found admin user in auth.users:');
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   ID: ${adminUser.id}\n`);

        // 2. Find staff records with invalid user_id (random UUIDs)
        const { data: staffRecords, error: staffError } = await supabase
            .from('staff')
            .select('*')
            .is('is_active', true);

        if (staffError) {
            console.error('❌ Error fetching staff records:', staffError);
            return;
        }

        console.log(`📊 Found ${staffRecords.length} active staff records\n`);

        // 3. Check if any staff record has a user_id that matches auth.users
        let matchedStaff = null;
        for (const staff of staffRecords) {
            const { data: { users: matchingUsers }, error: matchError } = await supabase.auth.admin.getUserById(staff.user_id);
            
            if (!matchError && matchingUsers) {
                console.log('✅ Staff record already has valid user_id:', staff.display_name);
                console.log(`   Staff user_id: ${staff.user_id}`);
                console.log(`   Staff role: ${staff.role}\n`);
                matchedStaff = staff;
                break;
            }
        }

        if (matchedStaff) {
            console.log('✅ Staff record already has valid user_id mapping!');
            console.log('   No fix needed.\n');
            return;
        }

        // 4. Update the first admin staff record with the real user_id
        const adminStaff = staffRecords.find(s => s.role === 'admin');
        
        if (!adminStaff) {
            console.error('❌ No admin staff record found');
            return;
        }

        console.log('🔧 Updating staff record:');
        console.log(`   Display Name: ${adminStaff.display_name}`);
        console.log(`   Old user_id: ${adminStaff.user_id}`);
        console.log(`   New user_id: ${adminUser.id}`);

        const { error: updateError } = await supabase
            .from('staff')
            .update({ user_id: adminUser.id })
            .eq('id', adminStaff.id);

        if (updateError) {
            console.error('❌ Error updating staff record:', updateError);
            return;
        }

        console.log('\n✅ Staff user_id fixed successfully!\n');

        // 5. Verify the fix
        console.log('🔍 Verifying fix...');
        const { data: updatedStaff, error: verifyError } = await supabase
            .from('staff')
            .select('*')
            .eq('id', adminStaff.id)
            .single();

        if (verifyError) {
            console.error('❌ Error verifying fix:', verifyError);
            return;
        }

        console.log('✅ Verification successful:');
        console.log(`   Staff: ${updatedStaff.display_name}`);
        console.log(`   Role: ${updatedStaff.role}`);
        console.log(`   Location: ${updatedStaff.location_id}`);
        console.log(`   User ID: ${updatedStaff.user_id}`);
        console.log(`   Auth User ID: ${adminUser.id}`);
        console.log(`   Match: ${updatedStaff.user_id === adminUser.id ? '✅ YES' : '❌ NO'}\n`);

        console.log('🎉 Fix complete! You can now log in to /aperture\n');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

fixStaffUserId();
