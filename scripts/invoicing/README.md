# CRM Facturatie Systeem - Hive Mind Setup

Dit is een geautomatiseerd setup systeem voor het CRM facturatie module met behulp van Claude Flow Hive Mind swarms.

## 🚀 Snelle Start

### Optie 1: Volledige Automatische Setup (Aanbevolen)
Start een hive-mind swarm die het complete facturatiesysteem bouwt:

```bash
# In een aparte terminal:
node scripts/invoicing/setup-invoicing-swarm.js
```

Dit commando:
- ✅ Installeert het database schema
- ✅ Spawnt een Hive Mind swarm met 8 specialized agents
- ✅ Bouwt automatisch alle API endpoints
- ✅ Creëert frontend componenten
- ✅ Integreert met de Deals sectie
- ✅ Implementeert PDF generatie
- ✅ Configureert email integratie

### Optie 2: Alleen Database Setup
Als je alleen de database wilt opzetten:

```bash
node scripts/invoicing/run-sql-direct.js
```

Volg daarna de instructies om het SQL script in Supabase uit te voeren.

## 📋 Wat wordt er gebouwd?

### Database Structuur
- **quotes** - Offertes/quotations beheer
- **invoices** - Facturen beheer  
- **line_items** - Regel items voor quotes en facturen
- **payments** - Betalingen tracking
- **products** - Product/diensten catalogus

### Features
- 🎯 **Quote-to-Invoice Workflow**: Converteer offertes naar facturen
- 📊 **Deals Integratie**: Openstaande offertes verschijnen in Deals
- 📧 **Email Integratie**: Verstuur quotes/facturen met tracking
- 📄 **PDF Generatie**: Professionele PDF documenten
- 💰 **Payment Tracking**: Volg betalingen en openstaande bedragen
- 🔒 **Multi-tenant**: Volledig gescheiden per tenant met RLS

## 🤖 Hive Mind Agents

De swarm bestaat uit deze gespecialiseerde agents:

1. **system-architect** - Database en systeem design
2. **backend-dev** - API ontwikkeling
3. **frontend-dev** - React componenten
4. **ui-designer** - UI/UX design
5. **integration-specialist** - Deals integratie
6. **pdf-specialist** - PDF generatie
7. **email-specialist** - Email functies
8. **qa-engineer** - Testing en kwaliteit

## 🔧 Monitoring & Control

### Check Swarm Status
```bash
npx claude-flow@alpha hive-mind status
```

### Monitor Progress Real-time
```bash
npx claude-flow@alpha hive-mind monitor
```

### Resume een Sessie
```bash
npx claude-flow@alpha hive-mind resume [session-id]
```

### Stop de Swarm
```bash
npx claude-flow@alpha hive-mind stop
```

## 📁 Project Structuur

Na completion zal de volgende structuur aanwezig zijn:

```
src/
├── app/
│   ├── api/
│   │   ├── quotes/          # Quote API endpoints
│   │   ├── invoices/        # Invoice API endpoints  
│   │   ├── payments/        # Payment API endpoints
│   │   └── products/        # Product API endpoints
│   └── dashboard/
│       ├── invoicing/       # Facturatie dashboard
│       ├── quotes/          # Quotes beheer
│       └── invoices/        # Facturen beheer
├── components/
│   └── invoicing/          # Facturatie componenten
├── lib/
│   └── invoicing/          # Facturatie utilities
└── types/
    └── invoicing.types.ts  # TypeScript types
```

## ⚙️ Configuratie

Zorg dat deze environment variables zijn ingesteld in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key  # Voor admin operations
```

## 🐛 Troubleshooting

### Swarm start niet
- Check of claude-flow is geïnstalleerd: `npm install -g claude-flow@alpha`
- Controleer je internet verbinding
- Probeer: `npx claude-flow@alpha doctor`

### Database errors
- Controleer Supabase credentials in `.env.local`
- Voer SQL handmatig uit via Supabase Dashboard
- Check RLS policies in Supabase

### Agents zijn idle
- Resume de sessie met het session ID
- Check `npx claude-flow@alpha hive-mind logs`
- Restart met `--force` flag

## 📚 Meer Informatie

- [Claude Flow Documentatie](https://github.com/ruvnet/claude-flow)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)

## 🎯 Next Steps

Na succesvolle setup:

1. Start development server: `npm run dev`
2. Ga naar `/dashboard/invoicing` 
3. Test quote aanmaken
4. Check Deals integratie
5. Test email verzending

Happy Invoicing! 🚀