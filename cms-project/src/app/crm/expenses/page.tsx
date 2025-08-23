"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Plus,
  Euro,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Receipt,
  FileText,
  Package,
  Truck,
  Home,
  MoreHorizontal,
  Download,
  Edit,
  Trash2
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/analytics-helpers"
import { toast } from "sonner"

interface Expense {
  id: string
  expense_number: string
  category: string
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  expense_date: string
  paid_date?: string
  supplier_name: string
  supplier_invoice_number?: string
  amount: number
  tax_amount: number
  total_amount: number
  description: string
  notes?: string
  related_invoice_id?: string
  related_lead_id?: string
}

const categoryIcons = {
  materials: Package,
  labor: Receipt,
  transport: Truck,
  overhead: Home,
  other: FileText
}

const categoryLabels = {
  materials: 'Materialen',
  labor: 'Arbeid',
  transport: 'Transport',
  overhead: 'Overhead',
  other: 'Overig'
}

const statusConfig = {
  pending: { label: 'In afwachting', variant: 'secondary' as const, icon: Clock },
  approved: { label: 'Goedgekeurd', variant: 'default' as const, icon: CheckCircle },
  paid: { label: 'Betaald', variant: 'success' as const, icon: CheckCircle },
  rejected: { label: 'Afgewezen', variant: 'destructive' as const, icon: XCircle }
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [formData, setFormData] = useState({
    supplier_name: '',
    supplier_invoice_number: '',
    category: 'materials',
    description: '',
    amount: '',
    tax_amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      if (!response.ok) throw new Error('Failed to fetch expenses')
      const data = await response.json()
      setExpenses(data.expenses || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Fout bij ophalen kosten')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          tax_amount: parseFloat(formData.tax_amount || '0')
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create expense')
      }

      toast.success('Kosten succesvol toegevoegd')
      setShowAddDialog(false)
      setFormData({
        supplier_name: '',
        supplier_invoice_number: '',
        category: 'materials',
        description: '',
        amount: '',
        tax_amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      fetchExpenses()
    } catch (error) {
      console.error('Error creating expense:', error)
      toast.error(error instanceof Error ? error.message : 'Fout bij toevoegen kosten')
    }
  }

  const calculateBTW = (amount: string) => {
    const amountNum = parseFloat(amount) || 0
    const btw = amountNum * 0.21
    setFormData({ ...formData, amount, tax_amount: btw.toFixed(2) })
  }

  const stats = {
    total: expenses.reduce((sum, exp) => sum + exp.total_amount, 0),
    pending: expenses.filter(exp => exp.status === 'pending').reduce((sum, exp) => sum + exp.total_amount, 0),
    approved: expenses.filter(exp => exp.status === 'approved').reduce((sum, exp) => sum + exp.total_amount, 0),
    paid: expenses.filter(exp => exp.status === 'paid').reduce((sum, exp) => sum + exp.total_amount, 0),
    totalBTW: expenses.reduce((sum, exp) => sum + exp.tax_amount, 0)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Kosten</h1>
          <p className="text-muted-foreground">Beheer uw inkoopfacturen en kosten</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kosten</h1>
          <p className="text-muted-foreground">Beheer uw inkoopfacturen en bedrijfskosten</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Kosten
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Kosten</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
            <p className="text-xs text-muted-foreground">
              {expenses.length} facturen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Afwachting</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pending)}</div>
            <p className="text-xs text-muted-foreground">
              Ter goedkeuring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goedgekeurd</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.approved)}</div>
            <p className="text-xs text-muted-foreground">
              Te betalen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Betaald</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.paid)}</div>
            <p className="text-xs text-muted-foreground">
              Afgerond
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BTW Betaald</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalBTW)}</div>
            <p className="text-xs text-muted-foreground">
              Aftrekbaar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kosten Overzicht</CardTitle>
          <CardDescription>
            Alle inkoopfacturen en bedrijfskosten
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Geen kosten gevonden</h3>
              <p className="text-muted-foreground mb-4">
                Begin met het toevoegen van uw eerste inkoopfactuur
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Eerste Kosten Toevoegen
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nummer</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Leverancier</TableHead>
                  <TableHead>Omschrijving</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Bedrag</TableHead>
                  <TableHead className="text-right">BTW</TableHead>
                  <TableHead className="text-right">Totaal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => {
                  const CategoryIcon = categoryIcons[expense.category as keyof typeof categoryIcons] || FileText
                  const StatusConfig = statusConfig[expense.status]
                  
                  return (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.expense_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{categoryLabels[expense.category as keyof typeof categoryLabels]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{expense.supplier_name}</div>
                          {expense.supplier_invoice_number && (
                            <div className="text-sm text-muted-foreground">
                              {expense.supplier_invoice_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{new Date(expense.expense_date).toLocaleDateString('nl-NL')}</TableCell>
                      <TableCell>
                        <Badge variant={StatusConfig.variant}>
                          <StatusConfig.icon className="w-3 h-3 mr-1" />
                          {StatusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(expense.tax_amount)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(expense.total_amount)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Nieuwe Kosten Toevoegen</DialogTitle>
              <DialogDescription>
                Voeg een nieuwe inkoopfactuur of kostenpost toe
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier_name">Leverancier *</Label>
                  <Input
                    id="supplier_name"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
                    placeholder="Naam leverancier"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier_invoice_number">Factuurnummer</Label>
                  <Input
                    id="supplier_invoice_number"
                    value={formData.supplier_invoice_number}
                    onChange={(e) => setFormData({...formData, supplier_invoice_number: e.target.value})}
                    placeholder="Leverancier factuurnr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categorie *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({...formData, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="materials">Materialen</SelectItem>
                      <SelectItem value="labor">Arbeid</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="overhead">Overhead</SelectItem>
                      <SelectItem value="other">Overig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense_date">Datum *</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Omschrijving *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Korte omschrijving van de kosten"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Bedrag excl. BTW *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => calculateBTW(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_amount">BTW (21%)</Label>
                  <Input
                    id="tax_amount"
                    type="number"
                    step="0.01"
                    value={formData.tax_amount}
                    onChange={(e) => setFormData({...formData, tax_amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Totaal incl. BTW</Label>
                  <div className="text-2xl font-bold pt-1">
                    {formatCurrency((parseFloat(formData.amount) || 0) + (parseFloat(formData.tax_amount) || 0))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notities</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Optionele notities"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Annuleren
              </Button>
              <Button type="submit">
                Toevoegen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}