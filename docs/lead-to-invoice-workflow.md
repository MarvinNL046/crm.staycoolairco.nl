# Lead-to-Invoice Workflow Documentation

## Overview

The CRM now includes an intelligent lead-to-invoice workflow that minimizes manual data entry and ensures data consistency across the system.

## Key Features

### 1. Unified Customer View
- **Single source of truth**: The `customers` table provides a unified view of all leads and contacts
- **Automatic synchronization**: Updates to leads or contacts are automatically reflected in the unified view
- **Preserved relationships**: Maintains links between leads, contacts, and their invoices

### 2. Smart Customer Selection in Invoice Creation
- **Intelligent search**: Search across both leads and contacts simultaneously
- **Visual distinction**: Clear badges show whether a customer is a lead or contact
- **Address preview**: See customer address information directly in search results

### 3. Automatic Lead-to-Contact Conversion
When creating an invoice from a lead:
- **Conversion prompt**: System asks if you want to convert the lead to a contact
- **Address collection**: If address data is missing, a form appears to collect it
- **One-click conversion**: Convert leads to contacts without losing any data
- **Reference updates**: All related records (deals, activities, tasks) are automatically updated

### 4. Address Field Support
New address fields throughout the system:
- **Leads**: street, house_number, postal_code, city, province, country
- **Contacts**: Same fields plus position and department
- **Webhook support**: GoHighLevel webhook now accepts and stores address data

## Workflow Steps

### Creating an Invoice from a Lead

1. **Start Invoice Creation**
   - Go to Invoicing → New Invoice/Quote
   - Click on the customer selector

2. **Search and Select**
   - Type customer name, email, or company
   - Leads show with "Lead" badge, contacts with "Contact" badge
   - Address information is displayed if available

3. **Lead Conversion (if applicable)**
   - If you select a lead, system prompts for conversion
   - Options:
     - **Convert to Contact**: Recommended for better data management
     - **Use Lead Directly**: Skip conversion and use lead as-is

4. **Address Collection (if needed)**
   - If address is incomplete, a form appears
   - Fill in missing fields: street, number, postal code, city, etc.
   - Optional fields: position, department (for contacts)

5. **Complete Invoice**
   - Customer data auto-fills in invoice
   - Add invoice items and complete as normal

## Database Schema

### New Tables

#### `customers` - Unified Customer View
```sql
- id: Unique identifier
- lead_id: Reference to lead (if applicable)
- contact_id: Reference to contact (if applicable)
- primary_type: 'lead' or 'contact'
- All customer fields (name, email, phone, address, etc.)
```

### Updated Tables

#### `leads` - Added Fields
- Address fields: street, house_number, postal_code, city, province, country
- Conversion tracking: converted_to_contact_id, converted_at
- Archive support: archived, archived_at
- New status: 'converted'

#### `contacts` - Added Fields
- Address fields: Same as leads
- Professional fields: position, department
- Conversion tracking: converted_from_lead_id, converted_at

## API Endpoints

### Lead Conversion
`POST /api/leads/{id}/convert-to-contact`

Request body:
```json
{
  "street": "Hoofdstraat",
  "house_number": "123",
  "postal_code": "1234 AB",
  "city": "Amsterdam",
  "province": "Noord-Holland",
  "country": "Nederland",
  "position": "Manager",
  "department": "Sales",
  "archive_lead": false,
  "update_references": true
}
```

### Customer Search (Updated)
`GET /api/invoices/search-customers?q={searchTerm}`

Now returns unified results with address information and type indicators.

## Benefits

1. **Reduced Data Entry**: No need to retype customer information
2. **Data Consistency**: Single source of truth for customer data
3. **Flexible Workflow**: Convert leads when ready, not forced
4. **Complete Information**: Collect addresses at the right moment
5. **Historical Accuracy**: Invoice data is denormalized for accuracy
6. **Seamless Integration**: Works with existing webhook and systems

## Migration Instructions

To apply the database changes:

1. **Option 1: Run the migration script**
   ```bash
   node scripts/invoicing/run-lead-contact-improvements.js
   ```

2. **Option 2: Apply SQL manually**
   - Go to Supabase dashboard → SQL Editor
   - Copy contents of `src/sql/lead-contact-improvements.sql`
   - Execute the SQL

3. **Verify the migration**
   - Check that `customers` table exists
   - Verify address fields in `leads` and `contacts` tables
   - Test the lead conversion endpoint

## Troubleshooting

### "Contact already exists with this email"
- This means a contact with the same email already exists
- Use the existing contact instead of converting the lead

### Address fields not showing
- Ensure the database migration has been run
- Check that the webhook is sending address data
- Verify the field mappings in the webhook handler

### Conversion fails
- Check browser console for errors
- Ensure user has proper permissions
- Verify all required fields are provided