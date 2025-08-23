#!/bin/bash

# Test webhook script for StayCool CRM
TENANT_ID="80496bff-b559-4b80-9102-3a84afdaa616"
WEBHOOK_SECRET="whsec_58e1bfafb04c9aac4c914ba9253d5427"
URL="https://crm.staycoolairco.nl/api/webhook/leads?tenant=$TENANT_ID"

# Create test payload
PAYLOAD='{
  "name": "Test Lead via CURL",
  "email": "test@staycoolairco.nl",
  "phone": "+31 6 1234 5678",
  "company": "Test Company BV",
  "message": "Interesse in airconditioning voor ons kantoor",
  "source": "website_contact_form"
}'

# Generate HMAC signature
# Remove whsec_ prefix from secret
CLEAN_SECRET=${WEBHOOK_SECRET#whsec_}
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$CLEAN_SECRET" -hex | sed 's/^.* //')
SIGNATURE_HEADER="sha256=$SIGNATURE"

echo "🧪 Testing webhook with CURL..."
echo "URL: $URL"
echo "Signature: $SIGNATURE_HEADER"
echo ""

# Send request
curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: $SIGNATURE_HEADER" \
  -d "$PAYLOAD" \
  -w "\n\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" \
  -v

echo ""
echo "✅ Test completed!"