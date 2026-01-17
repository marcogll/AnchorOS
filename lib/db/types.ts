// Types based on AnchorOS (Adela) database schema

/** User roles in the system */
export type UserRole = 'admin' | 'manager' | 'staff' | 'artist' | 'customer' | 'kiosk'
export type CustomerTier = 'free' | 'gold' | 'black' | 'VIP'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
export type InvitationStatus = 'pending' | 'used' | 'expired'
export type ResourceType = 'station' | 'room' | 'equipment'
export type AuditAction = 'create' | 'update' | 'delete' | 'reset_invitations' | 'payment' | 'status_change'

/** Represents a salon location with timezone and contact info */
export interface Location {
  id: string
  name: string
  timezone: string
  address?: string
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Resource {
  id: string
  location_id: string
  name: string
  type: ResourceType
  capacity: number
  is_active: boolean
  created_at: string
  updated_at: string
  location?: Location
}

export interface Staff {
  id: string
  user_id: string
  location_id: string
  role: UserRole
  display_name: string
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
  location?: Location
}

export interface Kiosk {
  id: string
  location_id: string
  device_name: string
  display_name: string
  api_key: string
  ip_address?: string
  is_active: boolean
  created_at: string
  updated_at: string
  location?: Location
}

export interface Service {
  id: string
  name: string
  description?: string
  duration_minutes: number
  base_price: number
  requires_dual_artist: boolean
  premium_fee_enabled: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  user_id?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  tier: CustomerTier
  notes?: string
  total_spent: number
  total_visits: number
  last_visit_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Invitation {
  id: string
  inviter_id: string
  code: string
  email?: string
  status: InvitationStatus
  week_start_date: string
  expiry_date: string
  used_at?: string
  created_at: string
  updated_at: string
  inviter?: Customer
}

/** Represents a customer booking with service, staff, and resource assignments */
export interface Booking {
  id: string
  short_id: string
  customer_id: string
  staff_id: string
  secondary_artist_id?: string
  location_id: string
  resource_id: string
  service_id: string
  start_time_utc: string
  end_time_utc: string
  status: BookingStatus
  deposit_amount: number
  total_amount: number
  is_paid: boolean
  payment_reference?: string
  notes?: string
  created_at: string
  updated_at: string
  customer?: Customer
  staff?: Staff
  secondary_artist?: Staff
  location?: Location
  resource?: Resource
  service?: Service
}

export interface AuditLog {
  id: string
  entity_type: string
  entity_id: string
  action: AuditAction
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  performed_by?: string
  performed_by_role?: UserRole
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, unknown>
  created_at: string
}

// Database response types
export type Database = {
  public: {
    Tables: {
      locations: {
        Row: Location
        Insert: Omit<Location, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Location, 'id' | 'created_at'>>
      }
      resources: {
        Row: Resource
        Insert: Omit<Resource, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Resource, 'id' | 'created_at'>>
      }
      staff: {
        Row: Staff
        Insert: Omit<Staff, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Staff, 'id' | 'created_at'>>
      }
      kiosks: {
        Row: Kiosk
        Insert: Omit<Kiosk, 'id' | 'created_at' | 'updated_at' | 'api_key'>
        Update: Partial<Omit<Kiosk, 'id' | 'created_at' | 'updated_at' | 'api_key'>>
      }
      services: {
        Row: Service
        Insert: Omit<Service, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Service, 'id' | 'created_at'>>
      }
      customers: {
        Row: Customer
        Insert: Omit<Customer, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Customer, 'id' | 'created_at'>>
      }
      invitations: {
        Row: Invitation
        Insert: Omit<Invitation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Invitation, 'id' | 'created_at'>>
      }
      bookings: {
        Row: Booking
        Insert: Omit<Booking, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Booking, 'id' | 'created_at'>>
      }
      audit_logs: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'>
        Update: Partial<AuditLog>
      }
    }
  }
}
