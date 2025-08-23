import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/expenses - Get all expenses
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (startDate) {
      query = query.gte('expense_date', startDate)
    }
    if (endDate) {
      query = query.lte('expense_date', endDate)
    }

    const { data: expenses, error } = await query

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        return NextResponse.json({ expenses: [] })
      }
      console.error('Error fetching expenses:', error)
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
    }

    return NextResponse.json({ expenses: expenses || [] })

  } catch (error) {
    console.error('Error in GET /api/expenses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/expenses - Create new expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Generate expense number
    const expenseNumber = `EXP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
    
    // Calculate total amount (amount + tax)
    const totalAmount = body.amount + (body.tax_amount || 0)
    
    const newExpense = {
      tenant_id: '80496bff-b559-4b80-9102-3a84afdaa616', // Default tenant
      expense_number: expenseNumber,
      category: body.category,
      status: body.status || 'pending',
      expense_date: body.expense_date || new Date().toISOString(),
      supplier_name: body.supplier_name,
      supplier_invoice_number: body.supplier_invoice_number,
      amount: body.amount,
      tax_amount: body.tax_amount || 0,
      total_amount: totalAmount,
      description: body.description,
      notes: body.notes,
      related_invoice_id: body.related_invoice_id,
      related_lead_id: body.related_lead_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert([newExpense])
      .select()
      .single()

    if (error) {
      // If table doesn't exist, return error
      if (error.code === '42P01') {
        return NextResponse.json({ error: 'Expenses table not yet created. Please run migration.' }, { status: 400 })
      }
      console.error('Error creating expense:', error)
      return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
    }

    return NextResponse.json({ expense }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/expenses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}