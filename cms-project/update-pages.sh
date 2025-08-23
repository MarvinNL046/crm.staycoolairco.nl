#!/bin/bash

# Update dynamic page components to Next.js 15 format

update_page() {
    local file="$1"
    echo "Updating $file..."
    
    # Check if it's a client component
    if grep -q '"use client"' "$file"; then
        # Add 'use' import if not present
        if ! grep -q "import.*use.*from.*react" "$file"; then
            sed -i 's/import \(.*\) from "react"/import \1, { use } from "react"/' "$file"
        fi
        
        # Update params type
        sed -i 's/{ params }: { params: { id: string } }/{ params }: { params: Promise<{ id: string }> }/' "$file"
        
        # Add use(params) after function declaration
        sed -i '/export default.*function.*{ params }.*{/,/^[[:space:]]*const/ {
            /export default.*function/!{
                /^[[:space:]]*const/i\  const { id } = use(params)
            }
        }' "$file"
        
        # Replace params.id with id
        sed -i 's/params\.id/id/g' "$file"
    else
        # For server components, just update the type
        sed -i 's/{ params }: { params: { id: string } }/{ params }: { params: Promise<{ id: string }> }/' "$file"
    fi
}

# Find and update all dynamic pages
find /home/marvin/Documenten/crm.staycoolairco.nl/cms-project/src/app -name "page.tsx" -path "*\[*\]*" | while read -r file; do
    update_page "$file"
done

echo "Done updating pages!"