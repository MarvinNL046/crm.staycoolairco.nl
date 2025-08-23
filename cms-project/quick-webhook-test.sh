#!/bin/bash

# Quick webhook test for StayCool CRM
echo "🧪 Quick Webhook Test - StayCool CRM"
echo "====================================="
echo ""

TENANT_ID="80496bff-b559-4b80-9102-3a84afdaa616"
WEBHOOK_SECRET="whsec_58e1bfafb04c9aac4c914ba9253d5427"
URL="https://crm.staycoolairco.nl/api/webhook/leads?tenant=$TENANT_ID"

# Test 1: Check webhook info
echo "1️⃣ Checking webhook configuration..."
curl -s "$URL" | jq '.'
echo ""

# Test 2: Send test lead with signature
echo "2️⃣ Sending test lead with signature..."

PAYLOAD='{
  "name": "Test Lead - '"$(date +%Y%m%d-%H%M%S)"'",
  "email": "test-'"$(date +%s)"'@example.com",
  "phone": "+31 6 1234 5678",
  "company": "Test Company BV",
  "message": "Webhook test at '"$(date)"'",
  "source": "webhook_test"
}'

# Generate signature
CLEAN_SECRET=${WEBHOOK_SECRET#whsec_}
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$CLEAN_SECRET" -hex | sed 's/^.* //')
SIGNATURE_HEADER="sha256=$SIGNATURE"

# Send request
RESPONSE=$(curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: $SIGNATURE_HEADER" \
  -d "$PAYLOAD" \
  -w "\n{\"http_status\": %{http_code}}")

# Extract HTTP status
HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1 | jq -r '.http_status')
BODY=$(echo "$RESPONSE" | head -n -1)

echo "Response: $BODY"
echo "HTTP Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "201" ]; then
    echo "✅ SUCCESS! Lead created successfully!"
    echo "$BODY" | jq '.leadId'
elif [ "$HTTP_STATUS" = "500" ]; then
    echo "❌ Still getting database error. Deployment might not be complete yet."
    echo "   Wait a few minutes and try again."
else
    echo "⚠️  Unexpected status: $HTTP_STATUS"
fi

echo ""
echo "Test completed at $(date)"