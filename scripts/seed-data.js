#!/usr/bin/env node

/**
 * Script de seed de datos - SalonOS
 * Crea datos de prueba para development
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
console.log('SALONOS - SEED DE DATOS')
console.log('==========================================')
console.log()

async function seedLocations() {
  console.log('📍 Creando locations...')

  const { data, error } = await supabase.from('locations').insert([
    {
      name: 'Salón Principal - Centro',
      timezone: 'America/Mexico_City',
      address: 'Av. Reforma 222, Centro Histórico, Ciudad de México',
      phone: '+52 55 1234 5678',
      is_active: true,
    },
    {
      name: 'Salón Norte - Polanco',
      timezone: 'America/Mexico_City',
      address: 'Av. Masaryk 123, Polanco, Ciudad de México',
      phone: '+52 55 2345 6789',
      is_active: true,
    },
    {
      name: 'Salón Sur - Coyoacán',
      timezone: 'America/Mexico_City',
      address: 'Calle Hidalgo 456, Coyoacán, Ciudad de México',
      phone: '+52 55 3456 7890',
      is_active: true,
    },
  ]).select()

  if (error) {
    console.error('❌ Error al crear locations:', error)
    return []
  }

  console.log(`✅ ${data.length} locations creadas`)
  return data
}

async function seedResources(locations) {
  console.log('🪑 Creando resources...')

  const resources = []

  for (const location of locations) {
    const { data, error } = await supabase.from('resources').insert([
      {
        location_id: location.id,
        name: `Estación ${Math.floor(Math.random() * 100)}`,
        type: 'station',
        capacity: 1,
        is_active: true,
      },
      {
        location_id: location.id,
        name: `Sala VIP ${Math.floor(Math.random() * 100)}`,
        type: 'room',
        capacity: 2,
        is_active: true,
      },
    ]).select()

    if (error) {
      console.error('❌ Error al crear resources:', error)
      continue
    }

    resources.push(...data)
  }

  console.log(`✅ ${resources.length} resources creadas`)
  return resources
}

async function seedStaff(locations) {
  console.log('👥 Creando staff...')

  const { data, error } = await supabase.from('staff').insert([
    {
      user_id: '00000000-0000-0000-0000-000000000001',
      location_id: locations[0].id,
      role: 'admin',
      display_name: 'Admin Principal',
      phone: '+52 55 1111 2222',
      is_active: true,
    },
    {
      user_id: '00000000-0000-0000-0000-000000000002',
      location_id: locations[0].id,
      role: 'manager',
      display_name: 'Manager Centro',
      phone: '+52 55 2222 3333',
      is_active: true,
    },
    {
      user_id: '00000000-0000-0000-0000-000000000003',
      location_id: locations[0].id,
      role: 'staff',
      display_name: 'Staff Coordinadora',
      phone: '+52 55 3333 4444',
      is_active: true,
    },
    {
      user_id: '00000000-0000-0000-0000-000000000004',
      location_id: locations[0].id,
      role: 'artist',
      display_name: 'Artist María García',
      phone: '+52 55 4444 5555',
      is_active: true,
    },
    {
      user_id: '00000000-0000-0000-0000-000000000005',
      location_id: locations[0].id,
      role: 'artist',
      display_name: 'Artist Ana Rodríguez',
      phone: '+52 55 5555 6666',
      is_active: true,
    },
    {
      user_id: '00000000-0000-0000-0000-000000000006',
      location_id: locations[1].id,
      role: 'manager',
      display_name: 'Manager Polanco',
      phone: '+52 55 6666 7777',
      is_active: true,
    },
    {
      user_id: '00000000-0000-0000-0000-000000000007',
      location_id: locations[1].id,
      role: 'artist',
      display_name: 'Artist Carla López',
      phone: '+52 55 7777 8888',
      is_active: true,
    },
    {
      user_id: '00000000-0000-0000-0000-000000000008',
      location_id: locations[2].id,
      role: 'artist',
      display_name: 'Artist Laura Martínez',
      phone: '+52 55 8888 9999',
      is_active: true,
    },
  ]).select()

  if (error) {
    console.error('❌ Error al crear staff:', error)
    return []
  }

  console.log(`✅ ${data.length} staff creados`)
  return data
}

async function seedServices() {
  console.log('💇 Creando services...')

  const { data, error } = await supabase.from('services').insert([
    {
      name: 'Corte y Estilizado',
      description: 'Corte de cabello profesional con lavado y estilizado',
      duration_minutes: 60,
      base_price: 500.00,
      requires_dual_artist: false,
      premium_fee_enabled: false,
      is_active: true,
    },
    {
      name: 'Color Completo',
      description: 'Tinte completo con protección capilar',
      duration_minutes: 120,
      base_price: 1200.00,
      requires_dual_artist: false,
      premium_fee_enabled: true,
      is_active: true,
    },
    {
      name: 'Balayage Premium',
      description: 'Técnica de balayage con productos premium',
      duration_minutes: 180,
      base_price: 2000.00,
      requires_dual_artist: true,
      premium_fee_enabled: true,
      is_active: true,
    },
    {
      name: 'Tratamiento Kératina',
      description: 'Tratamiento de kératina para cabello dañado',
      duration_minutes: 90,
      base_price: 1500.00,
      requires_dual_artist: false,
      premium_fee_enabled: false,
      is_active: true,
    },
    {
      name: 'Peinado Evento',
      description: 'Peinado para eventos especiales',
      duration_minutes: 45,
      base_price: 800.00,
      requires_dual_artist: false,
      premium_fee_enabled: true,
      is_active: true,
    },
    {
      name: 'Servicio Express (Dual Artist)',
      description: 'Servicio rápido con dos artists simultáneas',
      duration_minutes: 30,
      base_price: 600.00,
      requires_dual_artist: true,
      premium_fee_enabled: true,
      is_active: true,
    },
  ]).select()

  if (error) {
    console.error('❌ Error al crear services:', error)
    return []
  }

  console.log(`✅ ${data.length} services creados`)
  return data
}

async function seedCustomers() {
  console.log('👩 Creando customers...')

  const { data, error } = await supabase.from('customers').insert([
    {
      user_id: '10000000-0000-0000-0000-000000000001',
      first_name: 'Sofía',
      last_name: 'Ramírez',
      email: 'sofia.ramirez@example.com',
      phone: '+52 55 1111 1111',
      tier: 'gold',
      notes: 'Cliente VIP. Prefiere Artists María y Ana.',
      total_spent: 15000.00,
      total_visits: 25,
      last_visit_date: '2025-12-20',
      is_active: true,
    },
    {
      user_id: '10000000-0000-0000-0000-000000000002',
      first_name: 'Valentina',
      last_name: 'Hernández',
      email: 'valentina.hernandez@example.com',
      phone: '+52 55 2222 2222',
      tier: 'gold',
      notes: 'Cliente regular. Prefiere horarios de la mañana.',
      total_spent: 8500.00,
      total_visits: 15,
      last_visit_date: '2025-12-15',
      is_active: true,
    },
    {
      user_id: '10000000-0000-0000-0000-000000000003',
      first_name: 'Camila',
      last_name: 'López',
      email: 'camila.lopez@example.com',
      phone: '+52 55 3333 3333',
      tier: 'free',
      notes: 'Nueva cliente. Referida por Valentina.',
      total_spent: 500.00,
      total_visits: 1,
      last_visit_date: '2025-12-10',
      is_active: true,
    },
    {
      user_id: '10000000-0000-0000-0000-000000000004',
      first_name: 'Isabella',
      last_name: 'García',
      email: 'isabella.garcia@example.com',
      phone: '+52 55 4444 4444',
      tier: 'gold',
      notes: 'Cliente VIP. Requiere servicio de Balayage.',
      total_spent: 22000.00,
      total_visits: 30,
      last_visit_date: '2025-12-18',
      is_active: true,
    },
  ]).select()

  if (error) {
    console.error('❌ Error al crear customers:', error)
    return []
  }

  console.log(`✅ ${data.length} customers creados`)
  return data
}

async function seedInvitations(customers) {
  console.log('💌 Creando invitations...')

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Monday
  weekStart.setHours(0, 0, 0, 0)

  const invitations = []

  for (const customer of customers) {
    if (customer.tier === 'gold') {
      for (let i = 0; i < 5; i++) {
        const { data, error } = await supabase.from('invitations').insert({
          inviter_id: customer.id,
          code: await generateRandomCode(),
          status: 'pending',
          week_start_date: weekStart.toISOString().split('T')[0],
          expiry_date: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }).select()

        if (error) {
          console.error('❌ Error al crear invitations:', error)
          continue
        }

        invitations.push(...data)
      }
    }
  }

  console.log(`✅ ${invitations.length} invitations creadas`)
  return invitations
}

async function generateRandomCode() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function seedBookings(customers, staff, resources, services, locations) {
  console.log('📅 Creando bookings de prueba...')

  const now = new Date()
  const bookings = []

  for (let i = 0; i < 5; i++) {
    const startTime = new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

    const { data, error } = await supabase.from('bookings').insert({
      customer_id: customers[i % customers.length].id,
      staff_id: staff.filter(s => s.role === 'artist')[i % staff.filter(s => s.role === 'artist').length].id,
      location_id: locations[0].id,
      resource_id: resources[0].id,
      service_id: services[i % services.length].id,
      start_time_utc: startTime.toISOString(),
      end_time_utc: endTime.toISOString(),
      status: 'confirmed',
      deposit_amount: 200.00,
      total_amount: services[i % services.length].base_price,
      is_paid: true,
      payment_reference: `pay_${Math.random().toString(36).substring(7)}`,
    }).select()

    if (error) {
      console.error('❌ Error al crear bookings:', error)
      continue
    }

    bookings.push(...data)
  }

  console.log(`✅ ${bookings.length} bookings creados`)
  return bookings
}

async function main() {
  try {
    const locations = await seedLocations()
    if (locations.length === 0) throw new Error('No se crearon locations')

    const resources = await seedResources(locations)
    const staff = await seedStaff(locations)
    if (staff.length === 0) throw new Error('No se creó staff')

    const services = await seedServices()
    if (services.length === 0) throw new Error('No se crearon services')

    const customers = await seedCustomers()
    if (customers.length === 0) throw new Error('No se crearon customers')

    const invitations = await seedInvitations(customers)
    const bookings = await seedBookings(customers, staff, resources, services, locations)

    console.log()
    console.log('==========================================')
    console.log('✅ SEED DE DATOS COMPLETADO')
    console.log('==========================================')
    console.log()
    console.log('📊 Resumen:')
    console.log(`   Locations: ${locations.length}`)
    console.log(`   Resources: ${resources.length}`)
    console.log(`   Staff: ${staff.length}`)
    console.log(`   Services: ${services.length}`)
    console.log(`   Customers: ${customers.length}`)
    console.log(`   Invitations: ${invitations.length}`)
    console.log(`   Bookings: ${bookings.length}`)
    console.log()
    console.log('🎉 La base de datos está lista para desarrollo')
    console.log()
    console.log('📝 Próximos pasos:')
    console.log('   1. Configurar Auth en Supabase Dashboard')
    console.log('   2. Probar la API de bookings')
    console.log('   3. Implementar endpoints faltantes')
  } catch (error) {
    console.error('❌ Error inesperado:', error)
    process.exit(1)
  }
}

main()
