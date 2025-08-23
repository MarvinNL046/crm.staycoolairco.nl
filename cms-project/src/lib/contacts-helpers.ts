// Helper functions to map between database and application contact formats
// This handles the temporary mismatch between database columns and expected types

import { Contact } from '@/types/contacts';

// Map database contact to application contact format
export function mapDatabaseContactToContact(dbContact: any): Contact {
  return {
    id: dbContact.id,
    tenant_id: dbContact.tenant_id,
    name: dbContact.name,
    email: dbContact.email || undefined,
    phone: dbContact.phone || undefined,
    mobile: dbContact.mobile || undefined,
    company_id: dbContact.company_id || undefined,
    company_name: dbContact.company_name || undefined,
    job_title: dbContact.job_title || undefined,
    department: dbContact.department || undefined,
    status: dbContact.status || 'active',
    relationship_status: dbContact.relationship_status || 'prospect',
    temperature: dbContact.temperature || undefined,
    address_line1: dbContact.address_line1 || undefined,
    address_line2: dbContact.address_line2 || undefined,
    city: dbContact.city || undefined,
    state: dbContact.state || undefined,
    postal_code: dbContact.postal_code || undefined,
    country: dbContact.country || 'Nederland',
    preferred_contact_method: dbContact.preferred_contact_method || undefined,
    do_not_call: dbContact.do_not_call || false,
    do_not_email: dbContact.do_not_email || false,
    linkedin_url: dbContact.linkedin_url || undefined,
    twitter_handle: dbContact.twitter_handle || undefined,
    website: dbContact.website || undefined,
    source: dbContact.source || undefined,
    source_details: dbContact.source_details || undefined,
    lead_id: dbContact.lead_id || undefined,
    converted_from_lead_at: dbContact.converted_from_lead_at || undefined,
    tags: dbContact.tags || [],
    notes: dbContact.notes || undefined,
    created_at: dbContact.created_at,
    created_by: dbContact.created_by || undefined,
    updated_at: dbContact.updated_at || dbContact.created_at,
    updated_by: dbContact.updated_by || undefined,
    lead: dbContact.lead,
    appointments: dbContact.appointments || [],
    invoices: dbContact.invoices || [],
    deals: dbContact.deals || []
  };
}

// Prepare contact data for database insertion/update
export function prepareContactForDatabase(contactData: any) {
  const dbData: any = { ...contactData };
  
  // Remove any undefined values
  Object.keys(dbData).forEach(key => {
    if (dbData[key] === undefined) {
      delete dbData[key];
    }
  });
  
  return dbData;
}