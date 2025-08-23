#!/usr/bin/env node

/**
 * Bulk Security Fix for API Routes
 * 
 * This script adds authentication to all unprotected API routes
 * that currently use Service Role Key without user authentication
 */

const fs = require('fs');
const path = require('path');

// List of API routes that need authentication
const API_ROUTES = [
  'src/app/api/contacts/route.ts',
  'src/app/api/campaigns/route.ts', 
  'src/app/api/customers/route.ts',
  'src/app/api/expenses/route.ts',
  'src/app/api/invoices/route.ts',
  'src/app/api/analytics/overview/route.ts',
  'src/app/api/analytics/trends/route.ts',
  'src/app/api/revenue/overview/route.ts',
  'src/app/api/revenue/monthly/route.ts',
  'src/app/api/revenue/profit/route.ts',
  'src/app/api/sidebar/stats/route.ts'
];

// Template for secure import
const SECURE_IMPORTS = `import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest, createUnauthorizedResponse } from '@/lib/auth/api-auth';`;

// Template for authentication check
const AUTH_CHECK = `  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request);
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status);
  }

  const { supabase, tenantId, user } = authResult;`;

function secureApiRoute(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already secured
  if (content.includes('authenticateApiRequest')) {
    console.log(`✅ Already secured: ${filePath}`);
    return;
  }

  console.log(`🔧 Securing: ${filePath}`);

  // Replace imports
  content = content.replace(
    /import { NextRequest, NextResponse } from 'next\/server'.*\n.*\n.*const supabase.*\n/s,
    SECURE_IMPORTS + '\n\n'
  );

  // Add auth check to GET methods
  content = content.replace(
    /export async function GET\(request: NextRequest\) \{\n  try \{/g,
    `export async function GET(request: NextRequest) {\n${AUTH_CHECK}\n\n  try {`
  );

  // Add auth check to POST methods  
  content = content.replace(
    /export async function POST\(request: NextRequest\) \{\n  try \{/g,
    `export async function POST(request: NextRequest) {\n${AUTH_CHECK}\n\n  try {`
  );

  // Replace tenant_id usage with authenticated tenantId
  content = content.replace(/tenant_id = .*?;/g, '// tenant_id from authenticated user');
  content = content.replace(/\.eq\('tenant_id', tenantId\)/g, '.eq("tenant_id", tenantId)');
  content = content.replace(/tenant_id: body\.tenant_id/g, 'tenant_id: tenantId');
  
  // Fix user creation attribution
  content = content.replace(/created_by: .*?user.*?id/g, 'created_by: user.id');

  fs.writeFileSync(filePath, content);
  console.log(`✅ Secured: ${filePath}`);
}

function main() {
  console.log('🚨 BULK API SECURITY FIX STARTING...\n');

  for (const route of API_ROUTES) {
    secureApiRoute(route);
  }

  console.log('\n🎯 Security fix completed!');
  console.log('\n⚠️  MANUAL REVIEW REQUIRED:');
  console.log('- Check each file for proper tenant_id replacement');
  console.log('- Verify user.id is used for created_by fields');
  console.log('- Test API endpoints with authentication');
}

if (require.main === module) {
  main();
}