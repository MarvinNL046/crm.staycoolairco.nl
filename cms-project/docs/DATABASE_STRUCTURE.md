# StayCool CRM Database Structure

This document provides a complete overview of the database structure for the StayCool CRM system.

## 🗄️ Database Overview

The database is set up locally using Supabase with the following details:

### Local Development URLs
- **API**: http://127.0.0.1:54331
- **Studio**: http://127.0.0.1:54333
- **Database**: postgresql://postgres:postgres@127.0.0.1:54332/postgres

### Production Tables (27 total)
Based on the production analysis, we have successfully migrated all 27 tables to the local environment.

## 📊 Core Tables

### 1. **tenants**
Multi-tenant support for different organizations.
- `id` (UUID, Primary Key)
- `name` (VARCHAR)
- `domain` (VARCHAR)
- `settings` (JSONB)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2. **leads**
Potential customers in the sales pipeline.
- `id` (UUID, Primary Key)
- `tenant_id` (UUID, Foreign Key)
- `name`, `email`, `phone`, `company` (VARCHAR)
- `status` (VARCHAR) - new, contacted, qualified, proposal, won, lost
- `value` (DECIMAL) - Lead value
- `retry_count` (INTEGER) - For "geen gehoor" tracking
- `archived` (BOOLEAN)
- Address fields: `street`, `house_number`, `postal_code`, `city`, `province`, `country`
- `tags` (JSONB)
- `notes` (TEXT)
- `converted_to_contact_id` (UUID)
- `search_fts` (TSVECTOR) - For full-text search

### 3. **contacts**
Confirmed contacts and customers.
- `id` (UUID, Primary Key)
- `tenant_id` (UUID, Foreign Key)
- Personal info: `name`, `email`, `phone`, `mobile`
- Company info: `company_name`, `company_id`, `position`, `job_title`, `department`
- Address fields (same as leads)
- Communication preferences: `do_not_call`, `do_not_email`, `preferred_contact_method`
- Social: `linkedin_url`, `twitter_handle`, `website`
- `converted_from_lead_id` (UUID) - Link to original lead

### 4. **customers**
Customer accounts with deal tracking.
- `id` (UUID, Primary Key)
- `tenant_id` (UUID, Foreign Key)
- `name`, `email`, `phone`, `company` (VARCHAR)
- `status` (VARCHAR)
- `total_deals` (INTEGER)
- `total_value` (DECIMAL)

### 5. **invoices**
Invoice and quote management.
- `id` (UUID, Primary Key)
- `tenant_id` (UUID, Foreign Key)
- `invoice_number` (VARCHAR, Unique per tenant)
- `invoice_type` (VARCHAR) - invoice or quote
- `status` (VARCHAR) - draft, sent, paid, cancelled
- Customer info: `customer_name`, `customer_email`, `customer_phone`, `customer_company`
- Billing address fields
- Financial: `subtotal`, `tax_rate`, `tax_amount`, `discount_percentage`, `discount_amount`, `total_amount`
- Dates: `issue_date`, `due_date`, `paid_date`, `quote_valid_until`
- `notes`, `internal_notes` (TEXT)

### 6. **invoice_items**
Line items for invoices.
- `id` (UUID, Primary Key)
- `invoice_id` (UUID, Foreign Key)
- `product_id` (UUID, Foreign Key, optional)
- `description` (TEXT)
- `quantity`, `unit_price`, `btw_percentage`, `btw_amount`, `total_amount` (DECIMAL)
- `sort_order` (INTEGER)

### 7. **appointments**
Calendar and appointment management.
- `id` (UUID, Primary Key)
- `tenant_id` (UUID, Foreign Key)
- `title`, `description`, `location` (VARCHAR/TEXT)
- `start_time`, `end_time` (TIMESTAMPTZ)
- `all_day` (BOOLEAN)
- Related entities: `lead_id`, `contact_id`, `customer_id`
- `type` (VARCHAR) - meeting, call, etc.
- `status` (VARCHAR) - scheduled, completed, cancelled
- Recurring appointment fields
- Reminder fields

## 🔧 Supporting Tables

### Communication & Marketing
- **campaigns** - Marketing campaign management
- **campaign_metrics** - Campaign performance tracking
- **email_templates** - Email template storage
- **email_logs** - Email sending history

### Workflow & Automation
- **workflows** - Workflow definitions
- **workflow_templates** - Pre-built workflow templates
- **workflow_steps** - Individual workflow steps
- **workflow_executions** - Workflow run history
- **automation_rules** - Automation trigger rules
- **automation_logs** - Automation execution logs

### Configuration
- **btw_percentages** - Tax rate configuration
- **products** - Product catalog
- **pipeline_stages** - Sales pipeline stages
- **tags** - Tag management
- **api_keys** - API key storage
- **webhook_logs** - Webhook activity logs

### Appointments
- **appointment_reminders** - Reminder tracking
- **recurring_appointments** - Recurring appointment patterns

### System
- **profiles** - User profile information
- **companies** - Company directory

## 🔍 Key Features

### 1. Multi-tenancy
All data is isolated by `tenant_id` with Row Level Security (RLS) policies.

### 2. Lead to Contact Conversion
Leads can be converted to contacts, maintaining the relationship through `converted_from_lead_id`.

### 3. Full-text Search
The `leads` table includes a `search_fts` column for efficient full-text searching.

### 4. Retry Tracking
The "geen gehoor" (no answer) workflow is supported with `retry_count` on leads.

### 5. Comprehensive Address Management
Both leads and contacts have full address fields supporting Dutch address formats.

### 6. Flexible Tagging
JSONB fields for tags allow flexible categorization.

### 7. Audit Trail
Most tables include `created_at` and `updated_at` timestamps with automatic triggers.

## 🚀 Local Development Setup

1. **Start Supabase**: `./supabase-cli start`
2. **Access Studio**: http://127.0.0.1:54333
3. **Default Tenant ID**: `80496bff-b559-4b80-9102-3a84afdaa616`

### Environment Variables
```env
# Local Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

## 📝 Migration Notes

- All tables from production have been successfully migrated
- Default BTW percentages (0%, 9%, 21%) are pre-populated
- RLS policies are enabled for security
- The schema includes all indexes for optimal performance

## 🔄 Next Steps

1. **Seed Data**: Add sample data for testing
2. **API Development**: Build API endpoints for each table
3. **Frontend Integration**: Update frontend to use local Supabase
4. **Testing**: Create comprehensive tests for all operations