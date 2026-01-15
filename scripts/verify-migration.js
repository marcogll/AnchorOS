#!/usr/bin/env node

/**
 * Script de verificación de migraciones - SalonOS
 * Verifica que todas las tablas, funciones, triggers y políticas RLS estén creados
 */

const { createClient } = require('@supabase/supabase-js')

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERROR: Faltan variables de entorno')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('==========================================')
console('SALONOS - VERIFICACIÓN DE MIGRACIONES')
console.log('==========================================')
console.log()

const expectedTables = [
  'locations',
  'resources',
  'staff',
  'services',
  'customers',
  'invitations',
  'bookings',
  'audit_logs',
]

const expectedFunctions = [
  'generate_short_id',
  'generate_invitation_code',
  'reset_weekly_invitations_for_customer',
  'reset_all_weekly_invitations',
  'log_audit',
  'get_current_user_role',
  'is_staff_or_higher',
  'is_artist',
  'is_customer',
  'is_admin',
  'update_updated_at',
  'generate_booking_short_id',
  'get_week_start',
]

const expectedEnums = [
  'user_role',
  'customer_tier',
  'booking_status',
  'invitation_status',
  'resource_type',
  'audit_action',
]

async function verifyTables() {
  console.log('📊 Verificando tablas...')

  const { data: tables, error } = await supabase.rpc('verify_tables_exist', {
    table_names: expectedTables,
  })

  if (error) {
    console.error('❌ Error al verificar tablas:', error)
    return false
  }

  console.log(`✅ Tablas creadas: ${tables.length}/${expectedTables.length}`)

  if (tables.length !== expectedTables.length) {
    console.log('⚠️  Tablas faltantes:')
    expectedTables.forEach(table => {
      if (!tables.includes(table)) {
        console.log(`   - ${table}`)
      }
    })
    return false
  }

  return true
}

async function verifyFunctions() {
  console.log('📊 Verificando funciones...')

  const { data: functions, error } = await supabase.rpc('verify_functions_exist', {
    function_names: expectedFunctions,
  })

  if (error) {
    console.error('❌ Error al verificar funciones:', error)
    return false
  }

  console.log(`✅ Funciones creadas: ${functions.length}/${expectedFunctions.length}`)

  if (functions.length !== expectedFunctions.length) {
    console.log('⚠️  Funciones faltantes:')
    expectedFunctions.forEach(func => {
      if (!functions.includes(func)) {
        console.log(`   - ${func}`)
      }
    })
    return false
  }

  return true
}

async function verifyEnums() {
  console.log('📊 Verificando tipos ENUM...')

  const { data: enums, error } = await supabase.rpc('verify_enums_exist', {
    enum_names: expectedEnums,
  })

  if (error) {
    console.error('❌ Error al verificar tipos ENUM:', error)
    return false
  }

  console.log(`✅ Tipos ENUM creados: ${enums.length}/${expectedEnums.length}`)

  if (enums.length !== expectedEnums.length) {
    console.log('⚠️  Tipos ENUM faltantes:')
    expectedEnums.forEach(enumName => {
      if (!enums.includes(enumName)) {
        console.log(`   - ${enumName}`)
      }
    })
    return false
  }

  return true
}

async function testShortID() {
  console.log('🧪 Probando generación de Short ID...')

  const { data, error } = await supabase.rpc('generate_short_id')

  if (error) {
    console.error('❌ Error al generar Short ID:', error)
    return false
  }

  console.log(`✅ Short ID generado: ${data}`)
  console.log(`   Longitud: ${data.length} caracteres`)

  if (data.length !== 6) {
    console.error('❌ ERROR: El Short ID debe tener 6 caracteres')
    return false
  }

  return true
}

async function testInvitationCode() {
  console.log('🧪 Probando generación de código de invitación...')

  const { data, error } = await supabase.rpc('generate_invitation_code')

  if (error) {
    console.error('❌ Error al generar código de invitación:', error)
    return false
  }

  console.log(`✅ Código de invitación generado: ${data}`)
  console.log(`   Longitud: ${data.length} caracteres`)

  if (data.length !== 10) {
    console.error('❌ ERROR: El código de invitación debe tener 10 caracteres')
    return false
  }

  return true
}

async function main() {
  try {
    const tablesOk = await verifyTables()
    const functionsOk = await verifyFunctions()
    const enumsOk = await verifyEnums()
    const shortIdOk = await testShortID()
    const invitationCodeOk = await testInvitationCode()

    console.log()
    console.log('==========================================')

    if (tablesOk && functionsOk && enumsOk && shortIdOk && invitationCodeOk) {
      console.log('✅ TODAS LAS VERIFICACIONES PASARON')
      console.log('==========================================')
      console.log()
      console.log('🎉 La base de datos está lista para usar')
      console.log()
      console.log('📝 Próximos pasos:')
      console.log('   1. Configurar Auth en Supabase Dashboard')
      console.log('   2. Crear usuarios de prueba con roles específicos')
      console.log('   3. Ejecutar seeds de datos de prueba')
      console.log('   4. Probar la API de bookings')
      process.exit(0)
    } else {
      console.log('❌ ALGUNAS VERIFICACIONES FALLARON')
      console.log('==========================================')
      console.log()
      console.log('Por favor, revisa los errores arriba y ejecuta nuevamente:')
      console.log('   npm run db:migrate')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error inesperado:', error)
    process.exit(1)
  }
}

main()
