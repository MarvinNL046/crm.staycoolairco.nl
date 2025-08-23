# StayCool CRM - Deployment Guide

## Production Deployment voor crm.staycoolairco.nl

### Environment Variables Setup

1. **Copy environment template:**
```bash
cp .env.production .env.local
```

2. **Configure productie variabelen:**
```env
# Database (gebruik je productie database)
DATABASE_URL="postgresql://username:password@host:5432/crm_db"

# Supabase (gebruik je productie project)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-production-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-production-service-role-key"

# Productie URLs
NEXTAUTH_URL="https://crm.staycoolairco.nl"
NEXT_PUBLIC_SITE_URL="https://crm.staycoolairco.nl"

# Webhook Security
WEBHOOK_SECRET="generate-a-secure-secret-key"
```

### Database Migration

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Optional: Seed with sample data
npm run db:seed
```

### Production Build

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

### Webhook Integration

**Webhook URL voor externe websites:**
```
https://crm.staycoolairco.nl/api/webhook/leads
```

**Required Headers:**
```
Content-Type: application/json
X-Webhook-Signature: sha256_signature (optional)
```

**Payload Format:**
```json
{
  "name": "Customer Name",
  "email": "customer@example.com",
  "phone": "+31 6 1234 5678",
  "company": "Company Name",
  "message": "Customer message",
  "source": "staycool_website"
}
```

### SSL Certificate

Zorg ervoor dat je domein een geldige SSL certificate heeft:
- Let's Encrypt via Certbot
- Cloudflare SSL
- Of je hosting provider's SSL

### Environment Checklist

- [ ] Database verbinding getest
- [ ] Supabase configuratie getest
- [ ] SSL certificate actief
- [ ] Environment variables ingesteld
- [ ] Webhook endpoint getest
- [ ] Authentication werkend
- [ ] Email configuratie (toekomstig)

### Monitoring

Monitor de volgende endpoints:
- `https://crm.staycoolairco.nl` - Main app
- `https://crm.staycoolairco.nl/api/webhook/leads` - Webhook health
- `https://crm.staycoolairco.nl/crm` - CRM dashboard

### Backup Strategy

1. **Database backup** - dagelijks via cron job
2. **Environment files** - veilig opgeslagen
3. **Code repository** - Git backup op GitHub

### Security Checklist

- [ ] Webhook signature validatie enabled
- [ ] Strong database passwords
- [ ] HTTPS enforced
- [ ] Environment variables beveiligd
- [ ] Supabase RLS policies actief
- [ ] Rate limiting geïmplementeerd (toekomstig)

### Support

Bij deployment issues:
1. Check de logs: `npm run logs`
2. Test webhook: `https://crm.staycoolairco.nl/webhook-test`
3. Verify environment variables
4. Check database connectivity