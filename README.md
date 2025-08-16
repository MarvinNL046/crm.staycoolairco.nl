# StayCool CRM

Modern multi-tenant CRM systeem voor HVAC bedrijven gebouwd met Next.js, Supabase en Tailwind CSS.

## Features

✅ **Multi-tenant architectuur** - Meerdere organisaties in één systeem  
✅ **Lead management** - Drag & drop pipeline voor lead statussen  
✅ **Authenticatie** - Veilige login met Supabase Auth  
✅ **Realtime updates** - Live synchronisatie tussen gebruikers  
🚧 **Activiteiten tracking** - Timeline van alle lead interacties  
🚧 **Message templates** - Email/SMS/WhatsApp templates  
🚧 **Automatisering** - Trigger-based messaging  

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Deployment**: Netlify
- **UI Components**: Radix UI, Lucide Icons

## Lokale Development

1. Clone de repository
2. Installeer dependencies:
   ```bash
   npm install
   ```

3. Maak een `.env.local` bestand (zie `.env.local.example`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Start de development server:
   ```bash
   npm run dev
   ```

## Supabase Setup

1. Maak een nieuw Supabase project
2. Voer het SQL script uit in de SQL editor (zie je eerder gestuurde SQL)
3. Kopieer de URL en anon key naar je `.env.local`

## Deployment op Netlify

1. Push code naar GitHub
2. Connecteer GitHub repo met Netlify
3. Configureer environment variables in Netlify:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

De site wordt automatisch gedeployed bij elke push naar main.

## TypeScript Types Genereren

Voor betere TypeScript support, genereer de database types:

```bash
npx supabase gen types typescript --project-id your-project-id > src/types/database.types.ts
```

## Project Structuur

```
src/
├── app/                  # Next.js app directory
│   ├── auth/            # Login/register pagina's
│   └── dashboard/       # Beveiligde dashboard pagina's
├── components/          # React componenten
│   ├── leads/          # Lead-gerelateerde componenten
│   ├── layout/         # Layout componenten
│   └── ui/             # Herbruikbare UI componenten
├── lib/                 # Utilities en configuratie
│   └── supabase/       # Supabase client setup
├── types/              # TypeScript type definities
└── hooks/              # Custom React hooks
```

## Volgende Stappen

- [ ] Lead CRUD operaties voltooien (create, edit, delete)
- [ ] Zoekfunctionaliteit implementeren
- [ ] Activities timeline toevoegen
- [ ] Message templates beheer
- [ ] Automations configuratie
- [ ] Tenant settings pagina
- [ ] User management binnen tenant