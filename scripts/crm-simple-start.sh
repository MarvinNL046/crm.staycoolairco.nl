#!/bin/bash

# Simpele CRM Development Start Script
# Zonder interactieve Claude Code sessions

echo "🚀 Starting CRM API Development"
echo "=============================="

# Ga naar project directory
cd /home/marvin/Documenten/cmscrm.staycoolairco.nl

# Start met de Customer API
echo "📦 Building Customer API..."
npx claude-flow@alpha swarm "Create a Next.js API route at app/api/customers/route.ts with GET, POST, PUT, DELETE methods that connects to Supabase customers table. Include proper error handling, TypeScript types, and pagination" --no-claude

echo ""
echo "✅ Customer API task initiated!"
echo ""
echo "🔄 Next steps:"
echo "1. Check the generated API route in app/api/customers/"
echo "2. Run: npm run dev"
echo "3. Test the API at http://localhost:3000/api/customers"