# Webhook Implementatie Gids

## Webhook Details

**Endpoint URL:**
```
https://crm.staycoolairco.nl/api/webhook/leads?tenant=80496bff-b559-4b80-9102-3a84afdaa616
```

**Secret Key:** `wh_secret_abc123xyz789`

## Vereiste Velden

- `name` (string, verplicht) - Naam van de lead
- `email` (string, verplicht) - Email adres

## Optionele Velden

- `phone` (string) - Telefoonnummer
- `company` (string) - Bedrijfsnaam
- `message` (string) - Bericht/notities
- `source` (string) - Bron van de lead (bijv. "website", "contactform", "landing_page")
- `metadata` (object) - Extra data zoals UTM parameters

## Security: Signature Validatie

De webhook vereist een HMAC-SHA256 signature in de `X-Webhook-Signature` header.

### JavaScript Voorbeeld (Client-side - NIET AANBEVOLEN)
```javascript
// WAARSCHUWING: Dit exposed je secret key in de browser!
// Gebruik dit alleen voor testen, niet in productie
async function generateSignature(payload, secret) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, data);
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return 'sha256=' + hashHex;
}
```

### PHP Voorbeeld (Server-side - AANBEVOLEN)
```php
$jsonPayload = json_encode($payload);
$signature = 'sha256=' . hash_hmac('sha256', $jsonPayload, $webhookSecret);
```

### Node.js Voorbeeld (Server-side - AANBEVOLEN)
```javascript
const crypto = require('crypto');

const signature = 'sha256=' + crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(payload))
    .digest('hex');
```

### Python Voorbeeld (Server-side - AANBEVOLEN)
```python
import hmac
import hashlib
import json

signature = 'sha256=' + hmac.new(
    webhook_secret.encode(),
    json.dumps(payload).encode(),
    hashlib.sha256
).hexdigest()
```

## WordPress Contact Form 7 Integratie

Voor WordPress kun je een plugin gebruiken of custom code toevoegen:

```php
// In functions.php
add_action('wpcf7_mail_sent', 'send_to_crm_webhook');

function send_to_crm_webhook($contact_form) {
    $submission = WPCF7_Submission::get_instance();
    if (!$submission) return;
    
    $posted_data = $submission->get_posted_data();
    
    // Map form fields to webhook fields
    $payload = [
        'name' => $posted_data['your-name'],
        'email' => $posted_data['your-email'],
        'phone' => $posted_data['your-phone'],
        'company' => $posted_data['your-company'],
        'message' => $posted_data['your-message'],
        'source' => 'cf7_' . $contact_form->id()
    ];
    
    // Rest van de webhook code hier...
}
```

## Rate Limiting

- Maximum 60 requests per minuut per IP adres
- Bij overschrijding krijg je een 429 status code
- Headers bevatten rate limit info:
  - `X-RateLimit-Limit`: 60
  - `X-RateLimit-Remaining`: Aantal overgebleven requests
  - `X-RateLimit-Reset`: Unix timestamp wanneer de limit reset

## Response Codes

- `201 Created` - Lead succesvol aangemaakt
- `400 Bad Request` - Validatie fout (missende velden, etc.)
- `401 Unauthorized` - Ongeldige signature
- `404 Not Found` - Tenant niet gevonden
- `429 Too Many Requests` - Rate limit overschreden
- `500 Internal Server Error` - Server fout

## Test de Webhook

Gebruik de test scripts in dit project:
```bash
./test-webhook-correct-secret.sh
```

Of test met curl:
```bash
curl -X POST "https://crm.staycoolairco.nl/api/webhook/leads?tenant=80496bff-b559-4b80-9102-3a84afdaa616" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=YOUR_SIGNATURE" \
  -d '{"name":"Test Lead","email":"test@example.com"}'
```