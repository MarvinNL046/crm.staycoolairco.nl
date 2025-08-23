# Calendar Appointment Features Documentation
Wat moet je nog doen:

  1. Database migratie uitvoeren:
  psql -d jouw_database -f src/sql/add-recurring-appointments.sql
  2. Cron job instellen (elke 5 minuten):
  */5 * * * * /usr/bin/node /pad/naar/cms-project/scripts/process-appointment-reminders.js
  3. Test de features op http://localhost:3000/crm/calendar



## Overview

This document describes the new features added to the calendar appointment system:
1. **Recurring Appointments** - Create appointments that repeat on a schedule
2. **Email Reminders** - Send automatic email reminders before appointments
3. **Advanced Search & Filter** - Find appointments quickly with powerful search

## 1. Recurring Appointments

### How to Create a Recurring Appointment

1. Click the "Maken" button or click on a calendar date
2. Fill in the appointment details as usual
3. Toggle "Terugkerende afspraak" (Recurring appointment) to ON
4. Configure the recurrence pattern:
   - **Interval**: How often it repeats (e.g., every 2 weeks)
   - **Pattern**: Daily, Weekly, Monthly, or Yearly
   - **Specific days**: For weekly recurrence, select which days
   - **End date**: Choose when the recurrence ends or set a number of occurrences

### Recurrence Patterns

#### Daily
- Repeats every N days
- Example: "Every 3 days"

#### Weekly
- Repeats every N weeks on selected days
- Example: "Every week on Monday and Thursday"

#### Monthly
- Repeats every N months on a specific day
- Example: "Every month on the 15th"

#### Yearly
- Repeats every N years on a specific date
- Example: "Every year on January 1st"

### Managing Recurring Appointments

When editing a recurring appointment, you'll be asked to choose:
- **This occurrence only** - Changes only the selected instance
- **This and future occurrences** - Changes this and all future instances
- **All occurrences** - Changes all instances in the series

## 2. Email Reminders

### Setting Up Reminders

When creating or editing an appointment:
1. Check the reminder times you want:
   - 15 minutes before
   - 1 hour before
   - 1 day before
2. Optionally add additional email addresses for reminders
3. The system will automatically send reminders at the specified times

### Reminder Recipients

Reminders are sent to:
- The customer/contact/lead associated with the appointment (automatic)
- Any additional email addresses you specify

### Email Content

Reminder emails include:
- Appointment title and time
- Location (if specified)
- Description/details
- Contact information for rescheduling

### Processing Reminders

Reminders are processed automatically every 5 minutes by a background job. To set this up:

```bash
# Add to crontab
*/5 * * * * /usr/bin/node /path/to/cms-project/scripts/process-appointment-reminders.js
```

## 3. Search & Filter

### Quick Search

Use the search bar in the calendar header to:
- Search by appointment title
- Search by description
- Search by location
- Search by notes

### Advanced Filters

Click the filter icon next to search to:
- Filter by appointment type (Meeting, Call, Installation, etc.)
- Filter by status (Scheduled, Completed, Cancelled)
- Filter by time period (Today, This Week, This Month)

### Search Results

- Results appear in a dropdown below the search bar
- Click on any result to view/edit that appointment
- Clear search to return to normal calendar view

## Database Schema Changes

The following fields were added to support these features:

### Recurring Appointments
```sql
-- Recurrence pattern fields
recurrence_pattern TEXT -- 'daily', 'weekly', 'monthly', 'yearly'
recurrence_interval INTEGER -- e.g., every 2 weeks
recurrence_days_of_week INTEGER[] -- for weekly: 0=Sunday, 1=Monday
recurrence_day_of_month INTEGER -- for monthly: 1-31
recurrence_month_of_year INTEGER -- for yearly: 1-12
recurrence_end_date DATE -- when recurrence ends
recurrence_count INTEGER -- max occurrences
recurrence_id UUID -- links appointments in a series
is_recurring BOOLEAN -- flag for recurring appointments
recurrence_exception_dates DATE[] -- cancelled occurrences
edit_scope TEXT -- 'this', 'this_and_future', 'all'
original_start_time TIMESTAMP -- original time before edits
```

### Email Reminders
```sql
reminder_sent BOOLEAN -- tracks if reminder was sent
reminder_sent_at TIMESTAMP -- when reminder was sent
reminder_emails TEXT[] -- additional email addresses
```

## API Endpoints

### Send Test Reminder
```bash
POST /api/appointments/reminders/test
{
  "appointmentId": "appointment-uuid",
  "email": "test@example.com" // optional, uses appointment contact if not provided
}
```

### Process Reminders (Called by cron job)
```bash
GET /api/appointments/reminders
```

## Configuration

### Environment Variables
- `RESEND_API_KEY` - Your Resend API key for sending emails
- `APPOINTMENT_REMINDER_API_KEY` - Optional API key for reminder endpoint
- `ALERT_WEBHOOK` - Optional webhook for reminder processing alerts

## Troubleshooting

### Reminders Not Sending
1. Check that the cron job is running
2. Verify RESEND_API_KEY is set correctly
3. Check appointment has reminder_minutes set
4. Ensure appointment status is 'scheduled'

### Search Not Working
1. Ensure appointments are loaded
2. Check browser console for errors
3. Verify search component is properly integrated

### Recurring Appointments Issues
1. Check database migration was run
2. Verify recurrence fields are properly set
3. Check for date/time zone issues