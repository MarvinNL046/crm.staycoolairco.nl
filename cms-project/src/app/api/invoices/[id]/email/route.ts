import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// POST /api/invoices/[id]/email - Send invoice via email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { to, subject, message } = body;

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

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice);

    // Setup Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Email content
    const filename = `${invoice.invoice_type}_${invoice.invoice_number}.pdf`;
    const typeLabel = invoice.invoice_type === 'quote' ? 'offerte' : 'factuur';
    
    const defaultSubject = `${invoice.invoice_type === 'quote' ? 'Offerte' : 'Factuur'} ${invoice.invoice_number} - StayCool Airconditioning`;
    const defaultMessage = `
Beste ${invoice.customer_name},

Hierbij ontvangt u de ${typeLabel} ${invoice.invoice_number} van StayCool Airconditioning.

${invoice.invoice_type === 'quote' 
  ? `Deze offerte is geldig tot ${formatDate(invoice.quote_valid_until || invoice.issue_date)}.`
  : `De betalingstermijn voor deze factuur is ${invoice.payment_terms || '30 dagen netto'}.`
}

Heeft u vragen over deze ${typeLabel}? Neem dan gerust contact met ons op.

Met vriendelijke groet,

StayCool Airconditioning
Tel: +31 20 123 4567
Email: info@staycoolairco.nl
Web: www.staycoolairco.nl
    `.trim();

    // Send email with Resend
    const emailResult = await resend.emails.send({
      from: 'StayCool Airconditioning <noreply@staycoolairco.nl>',
      to: [to || invoice.customer_email],
      subject: subject || defaultSubject,
      text: message || defaultMessage,
      html: (message || defaultMessage).replace(/\n/g, '<br>'),
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    // Update invoice status to 'sent' if it was 'draft'
    if (invoice.status === 'draft') {
      await supabase
        .from('invoices')
        .update({ 
          status: 'sent',
          updated_at: new Date().toISOString()
        })
        .eq('id', resolvedParams.id);
    }

    return NextResponse.json({ 
      success: true, 
      message: `${invoice.invoice_type === 'quote' ? 'Offerte' : 'Factuur'} succesvol verzonden naar ${to || invoice.customer_email}` 
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({ 
      error: 'Failed to send email', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Generate PDF function (shared with PDF route)
async function generateInvoicePDF(invoice: any): Promise<Buffer> {
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

  // Simple template replacement
  htmlTemplate = replaceTemplateVariables(htmlTemplate, templateData);

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
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
  
  return pdf;
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
    
    return items.map(item => {
      let itemHtml = itemTemplate;
      itemHtml = itemHtml.replace(/\{\{(\w+)\}\}/g, (match, prop) => {
        return item[prop] !== undefined ? item[prop] : '';
      });
      return itemHtml;
    }).join('');
  });

  return result;
}