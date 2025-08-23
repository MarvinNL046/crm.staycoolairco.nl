// Quote type definitions

export interface Quote {
  id: string;
  quote_number: string;
  title: string;
  description?: string | null;
  
  // Customer information
  customer_id?: string | null;
  contact_id?: string | null;
  lead_id?: string | null;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  customer_city?: string | null;
  customer_postal_code?: string | null;
  customer_country?: string | null;
  
  // Financial
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  
  // Dates and status
  issue_date: string;
  valid_until?: string | null;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted';
  
  // Conversion tracking
  converted_to_invoice: boolean;
  invoice_id?: string | null;
  converted_at?: string | null;
  
  // Terms
  terms_and_conditions?: string | null;
  payment_terms?: string | null;
  delivery_terms?: string | null;
  
  // Notes
  internal_notes?: string | null;
  customer_notes?: string | null;
  
  // Metadata
  tenant_id: string;
  created_by?: string | null;
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
  tags?: string[] | null;
  custom_fields?: Record<string, any> | null;
  
  // Relations
  items?: QuoteItem[];
  customer?: any;
  contact?: any;
  lead?: any;
  invoice?: any;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  
  // Product info
  product_id?: string | null;
  product_name: string;
  product_description?: string | null;
  
  // Pricing
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;
  
  // Additional
  unit: string;
  sort_order: number;
  notes?: string | null;
  
  // Metadata
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteFormData {
  title: string;
  description?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_city?: string;
  customer_postal_code?: string;
  customer_country?: string;
  issue_date: string;
  valid_until?: string;
  status: Quote['status'];
  payment_terms?: string;
  delivery_terms?: string;
  terms_and_conditions?: string;
  internal_notes?: string;
  customer_notes?: string;
  items: Omit<QuoteItem, 'id' | 'quote_id' | 'tenant_id' | 'created_at' | 'updated_at'>[];
}

export interface QuoteFilters {
  status?: Quote['status'];
  customer_name?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  min_amount?: number;
  max_amount?: number;
}