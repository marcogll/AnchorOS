'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign, Banknote, Smartphone, Gift, Receipt, Calculator } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '@/lib/auth/context'

interface POSItem {
  id: string
  type: 'service' | 'product'
  name: string
  price: number
  quantity: number
  category?: string
}

interface Payment {
  method: 'cash' | 'card' | 'transfer' | 'giftcard' | 'membership'
  amount: number
  reference?: string
}

interface SaleResult {
  id: string
  subtotal: number
  total: number
  payments: Payment[]
  items: POSItem[]
  receipt: any
}

export default function POSSystem() {
  const { user } = useAuth()
  const [cart, setCart] = useState<POSItem[]>([])
  const [services, setServices] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [currentPayment, setCurrentPayment] = useState<Partial<Payment>>({ method: 'cash', amount: 0 })
  const [receipt, setReceipt] = useState<SaleResult | null>(null)
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchServices()
    fetchProducts()
    fetchCustomers()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      const data = await response.json()
      if (data.success) {
        setServices(data.services || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const fetchProducts = async () => {
    // For now, we'll simulate products
    setProducts([
      { id: 'prod-1', name: 'Shampoo Premium', price: 250, category: 'hair' },
      { id: 'prod-2', name: 'Tratamiento Facial', price: 180, category: 'facial' },
      { id: 'prod-3', name: 'Esmalte', price: 45, category: 'nails' }
    ])
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers?limit=50')
      const data = await response.json()
      if (data.success) {
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const addToCart = (item: any, type: 'service' | 'product') => {
    const cartItem: POSItem = {
      id: item.id,
      type,
      name: item.name,
      price: item.base_price || item.price,
      quantity: 1,
      category: item.category
    }

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.type === type)
      if (existing) {
        return prev.map(i =>
          i.id === item.id && i.type === type
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, cartItem]
    })
  }

  const updateQuantity = (itemId: string, type: 'service' | 'product', quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId, type)
      return
    }

    setCart(prev =>
      prev.map(item =>
        item.id === itemId && item.type === type
          ? { ...item, quantity }
          : item
      )
    )
  }

  const removeFromCart = (itemId: string, type: 'service' | 'product') => {
    setCart(prev => prev.filter(item => !(item.id === itemId && item.type === type)))
  }

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const getTotal = () => {
    return getSubtotal() // Add tax/discount logic here if needed
  }

  const addPayment = () => {
    if (!currentPayment.method || !currentPayment.amount) return

    setPayments(prev => [...prev, currentPayment as Payment])
    setCurrentPayment({ method: 'cash', amount: 0 })
  }

  const removePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index))
  }

  const getTotalPayments = () => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0)
  }

  const getRemainingAmount = () => {
    return Math.max(0, getTotal() - getTotalPayments())
  }

  const processSale = async () => {
    if (cart.length === 0 || payments.length === 0) {
      alert('Agregue items al carrito y configure los pagos')
      return
    }

    if (getRemainingAmount() > 0.01) {
      alert('El total de pagos no cubre el monto total')
      return
    }

    setLoading(true)
    try {
      const saleData = {
        customer_id: selectedCustomer || null,
        items: cart,
        payments,
        notes: `Venta procesada en POS - ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`
      }

      const response = await fetch('/api/aperture/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      })

      const data = await response.json()

      if (data.success) {
        setReceipt(data.transaction)
        setReceiptDialogOpen(true)

        // Reset state
        setCart([])
        setPayments([])
        setSelectedCustomer('')
        setPaymentDialogOpen(false)
      } else {
        alert(data.error || 'Error procesando la venta')
      }
    } catch (error) {
      console.error('Error processing sale:', error)
      alert('Error procesando la venta')
    } finally {
      setLoading(false)
    }
  }

  const printReceipt = () => {
    // Simple print functionality
    window.print()
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <DollarSign className="w-4 h-4" />
      case 'card': return <CreditCard className="w-4 h-4" />
      case 'transfer': return <Banknote className="w-4 h-4" />
      case 'giftcard': return <Gift className="w-4 h-4" />
      case 'membership': return <Smartphone className="w-4 h-4" />
      default: return <DollarSign className="w-4 h-4" />
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
          <h2 className="text-2xl font-bold text-gray-900">Punto de Venta</h2>
          <p className="text-gray-600">Sistema completo de ventas y cobros</p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          <ShoppingCart className="w-4 h-4 mr-2" />
          {cart.length} items
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products/Services Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>Servicios Disponibles</CardTitle>
              <CardDescription>Seleccione servicios para agregar al carrito</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {services.slice(0, 9).map(service => (
                  <Button
                    key={service.id}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => addToCart(service, 'service')}
                  >
                    <span className="font-medium text-center">{service.name}</span>
                    <span className="text-sm text-gray-500">{formatCurrency(service.base_price)}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle>Productos</CardTitle>
              <CardDescription>Artículos disponibles para venta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {products.map(product => (
                  <Button
                    key={product.id}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => addToCart(product, 'product')}
                  >
                    <span className="font-medium text-center">{product.name}</span>
                    <span className="text-sm text-gray-500">{formatCurrency(product.price)}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart and Checkout */}
        <div className="space-y-6">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin cliente especificado</SelectItem>
                  {customers.slice(0, 10).map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle>Carrito de Compras</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>El carrito está vacío</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(item.price)} × {item.quantity}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromCart(item.id, item.type)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(getTotal())}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => setPaymentDialogOpen(true)}
                    disabled={cart.length === 0}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Procesar Pago
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
            <DialogDescription>
              Configure los métodos de pago para total: {formatCurrency(getTotal())}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Payments */}
            {payments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Pagos Configurados:</h4>
                {payments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(payment.method)}
                      <span className="capitalize">{payment.method}</span>
                      {payment.reference && (
                        <span className="text-sm text-gray-500">({payment.reference})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removePayment(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Payment */}
            <div className="space-y-3 p-4 border rounded">
              <h4 className="font-medium">Agregar Pago:</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="payment-method">Método</Label>
                  <Select
                    value={currentPayment.method}
                    onValueChange={(value) => setCurrentPayment({...currentPayment, method: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="giftcard">Gift Card</SelectItem>
                      <SelectItem value="membership">Membresía</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payment-amount">Monto</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    value={currentPayment.amount || ''}
                    onChange={(e) => setCurrentPayment({...currentPayment, amount: parseFloat(e.target.value) || 0})}
                    placeholder={getRemainingAmount().toFixed(2)}
                  />
                </div>
              </div>
              {(currentPayment.method === 'card' || currentPayment.method === 'transfer') && (
                <div>
                  <Label htmlFor="payment-reference">Referencia</Label>
                  <Input
                    id="payment-reference"
                    value={currentPayment.reference || ''}
                    onChange={(e) => setCurrentPayment({...currentPayment, reference: e.target.value})}
                    placeholder="Número de autorización"
                  />
                </div>
              )}
              <Button onClick={addPayment} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Pago
              </Button>
            </div>

            {/* Payment Summary */}
            <div className="p-4 bg-gray-50 rounded">
              <div className="flex justify-between mb-2">
                <span>Total a pagar:</span>
                <span className="font-bold">{formatCurrency(getTotal())}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Pagado:</span>
                <span className="text-green-600">{formatCurrency(getTotalPayments())}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Restante:</span>
                <span className={getRemainingAmount() > 0 ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(getRemainingAmount())}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={processSale}
              disabled={loading || getRemainingAmount() > 0.01}
              className="w-full"
            >
              {loading ? 'Procesando...' : 'Completar Venta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Recibo de Venta
            </DialogTitle>
          </DialogHeader>

          {receipt && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold">ANCHOR:23</div>
                <div className="text-sm text-gray-500">
                  {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
                </div>
                <div className="text-sm text-gray-500">Recibo #{receipt.id}</div>
              </div>

              <Separator />

              <div className="space-y-2">
                {receipt.items?.map((item: POSItem, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(receipt.total)}</span>
                </div>

                {receipt.payments?.map((payment: Payment, index: number) => (
                  <div key={index} className="flex justify-between text-sm text-gray-600">
                    <span className="capitalize">{payment.method}:</span>
                    <span>{formatCurrency(payment.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="text-center text-xs text-gray-500 pt-4">
                ¡Gracias por su preferencia!
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={printReceipt} variant="outline">
              <Receipt className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={() => setReceiptDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}