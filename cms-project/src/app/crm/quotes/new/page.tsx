'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2, Save, Send } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { CustomerSelector } from '@/components/crm/customer-selector'

interface QuoteItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface Customer {
  id: number | string
  name: string
  company: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
  totalValue?: number
  lastInvoice?: string
  relationship?: 'hot' | 'warm' | 'cold'
}

export default function NewQuotePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [items, setItems] = useState<QuoteItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 }
  ])
  
  const [formData, setFormData] = useState({
    title: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    valid_days: 30,
    payment_terms: 'Net 30',
    notes: '',
    status: 'draft'
  })

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    // Update form data with customer information
    setFormData(prev => ({
      ...prev,
      title: prev.title || `Offerte voor ${customer.company}`,
      customer_name: customer.company || customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      customer_address: `${customer.address}\n${customer.postalCode} ${customer.city}\n${customer.country}`
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: value
    }
    
    // Calculate total for the item
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price
    }
    
    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0)
  }

  const handleSubmit = async (status: 'draft' | 'sent') => {
    setLoading(true)
    
    try {
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + formData.valid_days)
      
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status,
          valid_until: validUntil.toISOString(),
          total_amount: calculateTotal(),
          items: items.filter(item => item.description) // Only include items with descriptions
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create quote')
      }

      toast.success(
        status === 'sent' ? 'Offerte verzonden' : 'Offerte opgeslagen',
        {
          description: status === 'sent' 
            ? 'De offerte is succesvol verzonden naar de klant.'
            : 'De offerte is opgeslagen als concept.',
        }
      )

      router.push('/crm/quotes')
    } catch (error) {
      console.error('Error creating quote:', error)
      toast.error('Fout', {
        description: 'Er is een fout opgetreden bij het maken van de offerte.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/crm/quotes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nieuwe Offerte</h1>
            <p className="text-muted-foreground">Maak een nieuwe offerte voor een klant</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleSubmit('draft')}
            disabled={loading}
          >
            <Save className="mr-2 h-4 w-4" />
            Opslaan als concept
          </Button>
          <Button 
            onClick={() => handleSubmit('sent')}
            disabled={loading}
          >
            <Send className="mr-2 h-4 w-4" />
            Verzenden
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Klantgegevens</CardTitle>
            <CardDescription>Selecteer een bestaande klant of voer nieuwe gegevens in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CustomerSelector onSelect={handleCustomerSelect} />
            
            {selectedCustomer ? (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{selectedCustomer.company || selectedCustomer.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{selectedCustomer.address}</p>
                  <p>{selectedCustomer.postalCode} {selectedCustomer.city}</p>
                  <p>{selectedCustomer.country}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedCustomer(null)
                    setFormData(prev => ({
                      ...prev,
                      customer_name: '',
                      customer_email: '',
                      customer_phone: '',
                      customer_address: ''
                    }))
                  }}
                >
                  Andere klant selecteren
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Of voer handmatig in</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Klantnaam *</Label>
                  <Input
                    id="customer_name"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    placeholder="Bedrijfsnaam of contactpersoon"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_email">E-mail</Label>
                  <Input
                    id="customer_email"
                    name="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={handleInputChange}
                    placeholder="klant@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_phone">Telefoon</Label>
                  <Input
                    id="customer_phone"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    placeholder="+31 6 12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_address">Adres</Label>
                  <Textarea
                    id="customer_address"
                    name="customer_address"
                    value={formData.customer_address}
                    onChange={handleInputChange}
                    placeholder="Straat 123, 1234 AB Stad"
                    rows={3}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Offerte details</CardTitle>
            <CardDescription>Configureer de offerte instellingen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Offerte titel *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Bijv. Airco installatie kantoor"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid_days">Geldig voor (dagen)</Label>
              <Input
                id="valid_days"
                name="valid_days"
                type="number"
                value={formData.valid_days}
                onChange={handleInputChange}
                min="1"
                max="365"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_terms">Betalingsvoorwaarden</Label>
              <Select 
                value={formData.payment_terms} 
                onValueChange={(value) => handleSelectChange('payment_terms', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Net 30">Netto 30 dagen</SelectItem>
                  <SelectItem value="Net 15">Netto 15 dagen</SelectItem>
                  <SelectItem value="Net 7">Netto 7 dagen</SelectItem>
                  <SelectItem value="Due on receipt">Direct betalen</SelectItem>
                  <SelectItem value="50% upfront">50% vooraf</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Opmerkingen</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Extra informatie of voorwaarden..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Offerte regels</CardTitle>
          <CardDescription>Voeg producten of diensten toe aan de offerte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
              <div className="col-span-5">Omschrijving</div>
              <div className="col-span-2">Aantal</div>
              <div className="col-span-2">Prijs per stuk</div>
              <div className="col-span-2">Totaal</div>
              <div className="col-span-1"></div>
            </div>
            
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4">
                <div className="col-span-5">
                  <Input
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Product of dienst omschrijving"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                    min="0"
                    step="1"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    value={item.total.toFixed(2)}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addItem}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Regel toevoegen
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            * BTW wordt apart berekend
          </div>
          <div className="text-xl font-bold">
            Totaal: € {calculateTotal().toFixed(2)}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}