#!/bin/bash

# Detailed webhook test with verbose output
echo "🔍 Detailed Webhook Test - StayCool CRM"
echo "======================================="
echo ""

TENANT_ID="80496bff-b559-4b80-9102-3a84afdaa616"
WEBHOOK_SECRET="whsec_58e1bfafb04c9aac4c914ba9253d5427"
URL="https://crm.staycoolairco.nl/api/webhook/leads?tenant=$TENANT_ID"

# Create test payload with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PAYLOAD='{
  "name": "Test Lead '"$TIMESTAMP"'",
  "email": "test-'"$TIMESTAMP"'@example.com",
  "phone": "+31 6 1234 5678",
  "company": "Test Company BV",
  "message": "Testing webhook at '"$(date)"'",
  "source": "webhook_test"
}'

echo "📋 Payload:"
echo "$PAYLOAD" | jq '.'
echo ""

# Generate signature
CLEAN_SECRET=${WEBHOOK_SECRET#whsec_}
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$CLEAN_SECRET" -hex | sed 's/^.* //')
SIGNATURE_HEADER="sha256=$SIGNATURE"

echo "🔐 Signature: $SIGNATURE_HEADER"
echo ""

# Send request with full output
echo "📤 Sending request..."
echo "URL: $URL"
echo ""

TEMP_FILE=$(mktemp)

# Make request and capture everything
HTTP_CODE=$(curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: $SIGNATURE_HEADER" \
  -d "$PAYLOAD" \
  -w "%{http_code}" \
  -o "$TEMP_FILE")

RESPONSE=$(cat "$TEMP_FILE")
rm "$TEMP_FILE"

echo "📥 Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""
echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "201" ]; then
    echo "✅ SUCCESS! Lead created!"
    LEAD_ID=$(echo "$RESPONSE" | jq -r '.leadId' 2>/dev/null)
    if [ ! -z "$LEAD_ID" ] && [ "$LEAD_ID" != "null" ]; then
        echo "📌 Lead ID: $LEAD_ID"
    fi
elif [ "$HTTP_CODE" = "500" ]; then
    echo "❌ Server error (500)"
    echo ""
    echo "Possible causes:"
    echo "1. Database connection issue"
    echo "2. RLS policy blocking the insert"
    echo "3. Missing columns in the leads table"
    echo "4. Service role key not available in production"
else
    echo "⚠️  Unexpected status: $HTTP_CODE"
fi

echo ""
echo "Completed at $(date)"