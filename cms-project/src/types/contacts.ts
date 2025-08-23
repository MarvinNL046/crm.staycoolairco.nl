export interface Contact {
  id: string;
  tenant_id: string;
  
  // Basic Information
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  
  // Company Association
  company_id?: string;
  company_name?: string;
  job_title?: string;
  department?: string;
  
  // Contact Status
  status: 'active' | 'inactive' | 'archived';
  relationship_status: 'prospect' | 'lead' | 'customer' | 'partner' | 'vendor' | 'other';
  temperature?: 'hot' | 'warm' | 'cold';
  
  // Address Information
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  
  // Communication Preferences
  preferred_contact_method?: 'email' | 'phone' | 'sms' | 'whatsapp';
  do_not_call?: boolean;
  do_not_email?: boolean;
  
  // Social Media
  linkedin_url?: string;
  twitter_handle?: string;
  website?: string;
  
  // Lead Source & Conversion
  source?: string;
  source_details?: string;
  lead_id?: string;
  converted_from_lead_at?: string;
  
  // Tags & Categories
  tags?: string[];
  
  // Notes
  notes?: string;
  
  // Metadata
  created_at: string;
  created_by?: string;
  updated_at: string;
  updated_by?: string;
  
  // Relations (populated on fetch)
  lead?: any;
  appointments?: any[];
  invoices?: any[];
  deals?: any[];
}

export interface CreateContactDTO {
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company_name?: string;
  job_title?: string;
  relationship_status?: Contact['relationship_status'];
  temperature?: Contact['temperature'];
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  preferred_contact_method?: Contact['preferred_contact_method'];
  notes?: string;
  tags?: string[];
  lead_id?: string;
}

export interface UpdateContactDTO extends Partial<CreateContactDTO> {
  status?: Contact['status'];
  do_not_call?: boolean;
  do_not_email?: boolean;
}

export interface ContactFilters {
  status?: Contact['status'];
  relationship_status?: Contact['relationship_status'];
  temperature?: Contact['temperature'];
  search?: string;
  tags?: string[];
  company_id?: string;
}