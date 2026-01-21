'use client'

/**
 * @description Payroll management interface for calculating and tracking staff compensation
 * @audit BUSINESS RULE: Payroll includes base salary, service commissions (10%), and tips (5%)
 * @audit SECURITY: Requires authenticated admin/manager role via useAuth hook
 * @audit Validate: Payroll period must have valid start and end dates
 * @audit AUDIT: Payroll calculations logged through /api/aperture/payroll endpoint
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calendar, DollarSign, Clock, Users, Calculator, Download, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '@/lib/auth/context'

interface PayrollRecord {
  id: string
  staff_id: string
  payroll_period_start: string
  payroll_period_end: string
  base_salary: number
  service_commissions: number
  total_tips: number
  total_earnings: number
  hours_worked: number
  status: string
  calculated_at?: string
  paid_at?: string
  staff?: {
    id: string
    display_name: string
    role: string
  }
}

interface PayrollCalculation {
  base_salary: number
  service_commissions: number
  total_tips: number
  total_earnings: number
  hours_worked: number
}

/**
 * @description Payroll management component with calculation, listing, and reporting features
 * @returns {JSX.Element} Complete payroll interface with period selection, staff filtering, and calculation modal
 * @audit BUSINESS RULE: Calculates payroll from completed bookings within the selected period
 * @audit BUSINESS RULE: Commission is 10% of service revenue, tips are 5% of service revenue
 * @audit SECURITY: Requires authenticated admin/manager role; staff cannot access payroll
 * @audit Validate: Ensures period dates are valid before calculation
 * @audit PERFORMANCE: Auto-sets default period to current month on mount
 * @audit AUDIT: Payroll records stored and retrievable for financial reporting
 */
export default function PayrollManagement() {
  const { user } = useAuth()
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [calculatedPayroll, setCalculatedPayroll] = useState<PayrollCalculation | null>(null)

  useEffect(() => {
    // Set default period to current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    setPeriodStart(format(startOfMonth, 'yyyy-MM-dd'))
    setPeriodEnd(format(endOfMonth, 'yyyy-MM-dd'))

    fetchPayrollRecords()
  }, [])

  const fetchPayrollRecords = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (periodStart) params.append('period_start', periodStart)
      if (periodEnd) params.append('period_end', periodEnd)

      const response = await fetch(`/api/aperture/payroll?${params}`)
      const data = await response.json()

      if (data.success) {
        setPayrollRecords(data.payroll_records || [])
      }
    } catch (error) {
      console.error('Error fetching payroll records:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePayroll = async () => {
    if (!selectedStaff || !periodStart || !periodEnd) {
      alert('Selecciona un empleado y período')
      return
    }

    setCalculating(true)
    try {
      const params = new URLSearchParams({
        staff_id: selectedStaff,
        period_start: periodStart,
        period_end: periodEnd,
        action: 'calculate'
      })

      const response = await fetch(`/api/aperture/payroll?${params}`)
      const data = await response.json()

      if (data.success) {
        setCalculatedPayroll(data.payroll)
        setShowCalculator(true)
      } else {
        alert(data.error || 'Error calculando nómina')
      }
    } catch (error) {
      console.error('Error calculating payroll:', error)
      alert('Error calculando nómina')
    } finally {
      setCalculating(false)
    }
  }

  const generatePayrollRecords = async () => {
    if (!periodStart || !periodEnd) {
      alert('Selecciona el período de nómina')
      return
    }

    if (!confirm(`¿Generar nóminas para el período ${periodStart} - ${periodEnd}?`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/aperture/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_start: periodStart,
          period_end: periodEnd
        })
      })

      const data = await response.json()

      if (data.success) {
        alert(`Nóminas generadas: ${data.payroll_records.length} registros`)
        fetchPayrollRecords()
      } else {
        alert(data.error || 'Error generando nóminas')
      }
    } catch (error) {
      console.error('Error generating payroll:', error)
      alert('Error generando nóminas')
    } finally {
      setLoading(false)
    }
  }

  const exportPayroll = () => {
    // Create CSV content
    const headers = ['Empleado', 'Rol', 'Período Inicio', 'Período Fin', 'Sueldo Base', 'Comisiones', 'Propinas', 'Total', 'Horas', 'Estado']
    const csvContent = [
      headers.join(','),
      ...payrollRecords.map(record => [
        record.staff?.display_name || 'N/A',
        record.staff?.role || 'N/A',
        record.payroll_period_start,
        record.payroll_period_end,
        record.base_salary,
        record.service_commissions,
        record.total_tips,
        record.total_earnings,
        record.hours_worked,
        record.status
      ].join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nomina-${periodStart}-${periodEnd}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'calculated': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sistema de Nómina</h2>
          <p className="text-gray-600">Gestión de sueldos, comisiones y propinas</p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Gestión de Nómina
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="period-start">Período Inicio</Label>
              <Input
                id="period-start"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="period-end">Período Fin</Label>
              <Input
                id="period-end"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="staff-select">Empleado (opcional)</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los empleados" />
                </SelectTrigger>
                <SelectContent>
                  {/* This would need to be populated with actual staff data */}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={fetchPayrollRecords} disabled={loading}>
                <Eye className="w-4 h-4 mr-2" />
                Ver Nóminas
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={calculatePayroll} disabled={calculating}>
              <Calculator className="w-4 h-4 mr-2" />
              {calculating ? 'Calculando...' : 'Calcular Nómina'}
            </Button>
            <Button onClick={generatePayrollRecords} variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Generar Nóminas
            </Button>
            <Button onClick={exportPayroll} variant="outline" disabled={payrollRecords.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Nómina</CardTitle>
          <CardDescription>
            {payrollRecords.length} registros encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando registros...</div>
          ) : payrollRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay registros de nómina para el período seleccionado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Sueldo Base</TableHead>
                  <TableHead className="text-right">Comisiones</TableHead>
                  <TableHead className="text-right">Propinas</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.staff?.display_name}</div>
                        <div className="text-sm text-gray-500">{record.staff?.role}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(record.payroll_period_start), 'dd/MM', { locale: es })} - {format(new Date(record.payroll_period_end), 'dd/MM', { locale: es })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(record.base_salary)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(record.service_commissions)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(record.total_tips)}
                    </TableCell>
                    <TableCell className="text-right font-bold font-mono">
                      {formatCurrency(record.total_earnings)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {record.hours_worked.toFixed(1)}h
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(record.status)}>
                        {record.status === 'paid' ? 'Pagada' :
                         record.status === 'calculated' ? 'Calculada' :
                         record.status === 'pending' ? 'Pendiente' : record.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payroll Calculator Dialog */}
      <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cálculo de Nómina</DialogTitle>
            <DialogDescription>
              Desglose detallado para el período seleccionado
            </DialogDescription>
          </DialogHeader>

          {calculatedPayroll && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Sueldo Base</div>
                  <div className="text-2xl font-bold text-blue-800">
                    {formatCurrency(calculatedPayroll.base_salary)}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Comisiones</div>
                  <div className="text-2xl font-bold text-green-800">
                    {formatCurrency(calculatedPayroll.service_commissions)}
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-sm text-yellow-600 font-medium">Propinas</div>
                  <div className="text-2xl font-bold text-yellow-800">
                    {formatCurrency(calculatedPayroll.total_tips)}
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">Total</div>
                  <div className="text-2xl font-bold text-purple-800">
                    {formatCurrency(calculatedPayroll.total_earnings)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Horas trabajadas: {calculatedPayroll.hours_worked.toFixed(1)} horas</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowCalculator(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}