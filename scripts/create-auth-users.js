#!/usr/bin/env node

/**
 * Script simple para crear usuarios de Auth en Supabase
 * Ejecutar con: node scripts/create-auth-users.js
 * Requiere: npm install @supabase/supabase-js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERROR: Faltan variables de entorno')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Usuarios de staff
const staffUsers = [
  {
    email: 'admin@salonos.com',
    password: 'Admin123!',
    role: 'admin',
    display_name: 'Admin Principal',
    phone: '+52 55 1111 2222',
    location: 'Salón Principal - Centro'
  },
  {
    email: 'manager.centro@salonos.com',
    password: 'Manager123!',
    role: 'manager',
    display_name: 'Manager Centro',
    phone: '+52 55 2222 3333',
    location: 'Salón Principal - Centro'
  },
  {
    email: 'manager.polanco@salonos.com',
    password: 'Manager123!',
    role: 'manager',
    display_name: 'Manager Polanco',
    phone: '+52 55 6666 7777',
    location: 'Salón Norte - Polanco'
  },
  {
    email: 'staff.coordinadora@salonos.com',
    password: 'Staff123!',
    role: 'staff',
    display_name: 'Staff Coordinadora',
    phone: '+52 55 3333 4444',
    location: 'Salón Principal - Centro'
  },
  {
    email: 'artist.maria@salonos.com',
    password: 'Artist123!',
    role: 'artist',
    display_name: 'Artist María García',
    phone: '+52 55 4444 5555',
    location: 'Salón Principal - Centro'
  },
  {
    email: 'artist.ana@salonos.com',
    password: 'Artist123!',
    role: 'artist',
    display_name: 'Artist Ana Rodríguez',
    phone: '+52 55 5555 6666',
    location: 'Salón Principal - Centro'
  },
  {
    email: 'artist.carla@salonos.com',
    password: 'Artist123!',
    role: 'artist',
    display_name: 'Artist Carla López',
    phone: '+52 55 7777 8888',
    location: 'Salón Norte - Polanco'
  },
  {
    email: 'artist.laura@salonos.com',
    password: 'Artist123!',
    role: 'artist',
    display_name: 'Artist Laura Martínez',
    phone: '+52 55 8888 9999',
    location: 'Salón Sur - Coyoacán'
  }
]

// Usuarios de customers
const customerUsers = [
  {
    email: 'sofia.ramirez@example.com',
    password: 'Customer123!',
    tier: 'gold',
    display_name: 'Sofía Ramírez'
  },
  {
    email: 'valentina.hernandez@example.com',
    password: 'Customer123!',
    tier: 'gold',
    display_name: 'Valentina Hernández'
  },
  {
    email: 'camila.lopez@example.com',
    password: 'Customer123!',
    tier: 'free',
    display_name: 'Camila López'
  },
  {
    email: 'isabella.garcia@example.com',
    password: 'Customer123!',
    tier: 'gold',
    display_name: 'Isabella García'
  }
]

async function createStaffUser(user) {
  try {
    // Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        role: user.role,
        display_name: user.display_name,
        location: user.location,
        phone: user.phone
      }
    })

    if (error) {
      console.error(`❌ Error creando ${user.display_name}:`, error.message)
      return null
    }

    console.log(`✅ ${user.display_name} creado (ID: ${data.user.id})`)
    return data.user

  } catch (error) {
    console.error(`❌ Error inesperado creando ${user.display_name}:`, error.message)
    return null
  }
}

async function createCustomerUser(user) {
  try {
    // Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        tier: user.tier,
        display_name: user.display_name
      }
    })

    if (error) {
      console.error(`❌ Error creando ${user.display_name}:`, error.message)
      return null
    }

    console.log(`✅ ${user.display_name} creado (ID: ${data.user.id})`)
    return data.user

  } catch (error) {
    console.error(`❌ Error inesperado creando ${user.display_name}:`, error.message)
    return null
  }
}

async function updateStaffUserId(user) {
  try {
    const { error } = await supabase
      .from('staff')
      .update({ user_id: user.id })
      .eq('display_name', user.display_name)

    if (error) {
      console.error(`❌ Error actualizando ${user.display_name}:`, error.message)
      return false
    }

    console.log(`✅ ${user.display_name} actualizado con user_id`)
    return true

  } catch (error) {
    console.error(`❌ Error inesperado actualizando ${user.display_name}:`, error.message)
    return false
  }
}

async function updateCustomerUserId(user) {
  try {
    const { error } = await supabase
      .from('customers')
      .update({ user_id: user.id })
      .eq('email', user.email)

    if (error) {
      console.error(`❌ Error actualizando ${user.display_name}:`, error.message)
      return false
    }

    console.log(`✅ ${user.display_name} actualizado con user_id`)
    return true

  } catch (error) {
    console.error(`❌ Error inesperado actualizando ${user.display_name}:`, error.message)
    return false
  }
}

async function main() {
  console.log('==========================================')
  console.log('SALONOS - CREACIÓN DE USUARIOS AUTH')
  console.log('==========================================')
  console.log()

  // 1. Crear usuarios de staff
  console.log('👥 Creando usuarios de staff (8 usuarios)...')
  console.log()

  const createdStaff = []
  for (const user of staffUsers) {
    const createdUser = await createStaffUser(user)
    if (createdUser) {
      createdStaff.push({
        ...user,
        id: createdUser.id
      })
    }
    // Pequeña pausa para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log()
  console.log(`✅ Usuarios de staff creados: ${createdStaff.length}/8`)

  // 2. Actualizar tabla staff con user_ids
  console.log()
  console.log('🔄 Actualizando tabla staff con user_ids...')
  console.log()

  let updatedStaffCount = 0
  for (const user of createdStaff) {
    const updated = await updateStaffUserId(user)
    if (updated) {
      updatedStaffCount++
    }
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  console.log()
  console.log(`✅ Staff actualizados: ${updatedStaffCount}/8`)

  // 3. Crear usuarios de customers
  console.log()
  console.log('👩 Creando usuarios de customers (4 usuarios)...')
  console.log()

  const createdCustomers = []
  for (const user of customerUsers) {
    const createdUser = await createCustomerUser(user)
    if (createdUser) {
      createdCustomers.push({
        ...user,
        id: createdUser.id
      })
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log()
  console.log(`✅ Usuarios de customers creados: ${createdCustomers.length}/4`)

  // 4. Actualizar tabla customers con user_ids
  console.log()
  console.log('🔄 Actualizando tabla customers con user_ids...')
  console.log()

  let updatedCustomersCount = 0
  for (const user of createdCustomers) {
    const updated = await updateCustomerUserId(user)
    if (updated) {
      updatedCustomersCount++
    }
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  console.log()
  console.log(`✅ Customers actualizados: ${updatedCustomersCount}/4`)

  // 5. Resumen final
  console.log()
  console.log('==========================================')
  console.log('RESUMEN FINAL')
  console.log('==========================================')
  console.log(`Staff creados:      ${createdStaff.length}/8`)
  console.log(`Staff actualizados:   ${updatedStaffCount}/8`)
  console.log(`Customers creados:  ${createdCustomers.length}/4`)
  console.log(`Customers actualizados: ${updatedCustomersCount}/4`)
  console.log('==========================================')

  if (createdStaff.length === 8 && updatedStaffCount === 8 && createdCustomers.length === 4 && updatedCustomersCount === 4) {
    console.log()
    console.log('🎉 TODOS LOS USUARIOS HAN SIDO CREADOS Y ACTUALIZADOS')
    console.log()
    console.log('📝 Credenciales de prueba:')
    console.log()
    console.log('ADMIN:')
    console.log('  Email: admin@salonos.com')
    console.log('  Password: Admin123!')
    console.log()
    console.log('CUSTOMER (Gold):')
    console.log('  Email: sofia.ramirez@example.com')
    console.log('  Password: Customer123!')
    console.log()
    console.log('Puedes usar estas credenciales para probar el login.')
  } else {
    console.log()
    console.log('⚠️  ALGUNOS USUARIOS NO FUERON CREADOS O ACTUALIZADOS')
    console.log('Por favor, verifica los errores arriba.')
  }
}

main()
