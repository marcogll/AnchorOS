import { NextRequest, NextResponse } from 'next/server'

// Mock permissions data
const mockPermissions = [
  {
    id: 'admin',
    name: 'Administrador',
    permissions: [
      { id: 'view_reports', name: 'Ver reportes', enabled: true },
      { id: 'manage_staff', name: 'Gestionar staff', enabled: true },
      { id: 'manage_resources', name: 'Gestionar recursos', enabled: true },
      { id: 'view_payments', name: 'Ver pagos', enabled: true },
      { id: 'manage_permissions', name: 'Gestionar permisos', enabled: true }
    ]
  },
  {
    id: 'manager',
    name: 'Gerente',
    permissions: [
      { id: 'view_reports', name: 'Ver reportes', enabled: true },
      { id: 'manage_staff', name: 'Gestionar staff', enabled: false },
      { id: 'manage_resources', name: 'Gestionar recursos', enabled: true },
      { id: 'view_payments', name: 'Ver pagos', enabled: true },
      { id: 'manage_permissions', name: 'Gestionar permisos', enabled: false }
    ]
  },
  {
    id: 'staff',
    name: 'Staff',
    permissions: [
      { id: 'view_reports', name: 'Ver reportes', enabled: false },
      { id: 'manage_staff', name: 'Gestionar staff', enabled: false },
      { id: 'manage_resources', name: 'Gestionar recursos', enabled: false },
      { id: 'view_payments', name: 'Ver pagos', enabled: false },
      { id: 'manage_permissions', name: 'Gestionar permisos', enabled: false }
    ]
  }
]

/**
 * @description Retrieves permissions data for different roles
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    permissions: mockPermissions
  })
}

/**
 * @description Toggles a specific permission for a role
 */
export async function POST(request: NextRequest) {
  const { roleId, permId } = await request.json()

  // Toggle permission
  const role = mockPermissions.find(r => r.id === roleId)
  if (role) {
    const perm = role.permissions.find(p => p.id === permId)
    if (perm) {
      perm.enabled = !perm.enabled
    }
  }

  return NextResponse.json({ success: true })
}