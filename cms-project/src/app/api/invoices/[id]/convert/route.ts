import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest, createUnauthorizedResponse } from '@/lib/auth/api-auth';

// POST /api/invoices/[id]/convert - Convert quote to invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request);
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status);
  }

  const { supabase, tenantId, user } = authResult;

  try {
    const resolvedParams = await params;
    
    // SECURITY: Get the original quote with tenant validation
    const { data: originalQuote, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items(*)
      `)
      .eq('id', resolvedParams.id)
      .eq('tenant_id', tenantId) // SECURITY: Only user's tenant
      .eq('invoice_type', 'quote')
      .single();

    if (fetchError) {
      console.error('Error fetching original quote:', fetchError);
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    if (!originalQuote) {
      console.error('No quote found with ID:', resolvedParams.id);
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    if (originalQuote.invoice_type !== 'quote') {
      console.error('Document is not a quote:', originalQuote.invoice_type);
      return NextResponse.json({ error: 'Only quotes can be converted to invoices' }, { status: 400 });
    }

    if (originalQuote.status === 'converted') {
      console.error('Quote already converted:', originalQuote.invoice_number);
      return NextResponse.json({ error: 'This quote has already been converted to an invoice' }, { status: 400 });
    }

    console.log('Quote found:', originalQuote.invoice_number, 'Status:', originalQuote.status);

    // Generate new invoice number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // SECURITY: Get next invoice number for this year/month (tenant-specific)
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('invoice_type', 'invoice')
      .eq('tenant_id', tenantId) // SECURITY: Only user's tenant
      .like('invoice_number', `FAC-${year}${month}%`)
      .order('invoice_number', { ascending: false })
      .limit(1);

    let invoiceNumber;
    if (lastInvoice && lastInvoice.length > 0) {
      // Extract the last number and increment
      const lastNumber = lastInvoice[0].invoice_number.split('-')[2];
      const nextNumber = String(parseInt(lastNumber) + 1).padStart(4, '0');
      invoiceNumber = `FAC-${year}${month}-${nextNumber}`;
    } else {
      // First invoice of the month
      invoiceNumber = `FAC-${year}${month}-0001`;
    }

    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create the invoice
    const { data: newInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_type: 'invoice',
        invoice_number: invoiceNumber,
        status: 'draft',
        customer_name: originalQuote.customer_name,
        customer_email: originalQuote.customer_email,
        customer_phone: originalQuote.customer_phone,
        customer_company: originalQuote.customer_company,
        billing_address_line1: originalQuote.billing_address_line1,
        billing_address_line2: originalQuote.billing_address_line2,
        billing_city: originalQuote.billing_city,
        billing_state: originalQuote.billing_state,
        billing_postal_code: originalQuote.billing_postal_code,
        billing_country: originalQuote.billing_country,
        issue_date: now.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        quote_valid_until: null, // Invoices don't have expiry dates
        paid_date: null,
        currency: originalQuote.currency,
        subtotal: originalQuote.subtotal,
        tax_rate: originalQuote.tax_rate,
        tax_amount: originalQuote.tax_amount,
        discount_amount: originalQuote.discount_amount,
        discount_percentage: originalQuote.discount_percentage,
        total_amount: originalQuote.total_amount,
        notes: originalQuote.notes,
        internal_notes: `Converted from quote ${originalQuote.invoice_number} on ${now.toLocaleDateString('nl-NL')}`,
        payment_terms: originalQuote.payment_terms || '30 dagen netto',
        payment_method: originalQuote.payment_method,
        contact_id: originalQuote.contact_id,
        lead_id: originalQuote.lead_id,
        tenant_id: tenantId, // SECURITY: Use authenticated tenant
        created_by: user.id, // SECURITY: Use authenticated user
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      return NextResponse.json({ error: `Failed to create invoice: ${invoiceError.message}` }, { status: 500 });
    }

    console.log('Invoice created successfully:', invoiceNumber);

    // Copy invoice items
    if (originalQuote.invoice_items && originalQuote.invoice_items.length > 0) {
      const itemsToInsert = originalQuote.invoice_items.map((item: any) => ({
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
        console.error('Error copying invoice items:', itemsError);
        // Don't fail the whole operation, but log the error
      }
    }

    // Update the original quote status to 'converted' and link to new invoice
    // Try to update with 'converted' status, fallback to 'cancelled' if constraint fails
    let { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        status: 'converted',
        internal_notes: `${originalQuote.internal_notes ? originalQuote.internal_notes + '\n\n' : ''}Converted to invoice ${invoiceNumber} (ID: ${newInvoice.id}) on ${now.toLocaleDateString('nl-NL')}`,
        updated_at: now.toISOString()
      })
      .eq('id', resolvedParams.id);

    // If 'converted' status fails due to constraint, try 'accepted' as fallback
    if (updateError && updateError.message?.includes('check constraint')) {
      console.log('Converted status not allowed, trying accepted as fallback');
      updateError = (await supabase
        .from('invoices')
        .update({ 
          status: 'accepted',
          internal_notes: `${originalQuote.internal_notes ? originalQuote.internal_notes + '\n\n' : ''}QUOTE ACCEPTED - Converted to invoice ${invoiceNumber} (ID: ${newInvoice.id}) on ${now.toLocaleDateString('nl-NL')}`,
          updated_at: now.toISOString()
        })
        .eq('id', resolvedParams.id)).error;

      // If 'accepted' also fails, try 'paid' as final fallback
      if (updateError && updateError.message?.includes('check constraint')) {
        console.log('Accepted status not allowed either, using paid as final fallback');
        updateError = (await supabase
          .from('invoices')
          .update({ 
            status: 'paid',
            internal_notes: `${originalQuote.internal_notes ? originalQuote.internal_notes + '\n\n' : ''}QUOTE ACCEPTED - Converted to invoice ${invoiceNumber} (ID: ${newInvoice.id}) on ${now.toLocaleDateString('nl-NL')}`,
            updated_at: now.toISOString()
          })
          .eq('id', resolvedParams.id)).error;
      }
    }

    if (updateError) {
      console.error('Error updating quote status:', updateError);
      // Don't fail the operation, just log
    }

    // Also add reference to original quote in the new invoice
    await supabase
      .from('invoices')
      .update({
        internal_notes: `${newInvoice.internal_notes}\n\nOriginal quote: ${originalQuote.invoice_number} (ID: ${resolvedParams.id})`
      })
      .eq('id', newInvoice.id);

    console.log('Conversion completed successfully');
    
    return NextResponse.json({ 
      success: true, 
      invoice: newInvoice,
      message: `Quote ${originalQuote.invoice_number} successfully converted to invoice ${invoiceNumber}`,
      invoiceId: newInvoice.id,
      invoiceNumber: invoiceNumber
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}