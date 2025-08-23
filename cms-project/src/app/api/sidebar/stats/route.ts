import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    // Get leads counts by status
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('status')

    if (leadsError) {
      console.error('Error fetching leads for sidebar:', leadsError)
      return NextResponse.json({ error: 'Failed to fetch leads data' }, { status: 500 })
    }

    // Get deals counts (using leads with proposal/won status as deals)
    const deals = leads?.filter(lead => 
      lead.status === 'proposal' || lead.status === 'won' || lead.status === 'qualified'
    ) || []

    // Get contacts count
    const { count: contactsCount, error: contactsError } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })

    if (contactsError) {
      console.error('Error fetching contacts count:', contactsError)
      return NextResponse.json({ error: 'Failed to fetch contacts data' }, { status: 500 })
    }

    // Get invoices count (mock for now since invoices table might not exist)
    let invoicesCount = 0
    try {
      const { count: invoiceCount } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
      invoicesCount = invoiceCount || 0
    } catch (error) {
      // Table might not exist, use leads with 'won' status as invoices
      invoicesCount = leads?.filter(lead => lead.status === 'won').length || 0
    }

    // Calculate totals and urgent counts
    const totalLeads = leads?.length || 0
    const newLeads = leads?.filter(lead => lead.status === 'new').length || 0
    const totalDeals = deals.length
    const wonDeals = leads?.filter(lead => lead.status === 'won').length || 0
    
    // Define urgency based on business rules
    const urgentInvoices = Math.min(invoicesCount, 3) // Max 3 urgent for demo

    const sidebarStats = {
      leads: {
        total: totalLeads,
        new: newLeads,
        badge: newLeads > 0 ? { count: newLeads, variant: 'default' } : null
      },
      contacts: {
        total: contactsCount || 0,
        badge: null // Contacts don't typically show urgent badges
      },
      deals: {
        total: totalDeals,
        won: wonDeals,
        badge: totalDeals > 0 ? { count: totalDeals, variant: 'secondary' } : null
      },
      invoices: {
        total: invoicesCount,
        urgent: urgentInvoices,
        badge: urgentInvoices > 0 ? { count: urgentInvoices, variant: 'destructive' } : null
      },
      // Additional stats for other menu items
      companies: {
        total: Math.floor(contactsCount || 0 / 2), // Estimate: half of contacts are companies
        badge: null
      }
    }

    return NextResponse.json(sidebarStats)

  } catch (error) {
    console.error('Error in sidebar stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}