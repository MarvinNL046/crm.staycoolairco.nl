# Project Structure

This document describes the organized structure of the CRM project after cleanup.

## Directory Structure

```
cms-project/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/             # Utility libraries
│   ├── types/           # TypeScript type definitions
│   ├── templates/       # Email templates
│   └── sql/             # SQL files (organized)
│       ├── tables/      # Table creation scripts
│       ├── migrations/  # Database migrations
│       └── seeds/       # Sample data
│
├── scripts/             # Utility scripts
│   ├── setup/          # Setup and initialization scripts
│   ├── utils/          # Utility and check scripts
│   └── process-appointment-reminders.js  # Runtime cron script
│
├── migrations/          # Database migration files
│
├── docs/               # Documentation
│   ├── project/        # Project-specific docs
│   └── *.md           # Feature documentation
│
├── public/             # Static assets
├── node_modules/       # Dependencies
└── [config files]      # package.json, tsconfig.json, etc.
```

## Key Locations

### Setup Scripts (`scripts/setup/`)
- `build-appointment-system.js` - Appointment system setup
- `build-invoice-system.js` - Invoice system setup
- `create-tables.js` - Database table creation
- `create-basic-data.js` - Initial data setup
- `complete-setup.js` - Complete setup script
- `add-default-data.js` - Default data insertion
- `setup-database.js` - Database initialization

### Utility Scripts (`scripts/utils/`)
- `check-missing-tables.js` - Verify database tables
- `check-table-schemas.js` - Validate table schemas
- `get-all-tables.js` - List all database tables
- `get-data.js` - Retrieve data utilities
- `get-pipeline-stages.js` - Pipeline stage utilities
- `final-status.js` - Status checking
- `fix-templates.js` - Template fixing utilities
- `check-database-tables.js` - Database validation

### SQL Organization (`src/sql/`)
- **tables/** - Table creation scripts
  - `create-appointments-*.sql`
  - `create-leads-table.sql`
  
- **migrations/** - Database migrations
  - `add-recurring-appointments.sql`
  - `add-appointments-foreign-keys.sql`
  - `add-retry-count-to-leads.sql`
  - `fix-lead-status-enum.sql`
  - `check-lead-status-enum.sql`
  
- **seeds/** - Sample data
  - `insert-sample-appointments.sql`
  - `insert-sample-leads.sql`

### Runtime Scripts
- `scripts/process-appointment-reminders.js` - Cron job for email reminders

### Documentation (`docs/`)
- `APPOINTMENT_FEATURES.md` - Calendar features documentation
- `project/DEPLOYMENT.md` - Deployment instructions
- `project/README-CMS.md` - CMS documentation

## Database Migrations (`migrations/`)
- `add-converted-status.sql`
- `create-missing-tables.sql`
- `data.sql`
- `manual-sql-dashboard.sql`

## Running Scripts

### Initial Setup
```bash
# Run database setup
node scripts/setup/setup-database.js

# Create tables
node scripts/setup/create-tables.js

# Add default data
node scripts/setup/add-default-data.js
```

### Utilities
```bash
# Check database status
node scripts/utils/check-database-tables.js

# Verify schemas
node scripts/utils/check-table-schemas.js
```

### Cron Jobs
```bash
# Add to crontab for appointment reminders
*/5 * * * * /usr/bin/node /path/to/scripts/process-appointment-reminders.js
```