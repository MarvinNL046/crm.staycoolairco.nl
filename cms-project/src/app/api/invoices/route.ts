import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest, createUnauthorizedResponse } from '@/lib/auth/api-auth';

// GET /api/invoices - Fetch all invoices for tenant
export async function GET(request: NextRequest) {
  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request);
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status);
  }

  const { supabase, tenantId } = authResult;

  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'quote' or 'invoice'
    const status = searchParams.get('status');
    
    // Build query
    let query = supabase
      .from('invoices')
      .select(`
        *,
        invoice_items(*)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (type) {
      query = query.eq('invoice_type', type);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: invoices, error } = await query;
    
    if (error) {
      console.error('Error fetching invoices:', error);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }
    
    // Transform data to match frontend expectations
    const transformedInvoices = invoices?.map((invoice: any) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      title: `${invoice.invoice_type === 'quote' ? 'Offerte' : 'Factuur'} ${invoice.customer_name}`,
      type: invoice.invoice_type,
      status: invoice.status,
      client: invoice.customer_company || invoice.customer_name,
      contact: invoice.customer_name,
      email: invoice.customer_email,
      total: invoice.total_amount,
      subtotal: invoice.subtotal,
      taxAmount: invoice.tax_amount,
      currency: invoice.currency || 'EUR',
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      paidDate: invoice.paid_date,
      quoteValidUntil: invoice.quote_valid_until,
      items: invoice.invoice_items?.map((item: any) => ({
        id: item.id,
        description: `${item.name}${item.description ? ` - ${item.description}` : ''}`,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.total
      })) || [],
      notes: invoice.notes,
      internalNotes: invoice.internal_notes,
      paymentTerms: invoice.payment_terms,
      paymentMethod: invoice.payment_method
    })) || [];
    
    return NextResponse.json({
      invoices: transformedInvoices,
      count: transformedInvoices.length
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/invoices - Create new invoice
export async function POST(request: NextRequest) {
  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request);
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status);
  }

  const { supabase, tenantId } = authResult;

  try {
    const body = await request.json();
    
    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        ...body,
        tenant_id: tenantId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }
    
    // Create invoice items if provided
    if (body.items && body.items.length > 0) {
      const itemsToInsert = body.items.map((item: any, index: number) => ({
        invoice_id: invoice.id,
        name: item.name || item.description,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice || item.unit_price,
        subtotal: item.subtotal || (item.quantity * (item.unitPrice || item.unit_price)),
        tax_rate: item.taxRate || item.tax_rate || 21,
        tax_amount: item.taxAmount || item.tax_amount || 0,
        total: item.total,
        position: index + 1
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);
      
      if (itemsError) {
        console.error('Error creating invoice items:', itemsError);
        // Don't fail the whole request, but log the error
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      invoice: invoice,
      message: 'Invoice created successfully' 
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}