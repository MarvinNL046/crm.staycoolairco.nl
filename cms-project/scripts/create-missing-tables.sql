-- Create missing tables for StayCool CRM
-- Run this in Supabase SQL Editor

-- Create User roles enum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SALES_MANAGER', 'SALES_REP', 'SUPPORT');

-- Create Company size enum  
CREATE TYPE "CompanySize" AS ENUM ('STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE');

-- Create Users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT UNIQUE NOT NULL,
    "name" TEXT,
    "role" "UserRole" DEFAULT 'SALES_REP',
    "phone" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Create Companies table
CREATE TABLE IF NOT EXISTS "companies" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "size" "CompanySize",
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT DEFAULT 'Netherlands',
    "vatNumber" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints for existing tables that reference users and companies

-- Add user references to leads table (if column doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='assignedToId') THEN
        ALTER TABLE "leads" ADD COLUMN "assignedToId" TEXT;
        ALTER TABLE "leads" ADD COLUMN "createdById" TEXT;
        
        -- Add foreign key constraints
        ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedToId_fkey" 
            FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        ALTER TABLE "leads" ADD CONSTRAINT "leads_createdById_fkey" 
            FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Add company reference to contacts table (if column doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='companyId') THEN
        ALTER TABLE "contacts" ADD COLUMN "companyId" TEXT;
        ALTER TABLE "contacts" ADD COLUMN "createdById" TEXT;
        
        -- Add foreign key constraints
        ALTER TABLE "contacts" ADD CONSTRAINT "contacts_companyId_fkey" 
            FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        ALTER TABLE "contacts" ADD CONSTRAINT "contacts_createdById_fkey" 
            FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Add user and company references to deals table (if columns don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='assignedToId') THEN
        ALTER TABLE "deals" ADD COLUMN "assignedToId" TEXT;
        ALTER TABLE "deals" ADD COLUMN "createdById" TEXT;
        ALTER TABLE "deals" ADD COLUMN "companyId" TEXT;
        
        -- Add foreign key constraints
        ALTER TABLE "deals" ADD CONSTRAINT "deals_assignedToId_fkey" 
            FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        ALTER TABLE "deals" ADD CONSTRAINT "deals_createdById_fkey" 
            FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        ALTER TABLE "deals" ADD CONSTRAINT "deals_companyId_fkey" 
            FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Add user and company references to invoices table (if columns don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='createdById') THEN
        ALTER TABLE "invoices" ADD COLUMN "createdById" TEXT;
        ALTER TABLE "invoices" ADD COLUMN "companyId" TEXT;
        
        -- Add foreign key constraints
        ALTER TABLE "invoices" ADD CONSTRAINT "invoices_createdById_fkey" 
            FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        ALTER TABLE "invoices" ADD CONSTRAINT "invoices_companyId_fkey" 
            FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Add user references to activities table (if column doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='userId') THEN
        ALTER TABLE "activities" ADD COLUMN "userId" TEXT;
        
        -- Add foreign key constraint
        ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "companies_name_idx" ON "companies"("name");
CREATE INDEX IF NOT EXISTS "leads_assignedToId_idx" ON "leads"("assignedToId");
CREATE INDEX IF NOT EXISTS "contacts_companyId_idx" ON "contacts"("companyId");
CREATE INDEX IF NOT EXISTS "deals_assignedToId_idx" ON "deals"("assignedToId");
CREATE INDEX IF NOT EXISTS "invoices_createdById_idx" ON "invoices"("createdById");

-- Insert a default admin user for testing
INSERT INTO "users" ("id", "email", "name", "role") 
VALUES ('admin_001', 'admin@staycoolairco.nl', 'StayCool Admin', 'ADMIN')
ON CONFLICT ("email") DO NOTHING;

-- Insert a default company for testing
INSERT INTO "companies" ("id", "name", "industry", "size", "city", "country") 
VALUES ('company_001', 'StayCool Air Conditioning', 'HVAC Services', 'MEDIUM', 'Amsterdam', 'Netherlands')
ON CONFLICT ("id") DO NOTHING;

NOTIFY 'Database setup completed for StayCool CRM';