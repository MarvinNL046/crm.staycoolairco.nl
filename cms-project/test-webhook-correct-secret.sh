#!/bin/bash

# Test webhook with the correct secret from the dashboard
echo "🧪 Webhook Test with Dashboard Secret"
echo "====================================="
echo ""

TENANT_ID="80496bff-b559-4b80-9102-3a84afdaa616"
WEBHOOK_SECRET="wh_secret_abc123xyz789"  # Secret from the dashboard
URL="https://crm.staycoolairco.nl/api/webhook/leads?tenant=$TENANT_ID"

# Create test payload
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PAYLOAD='{
  "name": "Test Lead Dashboard '"$TIMESTAMP"'",
  "email": "test-dashboard-'"$TIMESTAMP"'@example.com",
  "phone": "+31 6 1234 5678",
  "company": "Dashboard Test BV",
  "message": "Testing with correct dashboard secret",
  "source": "dashboard_test"
}'

echo "📋 Payload:"
echo "$PAYLOAD" | jq '.'
echo ""

# Generate signature - webhook secret already has correct format
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -hex | sed 's/^.* //')
SIGNATURE_HEADER="sha256=$SIGNATURE"

echo "🔐 Secret: $WEBHOOK_SECRET"
echo "🔏 Signature: $SIGNATURE_HEADER"
echo ""

# Send request
echo "📤 Sending request to: $URL"
echo ""

RESPONSE=$(curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: $SIGNATURE_HEADER" \
  -d "$PAYLOAD" \
  -w "\n{\"http_status\": %{http_code}}")

# Extract HTTP status
HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1 | jq -r '.http_status')
BODY=$(echo "$RESPONSE" | head -n -1)

echo "📥 Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""
echo "HTTP Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" = "201" ]; then
    echo "✅ SUCCESS! Lead created!"
    LEAD_ID=$(echo "$BODY" | jq -r '.leadId' 2>/dev/null)
    if [ ! -z "$LEAD_ID" ] && [ "$LEAD_ID" != "null" ]; then
        echo "🎉 Lead ID: $LEAD_ID"
        echo "Check your CRM dashboard to see the new lead!"
    fi
elif [ "$HTTP_STATUS" = "401" ]; then
    echo "❌ Authentication failed - signature mismatch"
    echo "Make sure the webhook secret matches what's in the database"
elif [ "$HTTP_STATUS" = "500" ]; then
    echo "❌ Server error - database issue"
else
    echo "⚠️  Unexpected status: $HTTP_STATUS"
fi

echo ""
echo "Completed at $(date)"