export interface Appointment {
  id: string;
  tenant_id: string;
  created_by: string;
  
  // Basic appointment info
  title: string;
  description?: string;
  location?: string;
  
  // Time info
  start_time: string;
  end_time: string;
  all_day?: boolean;
  
  // Relations
  lead_id?: string;
  contact_id?: string;
  customer_id?: string;
  
  // Appointment type and status
  type: 'meeting' | 'call' | 'visit' | 'installation' | 'service' | 'other';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  
  // Display
  color?: string;
  
  // Reminders
  reminder_minutes?: number[];
  reminder_sent?: boolean;
  reminder_sent_at?: string;
  reminder_emails?: string[];
  
  // Notes and outcomes
  notes?: string;
  outcome?: string;
  
  // Recurrence fields
  is_recurring?: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  recurrence_interval?: number;
  recurrence_days_of_week?: number[];
  recurrence_day_of_month?: number;
  recurrence_month_of_year?: number;
  recurrence_end_date?: string;
  recurrence_count?: number;
  recurrence_id?: string;
  recurrence_exception_dates?: string[];
  edit_scope?: 'this' | 'this_and_future' | 'all';
  original_start_time?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface RecurrenceSettings {
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  monthOfYear?: number;
  endDate?: Date;
  count?: number;
  endType?: 'never' | 'date' | 'count';
}

export interface AppointmentFormData {
  title: string;
  description: string;
  location: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: string;
  leadId: string;
  contactId?: string;
  customerId?: string;
  notes: string;
  reminderMinutes: number[];
  reminderEmails: string[];
  recurrence: RecurrenceSettings | null;
}