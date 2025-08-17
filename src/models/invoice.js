import { supabase } from '@/lib/supabase'

export class Invoice {
  static async create(data) {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get user's tenant_id
      const { data: userTenant } = await supabase
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single()

      if (!userTenant) throw new Error('No tenant found for user')

      // Generate invoice number
      const { data: invoiceNumber } = await supabase
        .rpc('generate_invoice_number', {
          p_tenant_id: userTenant.tenant_id,
          p_invoice_type: data.invoice_type || 'invoice'
        })

      // Create invoice
      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          tenant_id: userTenant.tenant_id,
          created_by: user.id,
          invoice_number: invoiceNumber,
          ...data
        })
        .select()
        .single()

      if (error) throw error
      return invoice
    } catch (error) {
      console.error('Error creating invoice:', error)
      throw error
    }
  }

  static async update(id, data) {
    try {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return invoice
    } catch (error) {
      console.error('Error updating invoice:', error)
      throw error
    }
  }

  static async delete(id) {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting invoice:', error)
      throw error
    }
  }

  static async getById(id) {
    try {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items(*),
          lead:leads(*),
          contact:contacts(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return invoice
    } catch (error) {
      console.error('Error fetching invoice:', error)
      throw error
    }
  }

  static async getAll(filters = {}) {
    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          lead:leads(id, name, email, company),
          contact:contacts(id, name, email, company)
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.invoice_type) {
        query = query.eq('invoice_type', filters.invoice_type)
      }
      if (filters.lead_id) {
        query = query.eq('lead_id', filters.lead_id)
      }
      if (filters.contact_id) {
        query = query.eq('contact_id', filters.contact_id)
      }
      if (filters.from_date) {
        query = query.gte('issue_date', filters.from_date)
      }
      if (filters.to_date) {
        query = query.lte('issue_date', filters.to_date)
      }

      const { data: invoices, error } = await query

      if (error) throw error
      return invoices
    } catch (error) {
      console.error('Error fetching invoices:', error)
      throw error
    }
  }

  static async addItem(invoiceId, item) {
    try {
      const { data: newItem, error } = await supabase
        .from('invoice_items')
        .insert({
          invoice_id: invoiceId,
          ...item
        })
        .select()
        .single()

      if (error) throw error
      return newItem
    } catch (error) {
      console.error('Error adding invoice item:', error)
      throw error
    }
  }

  static async updateItem(itemId, data) {
    try {
      const { data: item, error } = await supabase
        .from('invoice_items')
        .update(data)
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      return item
    } catch (error) {
      console.error('Error updating invoice item:', error)
      throw error
    }
  }

  static async deleteItem(itemId) {
    try {
      const { error } = await supabase
        .from('invoice_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting invoice item:', error)
      throw error
    }
  }

  static async searchCustomers(searchTerm) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get user's tenant_id
      const { data: userTenant } = await supabase
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single()

      if (!userTenant) throw new Error('No tenant found for user')

      // Search using the unified customer view
      const { data: customers, error } = await supabase
        .from('customer_search_view')
        .select(`
          id,
          primary_type,
          name,
          email,
          phone,
          company,
          street,
          house_number,
          postal_code,
          city,
          province,
          country,
          lead_id,
          contact_id,
          status,
          tags
        `)
        .eq('tenant_id', userTenant.tenant_id)
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`)
        .limit(20)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error searching customers:', error)
        // Fallback to old method if view doesn't exist yet
        const { data: leads } = await supabase
          .from('leads')
          .select('id, name, email, phone, company, street, house_number, postal_code, city')
          .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`)
          .eq('tenant_id', userTenant.tenant_id)
          .limit(10)

        const { data: contacts } = await supabase
          .from('contacts')
          .select('id, name, email, phone, company, street, house_number, postal_code, city')
          .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`)
          .eq('tenant_id', userTenant.tenant_id)
          .limit(10)

        return {
          leads: leads || [],
          contacts: contacts || []
        }
      }

      // Separate customers into leads and contacts for backward compatibility
      const leads = customers?.filter(c => c.primary_type === 'lead').map(c => ({
        id: c.lead_id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        street: c.street,
        house_number: c.house_number,
        postal_code: c.postal_code,
        city: c.city,
        province: c.province,
        country: c.country,
        status: c.status,
        _isLead: true
      })) || []

      const contacts = customers?.filter(c => c.primary_type === 'contact').map(c => ({
        id: c.contact_id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        street: c.street,
        house_number: c.house_number,
        postal_code: c.postal_code,
        city: c.city,
        province: c.province,
        country: c.country,
        status: c.status,
        _isContact: true
      })) || []

      return {
        leads,
        contacts,
        hasUnifiedView: true
      }
    } catch (error) {
      console.error('Error searching customers:', error)
      throw error
    }
  }

  static async getOpenQuotes() {
    try {
      const { data: quotes, error } = await supabase
        .from('invoices')
        .select(`
          *,
          lead:leads(id, name, email, company),
          contact:contacts(id, name, email, company)
        `)
        .eq('invoice_type', 'quote')
        .in('status', ['draft', 'sent'])
        .order('created_at', { ascending: false })

      if (error) throw error
      return quotes
    } catch (error) {
      console.error('Error fetching open quotes:', error)
      throw error
    }
  }

  static async convertQuoteToInvoice(quoteId) {
    try {
      // Get the quote
      const quote = await this.getById(quoteId)
      if (!quote) throw new Error('Quote not found')
      if (quote.invoice_type !== 'quote') throw new Error('Not a quote')

      // Create new invoice from quote
      const invoiceData = {
        ...quote,
        invoice_type: 'invoice',
        status: 'draft',
        quote_valid_until: null
      }
      delete invoiceData.id
      delete invoiceData.invoice_number
      delete invoiceData.created_at
      delete invoiceData.updated_at
      delete invoiceData.invoice_items
      delete invoiceData.lead
      delete invoiceData.contact

      // Create the invoice
      const newInvoice = await this.create(invoiceData)

      // Copy invoice items
      if (quote.invoice_items && quote.invoice_items.length > 0) {
        for (const item of quote.invoice_items) {
          const itemData = { ...item }
          delete itemData.id
          delete itemData.invoice_id
          delete itemData.created_at
          delete itemData.updated_at
          await this.addItem(newInvoice.id, itemData)
        }
      }

      // Update quote status
      await this.update(quoteId, { status: 'expired' })

      return newInvoice
    } catch (error) {
      console.error('Error converting quote to invoice:', error)
      throw error
    }
  }
}