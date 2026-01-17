'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

/** @description Admin enrollment system component for creating and managing staff members and kiosk devices. */
export default function EnrollmentPage() {
  const [adminKey, setAdminKey] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<'staff' | 'kiosks'>('staff')
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [staffForm, setStaffForm] = useState({
    location_id: '',
    role: 'staff',
    display_name: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: ''
  })

  const [kioskForm, setKioskForm] = useState({
    location_id: '',
    device_name: '',
    display_name: '',
    ip_address: ''
  })

  const [staffList, setStaffList] = useState<any[]>([])
  const [kioskList, setKioskList] = useState<any[]>([])

  useEffect(() => {
    const savedKey = localStorage.getItem('admin_enrollment_key')
    if (savedKey) {
      setAdminKey(savedKey)
      setIsAuthenticated(true)
      fetchLocations(savedKey)
    }
  }, [])

  const authenticate = async () => {
    if (!adminKey) {
      setMessage({ type: 'error', text: 'Please enter the admin enrollment key' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/locations', {
        headers: {
          'Authorization': `Bearer ${adminKey}`
        }
      })

      if (response.ok) {
        localStorage.setItem('admin_enrollment_key', adminKey)
        setIsAuthenticated(true)
        const data = await response.json()
        setLocations(data.locations)
        setMessage({ type: 'success', text: 'Authenticated successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Invalid admin enrollment key' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Authentication failed' })
    } finally {
      setLoading(false)
    }
  }

  const fetchLocations = async (key: string) => {
    try {
      const response = await fetch('/api/admin/locations', {
        headers: {
          'Authorization': `Bearer ${key}`
        }
      })
      const data = await response.json()
      setLocations(data.locations)
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    }
  }

  const createStaff = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}`
        },
        body: JSON.stringify(staffForm)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Staff member created successfully!' })
        fetchStaff()
        setStaffForm({
          location_id: '',
          role: 'staff',
          display_name: '',
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          phone: ''
        })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create staff member' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create staff member' })
    } finally {
      setLoading(false)
    }
  }

  const createKiosk = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/kiosks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}`
        },
        body: JSON.stringify(kioskForm)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Kiosk created successfully!' })
        fetchKiosks()
        setKioskForm({
          location_id: '',
          device_name: '',
          display_name: '',
          ip_address: ''
        })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create kiosk' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create kiosk' })
    } finally {
      setLoading(false)
    }
  }

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${adminKey}`
        }
      })
      const data = await response.json()
      setStaffList(data.staff || [])
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    }
  }

  const fetchKiosks = async () => {
    try {
      const response = await fetch('/api/admin/kiosks', {
        headers: {
          'Authorization': `Bearer ${adminKey}`
        }
      })
      const data = await response.json()
      setKioskList(data.kiosks || [])
    } catch (error) {
      console.error('Failed to fetch kiosks:', error)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchStaff()
      fetchKiosks()
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Enrollment</CardTitle>
            <CardDescription>
              Enter your admin enrollment key to access the user management system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminKey">Admin Enrollment Key</Label>
              <Input
                id="adminKey"
                type="password"
                placeholder="Enter your admin key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
              />
            </div>

            {message && (
              <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message.text}
              </div>
            )}

            <Button onClick={authenticate} disabled={loading} className="w-full">
              {loading ? 'Authenticating...' : 'Access Enrollment System'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            User Enrollment System
          </h1>
          <p className="text-gray-600">
            Create staff members and kiosks for your salon locations
          </p>
          <Button
            variant="outline"
            onClick={() => {
              localStorage.removeItem('admin_enrollment_key')
              setIsAuthenticated(false)
            }}
            className="mt-4"
          >
            Logout
          </Button>
        </header>

        {message && (
          <div className={`p-4 rounded-md mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'staff' | 'kiosks')} className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="staff">Staff Members</TabsTrigger>
            <TabsTrigger value="kiosks">Kiosks</TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Staff Member</CardTitle>
                <CardDescription>
                  Add a new staff member to a location
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Select onValueChange={(v) => setStaffForm({ ...staffForm, location_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select onValueChange={(v) => setStaffForm({ ...staffForm, role: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="artist">Artist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name *</Label>
                  <Input
                    id="displayName"
                    placeholder="e.g., María García"
                    value={staffForm.display_name}
                    onChange={(e) => setStaffForm({ ...staffForm, display_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="e.g., María"
                      value={staffForm.first_name}
                      onChange={(e) => setStaffForm({ ...staffForm, first_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="e.g., García"
                      value={staffForm.last_name}
                      onChange={(e) => setStaffForm({ ...staffForm, last_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g., maria@salon.com"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="e.g., +52 55 1234 5678"
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  />
                </div>

                <Button onClick={createStaff} disabled={loading} className="w-full">
                  {loading ? 'Creating Staff Member...' : 'Create Staff Member'}
                </Button>
              </CardContent>
            </Card>

            {staffList.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Existing Staff Members</CardTitle>
                  <CardDescription>
                    {staffList.length} staff members found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {staffList.map((staff) => (
                      <div key={staff.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{staff.display_name}</p>
                          <p className="text-sm text-gray-600">
                            {staff.role} • {staff.location?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {staff.is_active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(staff.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="kiosks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Kiosk</CardTitle>
                <CardDescription>
                  Add a new kiosk to a location
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kioskLocation">Location *</Label>
                  <Select onValueChange={(v) => setKioskForm({ ...kioskForm, location_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deviceName">Device Name *</Label>
                  <Input
                    id="deviceName"
                    placeholder="e.g., kiosk-entrance-1"
                    value={kioskForm.device_name}
                    onChange={(e) => setKioskForm({ ...kioskForm, device_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kioskDisplayName">Display Name *</Label>
                  <Input
                    id="kioskDisplayName"
                    placeholder="e.g., Kiosk Entrada Principal"
                    value={kioskForm.display_name}
                    onChange={(e) => setKioskForm({ ...kioskForm, display_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ipAddress">IP Address (Optional)</Label>
                  <Input
                    id="ipAddress"
                    type="text"
                    placeholder="e.g., 192.168.1.100"
                    value={kioskForm.ip_address}
                    onChange={(e) => setKioskForm({ ...kioskForm, ip_address: e.target.value })}
                  />
                </div>

                <Button onClick={createKiosk} disabled={loading} className="w-full">
                  {loading ? 'Creating Kiosk...' : 'Create Kiosk'}
                </Button>

                {message?.type === 'success' && message.text.includes('API key') && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="font-semibold text-yellow-900 mb-2">
                      ⚠️ Important: Save your API Key
                    </p>
                    <p className="text-sm text-yellow-800">
                      The API key will only be shown once. Make sure to save it securely and add it to your environment variables.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {kioskList.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Existing Kiosks</CardTitle>
                  <CardDescription>
                    {kioskList.length} kiosks found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {kioskList.map((kiosk) => (
                      <div key={kiosk.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{kiosk.display_name}</p>
                          <p className="text-sm text-gray-600">
                            {kiosk.device_name} • {kiosk.location?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {kiosk.ip_address || 'No IP restriction'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {kiosk.is_active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(kiosk.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
