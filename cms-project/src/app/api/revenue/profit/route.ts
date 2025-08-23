import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()
    
    // Date ranges
    const firstDayCurrentMonth = new Date(currentYear, currentMonth, 1)
    const firstDayNextMonth = new Date(currentYear, currentMonth + 1, 1)
    const firstDayPreviousMonth = new Date(currentYear, currentMonth - 1, 1)
    const firstDayYear = new Date(currentYear, 0, 1)

    // Check if invoices table exists by attempting a query
    let hasInvoicesTable = true
    let hasExpensesTable = true

    // Get revenue from invoices (if table exists)
    let invoiceRevenue = { current: 0, previous: 0, ytd: 0 }
    try {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total_amount, issue_date, invoice_type')
        .in('status', ['sent', 'paid'])
        .eq('invoice_type', 'invoice')
        .gte('issue_date', firstDayYear.toISOString())

      if (invoices) {
        invoiceRevenue.current = invoices
          .filter(inv => new Date(inv.issue_date) >= firstDayCurrentMonth && new Date(inv.issue_date) < firstDayNextMonth)
          .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
        
        invoiceRevenue.previous = invoices
          .filter(inv => new Date(inv.issue_date) >= firstDayPreviousMonth && new Date(inv.issue_date) < firstDayCurrentMonth)
          .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
        
        invoiceRevenue.ytd = invoices
          .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      }
    } catch (error) {
      hasInvoicesTable = false
      console.log('Invoices table not available, using leads data only')
    }

    // Get expenses (if table exists)
    let expenses = { current: 0, previous: 0, ytd: 0 }
    try {
      const { data: expenseData } = await supabase
        .from('expenses')
        .select('total_amount, expense_date')
        .in('status', ['approved', 'paid'])
        .gte('expense_date', firstDayYear.toISOString())

      if (expenseData) {
        expenses.current = expenseData
          .filter(exp => new Date(exp.expense_date) >= firstDayCurrentMonth && new Date(exp.expense_date) < firstDayNextMonth)
          .reduce((sum, exp) => sum + (exp.total_amount || 0), 0)
        
        expenses.previous = expenseData
          .filter(exp => new Date(exp.expense_date) >= firstDayPreviousMonth && new Date(exp.expense_date) < firstDayCurrentMonth)
          .reduce((sum, exp) => sum + (exp.total_amount || 0), 0)
        
        expenses.ytd = expenseData
          .reduce((sum, exp) => sum + (exp.total_amount || 0), 0)
      }
    } catch (error) {
      hasExpensesTable = false
      console.log('Expenses table not available')
    }

    // Fallback to leads data for revenue if no invoices
    let leadRevenue = { current: 0, previous: 0, ytd: 0 }
    if (!hasInvoicesTable) {
      const { data: wonLeads } = await supabase
        .from('leads')
        .select('value, created_at')
        .eq('status', 'won')
        .gte('created_at', firstDayYear.toISOString())

      if (wonLeads) {
        leadRevenue.current = wonLeads
          .filter(lead => new Date(lead.created_at) >= firstDayCurrentMonth && new Date(lead.created_at) < firstDayNextMonth)
          .reduce((sum, lead) => sum + (lead.value || 0), 0)
        
        leadRevenue.previous = wonLeads
          .filter(lead => new Date(lead.created_at) >= firstDayPreviousMonth && new Date(lead.created_at) < firstDayCurrentMonth)
          .reduce((sum, lead) => sum + (lead.value || 0), 0)
        
        leadRevenue.ytd = wonLeads
          .reduce((sum, lead) => sum + (lead.value || 0), 0)
      }
    }

    // Use invoice revenue if available, otherwise use lead revenue
    const revenue = hasInvoicesTable ? invoiceRevenue : leadRevenue

    // Calculate profit metrics
    const currentProfit = revenue.current - expenses.current
    const previousProfit = revenue.previous - expenses.previous
    const ytdProfit = revenue.ytd - expenses.ytd

    // Calculate margins
    const currentMargin = revenue.current > 0 ? (currentProfit / revenue.current) * 100 : 0
    const previousMargin = revenue.previous > 0 ? (previousProfit / revenue.previous) * 100 : 0
    const ytdMargin = revenue.ytd > 0 ? (ytdProfit / revenue.ytd) * 100 : 0

    // Calculate growth
    const revenueGrowth = revenue.previous > 0 
      ? ((revenue.current - revenue.previous) / revenue.previous) * 100 
      : 0
    
    const profitGrowth = previousProfit !== 0 
      ? ((currentProfit - previousProfit) / Math.abs(previousProfit)) * 100 
      : 0

    // Get BTW summary if tables exist
    let btwSummary = null
    if (hasInvoicesTable) {
      try {
        // For now, calculate BTW manually since views might not exist
        const { data: invoiceItems } = await supabase
          .from('invoice_items')
          .select('tax_rate, tax_amount, invoice_id')
        
        if (invoiceItems) {
          const btw21 = invoiceItems
            .filter(item => item.tax_rate === 21)
            .reduce((sum, item) => sum + (item.tax_amount || 0), 0)
          
          const btw9 = invoiceItems
            .filter(item => item.tax_rate === 9)
            .reduce((sum, item) => sum + (item.tax_amount || 0), 0)
          
          const btwDeductible = hasExpensesTable ? expenses.ytd * 0.21 : 0 // Simplified: assume 21% on all expenses
          
          btwSummary = {
            btw21Collected: btw21,
            btw9Collected: btw9,
            totalCollected: btw21 + btw9,
            totalDeductible: btwDeductible,
            toPay: (btw21 + btw9) - btwDeductible
          }
        }
      } catch (error) {
        console.log('Could not calculate BTW summary')
      }
    }

    return NextResponse.json({
      revenue: {
        current: revenue.current,
        previous: revenue.previous,
        ytd: revenue.ytd,
        growth: revenueGrowth
      },
      expenses: {
        current: expenses.current,
        previous: expenses.previous,
        ytd: expenses.ytd,
        growth: expenses.previous > 0 
          ? ((expenses.current - expenses.previous) / expenses.previous) * 100 
          : 0
      },
      profit: {
        current: currentProfit,
        previous: previousProfit,
        ytd: ytdProfit,
        growth: profitGrowth
      },
      margins: {
        current: currentMargin,
        previous: previousMargin,
        ytd: ytdMargin
      },
      btw: btwSummary,
      dataSource: {
        revenue: hasInvoicesTable ? 'invoices' : 'leads',
        expenses: hasExpensesTable ? 'expenses' : 'none'
      }
    })

  } catch (error) {
    console.error('Error in profit overview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}