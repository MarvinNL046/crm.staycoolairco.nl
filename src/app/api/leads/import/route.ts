import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'

interface CSVRow {
  [key: string]: string
}

interface ImportResult {
  success: number
  failed: number
  errors: string[]
  duplicates: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tenant
    const { data: userTenants } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()

    if (!userTenants) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 })
    }

    // Read and parse CSV
    const csvText = await file.text()
    let rows: CSVRow[]
    
    try {
      rows = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        encoding: 'utf8'
      })
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Invalid CSV format', 
        details: (parseError as Error).message 
      }, { status: 400 })
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 })
    }

    if (rows.length > 1000) {
      return NextResponse.json({ 
        error: 'Too many rows. Maximum 1000 leads per import.' 
      }, { status: 400 })
    }

    // Process leads
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      duplicates: 0
    }

    // Get existing emails to check for duplicates
    const existingEmails = new Set()
    if (rows.some(row => extractEmail(row))) {
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('email')
        .eq('tenant_id', userTenants.tenant_id)
        .not('email', 'is', null)
      
      existingLeads?.forEach(lead => {
        if (lead.email) existingEmails.add(lead.email.toLowerCase())
      })
    }

    const leadsToInsert = []
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2 // +2 because CSV rows start at 2 (after header)
      
      try {
        const leadData = {
          tenant_id: userTenants.tenant_id,
          name: extractName(row),
          email: extractEmail(row),
          phone: extractPhone(row),
          company: extractCompany(row),
          source: row.source || row.bron || 'csv-import',
          status: (row.status || row.staat || 'new') as 'new' | 'contacted' | 'qualified' | 'converted' | 'lost',
          notes: extractNotes(row),
          tags: extractTags(row),
        }

        // Validate required fields
        if (!leadData.name || leadData.name === 'Onbekend') {
          result.errors.push(`Rij ${rowNumber}: Naam is verplicht`)
          result.failed++
          continue
        }

        // Check for duplicate email
        if (leadData.email && existingEmails.has(leadData.email.toLowerCase())) {
          result.errors.push(`Rij ${rowNumber}: Email ${leadData.email} bestaat al`)
          result.duplicates++
          continue
        }

        // Validate status
        const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'lost']
        if (!validStatuses.includes(leadData.status)) {
          leadData.status = 'new'
        }

        leadsToInsert.push(leadData)
        
        // Add email to set to check for duplicates within this import
        if (leadData.email) {
          existingEmails.add(leadData.email.toLowerCase())
        }

      } catch (error) {
        result.errors.push(`Rij ${rowNumber}: ${(error as Error).message}`)
        result.failed++
      }
    }

    // Insert leads in batches
    if (leadsToInsert.length > 0) {
      const batchSize = 100
      for (let i = 0; i < leadsToInsert.length; i += batchSize) {
        const batch = leadsToInsert.slice(i, i + batchSize)
        
        const { data, error } = await supabase
          .from('leads')
          .insert(batch)
          .select('*')

        if (error) {
          result.errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${error.message}`)
          result.failed += batch.length
        } else {
          result.success += data.length
          
          // Trigger automation for each new lead
          for (const lead of data) {
            fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/automations/trigger`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                trigger: 'lead_created',
                tenant_id: lead.tenant_id,
                lead_id: lead.id,
                new_data: lead,
                metadata: {
                  source: 'csv_import',
                  user_id: user.id,
                  batch_number: Math.floor(i/batchSize) + 1
                }
              }),
            }).catch(err => console.error('Failed to trigger automation:', err))
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      result,
      summary: `${result.success} leads geïmporteerd, ${result.failed} gefaald, ${result.duplicates} duplicaten`
    })

  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// Helper functions for extracting data from CSV rows
function extractName(row: CSVRow): string {
  // Check verschillende Nederlandse en Engelse veldnamen
  const nameFields = [
    'naam', 'name', 'volledige_naam', 'full_name', 'fullname',
    'voornaam_achternaam', 'first_last_name'
  ]
  
  for (const field of nameFields) {
    if (row[field]) return row[field].trim()
  }
  
  // Combineer voornaam + achternaam
  const firstName = row.voornaam || row.first_name || row.firstname || ''
  const lastName = row.achternaam || row.last_name || row.lastname || ''
  const fullName = `${firstName} ${lastName}`.trim()
  
  return fullName || row.contact_naam || row.contact_name || 'Onbekend'
}

function extractEmail(row: CSVRow): string | null {
  const emailFields = [
    'email', 'e_mail', 'e-mail', 'email_adres', 'email_address',
    'emailadres', 'emailAddress', 'contact_email', 'contactemail'
  ]
  
  for (const field of emailFields) {
    if (row[field]) {
      const email = row[field].trim().toLowerCase()
      // Basic email validation
      if (email.includes('@') && email.includes('.')) {
        return email
      }
    }
  }
  
  return null
}

function extractPhone(row: CSVRow): string | null {
  const phoneFields = [
    'telefoon', 'phone', 'telephone', 'telefoon_nummer', 'phone_number',
    'phoneNumber', 'mobiel', 'mobile', 'gsm', 'contact_telefoon', 'contact_phone'
  ]
  
  for (const field of phoneFields) {
    if (row[field]) return row[field].trim()
  }
  
  return null
}

function extractCompany(row: CSVRow): string | null {
  const companyFields = [
    'bedrijf', 'company', 'bedrijfsnaam', 'company_name', 'companyName',
    'organisatie', 'organization', 'firma', 'business', 'businessName'
  ]
  
  for (const field of companyFields) {
    if (row[field]) return row[field].trim()
  }
  
  return null
}

function extractNotes(row: CSVRow): string | null {
  const noteFields = [
    'notities', 'notes', 'opmerkingen', 'comments', 'bericht', 'message',
    'beschrijving', 'description', 'details', 'info', 'informatie'
  ]
  
  const notes: string[] = []
  
  for (const field of noteFields) {
    if (row[field]) {
      notes.push(`${field}: ${row[field].trim()}`)
    }
  }
  
  return notes.length > 0 ? notes.join('\n\n') : null
}

function extractTags(row: CSVRow): string[] {
  const tagFields = ['tags', 'labels', 'categories', 'categorieën', 'labels']
  const tags: string[] = []
  
  for (const field of tagFields) {
    if (row[field]) {
      const fieldTags = row[field].split(',').map((t: string) => t.trim()).filter(Boolean)
      tags.push(...fieldTags)
    }
  }
  
  // Voeg bron toe als tag
  if (row.bron || row.source) {
    tags.push(`bron:${row.bron || row.source}`)
  }
  
  return [...new Set(tags)] // Remove duplicates
}