import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/invoices/[id] - Get single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items(*)
      `)
      .eq('id', resolvedParams.id)
      .single();

    if (error) {
      console.error('Error fetching invoice:', error);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Transform data
    const transformedInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      type: invoice.invoice_type,
      status: invoice.status,
      customerName: invoice.customer_name,
      customerEmail: invoice.customer_email,
      customerPhone: invoice.customer_phone,
      customerCompany: invoice.customer_company,
      billingAddressLine1: invoice.billing_address_line1,
      billingAddressLine2: invoice.billing_address_line2,
      billingCity: invoice.billing_city,
      billingState: invoice.billing_state,
      billingPostalCode: invoice.billing_postal_code,
      billingCountry: invoice.billing_country,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      quoteValidUntil: invoice.quote_valid_until,
      paidDate: invoice.paid_date,
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      taxRate: invoice.tax_rate,
      taxAmount: invoice.tax_amount,
      discountAmount: invoice.discount_amount,
      discountPercentage: invoice.discount_percentage,
      totalAmount: invoice.total_amount,
      notes: invoice.notes,
      internalNotes: invoice.internal_notes,
      paymentTerms: invoice.payment_terms,
      paymentMethod: invoice.payment_method,
      contactId: invoice.contact_id,
      leadId: invoice.lead_id,
      tenantId: invoice.tenant_id,
      items: invoice.invoice_items?.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        subtotal: item.subtotal,
        taxRate: item.tax_rate,
        taxAmount: item.tax_amount,
        discountAmount: item.discount_amount,
        discountPercentage: item.discount_percentage,
        total: item.total,
        position: item.position,
        productId: item.product_id
      })) || []
    };

    return NextResponse.json(transformedInvoice);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { items, ...invoiceData } = body;

    // Update invoice
    const { data: updatedInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .update({
        invoice_type: invoiceData.type,
        status: invoiceData.status,
        customer_name: invoiceData.customerName,
        customer_email: invoiceData.customerEmail,
        customer_phone: invoiceData.customerPhone,
        customer_company: invoiceData.customerCompany,
        billing_address_line1: invoiceData.billingAddressLine1,
        billing_address_line2: invoiceData.billingAddressLine2,
        billing_city: invoiceData.billingCity,
        billing_state: invoiceData.billingState,
        billing_postal_code: invoiceData.billingPostalCode,
        billing_country: invoiceData.billingCountry,
        issue_date: invoiceData.issueDate,
        due_date: invoiceData.dueDate,
        quote_valid_until: invoiceData.quoteValidUntil,
        paid_date: invoiceData.paidDate,
        currency: invoiceData.currency,
        subtotal: invoiceData.subtotal,
        tax_rate: invoiceData.taxRate,
        tax_amount: invoiceData.taxAmount,
        discount_amount: invoiceData.discountAmount,
        discount_percentage: invoiceData.discountPercentage,
        total_amount: invoiceData.totalAmount,
        notes: invoiceData.notes,
        internal_notes: invoiceData.internalNotes,
        payment_terms: invoiceData.paymentTerms,
        payment_method: invoiceData.paymentMethod,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (invoiceError) {
      console.error('Error updating invoice:', invoiceError);
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
    }

    // Delete existing items and recreate them
    if (items && items.length > 0) {
      // Delete existing items
      await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', resolvedParams.id);

      // Insert new items
      const itemsToInsert = items.map((item: any, index: number) => ({
        invoice_id: resolvedParams.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
        tax_rate: item.taxRate || 21,
        tax_amount: item.taxAmount,
        discount_amount: item.discountAmount || 0,
        discount_percentage: item.discountPercentage || 0,
        total: item.total,
        position: index + 1,
        product_id: item.productId
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error updating invoice items:', itemsError);
        return NextResponse.json({ error: 'Failed to update invoice items' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      invoice: updatedInvoice,
      message: 'Invoice updated successfully' 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/invoices/[id] - Delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // First delete all invoice items (due to foreign key constraint)
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', resolvedParams.id);

    if (itemsError) {
      console.error('Error deleting invoice items:', itemsError);
      return NextResponse.json({ error: 'Failed to delete invoice items' }, { status: 500 });
    }

    // Then delete the invoice
    const { error: invoiceError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', resolvedParams.id);

    if (invoiceError) {
      console.error('Error deleting invoice:', invoiceError);
      return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Invoice deleted successfully' 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}