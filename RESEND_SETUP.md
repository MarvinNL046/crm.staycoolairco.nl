# Resend Email Setup Guide

Simpele 3-minuten setup voor email automations met Resend.

## Stap 1: Resend Account (1 minuut)

1. Ga naar [resend.com](https://resend.com)
2. Sign up met je email
3. Verificeer je email account

## Stap 2: API Key (1 minuut)

1. Login in Resend dashboard
2. Ga naar "API Keys" 
3. Klik "Create API Key"
4. Name: "StayCool CRM"
5. Kopieer de API key (re_xxxxxxxxxx)

## Stap 3: Environment Variable (30 seconden)

Voeg toe aan je `.env.local`:

```bash
RESEND_API_KEY=re_xxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Stap 4: Test (30 seconden)

1. Restart je development server: `npm run dev`
2. Ga naar Settings → Email Automatisering
3. Vul je email in bij "Test Email Functie"
4. Klik "Test"
5. Check je inbox! 📧

## Productie Setup

Voor live deployment op Netlify:

1. **Netlify Environment Variables:**
   - `RESEND_API_KEY`: je Resend API key
   - `NEXT_PUBLIC_APP_URL`: `https://crm.staycoolairco.nl`

2. **Domein Verificatie (Optioneel):**
   - Ga naar Resend → Domains
   - Add domain: `staycoolairco.nl`
   - Voeg DNS records toe zoals getoond
   - Update "from" email naar: `noreply@staycoolairco.nl`

## Features die nu werken:

✅ **Automatische Welkom Emails**
- Nieuwe leads via webhook krijgen automatisch welkom email
- Manual leads via "Email" button in lead details

✅ **Professional Email Templates**
- Responsive HTML design
- StayCool branding
- Persoonlijke naam van lead

🚧 **Binnenkort:**
- Status change emails bij pipeline updates
- Custom email templates per tenant

## Gratis Limieten

- **3,000 emails/maand gratis**
- Meer dan genoeg voor de start!
- Betaald plan: €20/maand voor 50K emails

## Troubleshooting

**"API Key Invalid"**
- Check of API key correct gekopieerd is
- Geen spaties aan begin/eind

**"Email niet ontvangen"**  
- Check spam folder
- Probeer ander email adres
- Check Resend logs in dashboard

**Test functie werkt niet**
- Restart development server na env variable toevoegen
- Check browser console voor errors