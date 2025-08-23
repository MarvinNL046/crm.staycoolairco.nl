import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/invoices/[id]/pdf - Generate PDF for invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // Get the invoice with items
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

    // Read HTML template
    const templatePath = path.join(process.cwd(), 'src', 'templates', 'invoice-pdf.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Format data for template
    const templateData = {
      type: invoice.invoice_type,
      typeLabel: invoice.invoice_type === 'quote' ? 'Offerte' : 'Factuur',
      invoiceNumber: invoice.invoice_number,
      issueDate: formatDate(invoice.issue_date),
      dueDate: invoice.due_date ? formatDate(invoice.due_date) : null,
      quoteValidUntil: invoice.quote_valid_until ? formatDate(invoice.quote_valid_until) : null,
      status: invoice.status,
      statusLabel: getStatusLabel(invoice.status),
      customerName: invoice.customer_name,
      customerCompany: invoice.customer_company,
      customerEmail: invoice.customer_email,
      customerPhone: invoice.customer_phone,
      billingAddressLine1: invoice.billing_address_line1,
      billingAddressLine2: invoice.billing_address_line2,
      billingCity: invoice.billing_city,
      billingPostalCode: invoice.billing_postal_code,
      billingCountry: invoice.billing_country || 'Nederland',
      subtotal: formatCurrency(invoice.subtotal),
      taxRate: invoice.tax_rate || 21,
      taxAmount: formatCurrency(invoice.tax_amount),
      discountAmount: invoice.discount_amount ? formatCurrency(invoice.discount_amount) : null,
      totalAmount: formatCurrency(invoice.total_amount),
      notes: invoice.notes,
      paymentTerms: invoice.payment_terms || '30 dagen netto',
      items: invoice.invoice_items?.map((item: any) => ({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: formatCurrency(item.unit_price),
        taxRate: item.tax_rate || 21,
        total: formatCurrency(item.total)
      })) || []
    };

    // Simple template replacement (no handlebars dependency)
    htmlTemplate = replaceTemplateVariables(htmlTemplate, templateData);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set content and generate PDF
    await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      },
      printBackground: true
    });

    await browser.close();

    // Return PDF
    const filename = `${invoice.invoice_type}_${invoice.invoice_number}.pdf`;
    
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdf.length.toString()
      }
    });

  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

// Helper functions
function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('nl-NL').format(new Date(dateString));
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function getStatusLabel(status: string): string {
  const labels = {
    draft: 'Concept',
    sent: 'Verzonden', 
    viewed: 'Bekeken',
    paid: 'Betaald',
    overdue: 'Vervallen',
    cancelled: 'Geannuleerd'
  };
  return labels[status as keyof typeof labels] || status;
}

function replaceTemplateVariables(template: string, data: any): string {
  let result = template;

  // Replace simple variables {{variable}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : '';
  });

  // Replace conditional blocks {{#if variable}}...{{/if}}
  result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
    return data[key] ? content : '';
  });

  // Replace each blocks {{#each items}}...{{/each}}
  result = result.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, key, itemTemplate) => {
    const items = data[key];
    if (!Array.isArray(items)) return '';
    
    return items.map((item: any) => {
      let itemHtml = itemTemplate;
      // Replace item properties
      itemHtml = itemHtml.replace(/\{\{(\w+)\}\}/g, (match: string, prop: string) => {
        return item[prop] !== undefined ? item[prop] : '';
      });
      return itemHtml;
    }).join('');
  });

  return result;
}