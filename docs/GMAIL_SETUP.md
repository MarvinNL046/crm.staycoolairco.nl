# Gmail API Setup Guide

Voor email automations via Gmail API heb je een Google OAuth2 setup nodig.

## Stap 1: Google Cloud Console Setup

1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Maak een nieuw project of selecteer bestaand project
3. Enable de Gmail API:
   - Ga naar "APIs & Services" → "Library"
   - Zoek naar "Gmail API"
   - Klik "Enable"

## Stap 2: OAuth2 Credentials

1. Ga naar "APIs & Services" → "Credentials"
2. Klik "Create Credentials" → "OAuth 2.0 Client IDs"
3. Configureer OAuth consent screen (first time only):
   - User Type: External (voor persoonlijk gebruik)
   - App name: "StayCool CRM"
   - User support email: jouw email
   - Developer contact: jouw email
4. Maak OAuth2 Client ID:
   - Application type: "Web application"
   - Name: "StayCool CRM Gmail"
   - Authorized redirect URIs: 
     - `http://localhost:3000/api/auth/google/callback` (development)
     - `https://jouw-domain.nl/api/auth/google/callback` (production)

## Stap 3: Refresh Token Genereren

Je hebt een refresh token nodig voor server-side email verzending.

### Optie A: Via OAuth2 Playground

1. Ga naar [OAuth2 Playground](https://developers.google.com/oauthplayground/)
2. Klik op het tandwiel (settings) rechtsboven
3. Check "Use your own OAuth credentials"
4. Vul in:
   - OAuth Client ID: jouw client ID
   - OAuth Client secret: jouw client secret
5. In de linker sidebar:
   - Zoek "Gmail API v1"
   - Selecteer "https://www.googleapis.com/auth/gmail.send"
6. Klik "Authorize APIs"
7. Login met je Gmail account
8. Klik "Exchange authorization code for tokens"
9. Kopieer de "Refresh token"

### Optie B: Via Node.js Script

```javascript
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'http://localhost:3000/api/auth/google/callback'
);

// Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/gmail.send'],
});

console.log('Authorize this app by visiting this url:', authUrl);
// Volg de URL, autoriseer, en kopieer de code uit de callback URL

// Exchange code for tokens
oauth2Client.getToken('AUTHORIZATION_CODE_FROM_CALLBACK').then(({ tokens }) => {
  console.log('Refresh Token:', tokens.refresh_token);
});
```

## Stap 4: Environment Variables

Voeg toe aan je `.env.local`:

```bash
# Gmail API credentials
GOOGLE_CLIENT_ID=jouw-client-id
GOOGLE_CLIENT_SECRET=jouw-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_REFRESH_TOKEN=jouw-refresh-token
GMAIL_USER=info@staycoolairco.nl
```

## Stap 5: Test de Setup

1. Restart je development server
2. Maak een lead aan met email adres
3. Open lead details en klik op "Email" button
4. Check of email wordt verzonden

## Troubleshooting

### "Invalid Credentials" Error
- Controleer of alle environment variables correct zijn
- Zorg dat Gmail API enabled is in Google Cloud Console

### "Insufficient Scopes" Error
- Zorg dat de refresh token gegenereerd is met `gmail.send` scope

### "Access Denied" Error
- Voeg je eigen email toe aan "Test users" in OAuth consent screen
- Of publish je app (voor productie gebruik)

## Productie Deployment

Voor Netlify deployment:
1. Voeg alle environment variables toe in Netlify dashboard
2. Update GOOGLE_REDIRECT_URI naar je production domain
3. Voeg production domain toe aan authorized redirect URIs in Google Cloud Console

## Security Notes

- Bewaar je client secret veilig
- Gebruik nooit credentials in frontend code
- Refresh tokens verlopen niet, maar kunnen wel worden ingetrokken
- Monitor API usage in Google Cloud Console