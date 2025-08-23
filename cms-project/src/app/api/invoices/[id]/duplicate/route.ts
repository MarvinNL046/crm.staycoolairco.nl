import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// POST /api/invoices/[id]/duplicate - Duplicate invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // Get the original invoice with items
    const { data: originalInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items(*)
      `)
      .eq('id', resolvedParams.id)
      .single();

    if (fetchError) {
      console.error('Error fetching original invoice:', fetchError);
      return NextResponse.json({ error: 'Original invoice not found' }, { status: 404 });
    }

    // Generate new invoice number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    
    const newInvoiceNumber = `${originalInvoice.invoice_number}-COPY-${year}${month}${day}-${time}`;

    // Create duplicate invoice
    const { data: newInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_type: originalInvoice.invoice_type,
        invoice_number: newInvoiceNumber,
        status: 'draft', // Always start as draft
        customer_name: originalInvoice.customer_name,
        customer_email: originalInvoice.customer_email,
        customer_phone: originalInvoice.customer_phone,
        customer_company: originalInvoice.customer_company,
        billing_address_line1: originalInvoice.billing_address_line1,
        billing_address_line2: originalInvoice.billing_address_line2,
        billing_city: originalInvoice.billing_city,
        billing_state: originalInvoice.billing_state,
        billing_postal_code: originalInvoice.billing_postal_code,
        billing_country: originalInvoice.billing_country,
        issue_date: now.toISOString().split('T')[0], // Today's date
        due_date: originalInvoice.due_date ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null, // 30 days from now
        quote_valid_until: originalInvoice.quote_valid_until ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
        paid_date: null, // Clear paid date
        currency: originalInvoice.currency,
        subtotal: originalInvoice.subtotal,
        tax_rate: originalInvoice.tax_rate,
        tax_amount: originalInvoice.tax_amount,
        discount_amount: originalInvoice.discount_amount,
        discount_percentage: originalInvoice.discount_percentage,
        total_amount: originalInvoice.total_amount,
        notes: originalInvoice.notes,
        internal_notes: `Duplicated from ${originalInvoice.invoice_number} on ${now.toLocaleDateString('nl-NL')}`,
        payment_terms: originalInvoice.payment_terms,
        payment_method: originalInvoice.payment_method,
        contact_id: originalInvoice.contact_id,
        lead_id: originalInvoice.lead_id,
        tenant_id: originalInvoice.tenant_id,
        created_by: originalInvoice.created_by,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating duplicate invoice:', invoiceError);
      return NextResponse.json({ error: 'Failed to duplicate invoice' }, { status: 500 });
    }

    // Duplicate invoice items
    if (originalInvoice.invoice_items && originalInvoice.invoice_items.length > 0) {
      const itemsToInsert = originalInvoice.invoice_items.map((item: any) => ({
        invoice_id: newInvoice.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        tax_rate: item.tax_rate,
        tax_amount: item.tax_amount,
        discount_amount: item.discount_amount || 0,
        discount_percentage: item.discount_percentage || 0,
        total: item.total,
        position: item.position,
        product_id: item.product_id,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error duplicating invoice items:', itemsError);
        // Don't fail the whole operation, but log the error
      }
    }

    return NextResponse.json({ 
      success: true, 
      invoice: newInvoice,
      message: `Invoice duplicated successfully as ${newInvoiceNumber}` 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}