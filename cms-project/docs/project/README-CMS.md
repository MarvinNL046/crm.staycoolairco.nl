# CMS Project - Next.js Content Management System

Een moderne CMS gebouwd met Next.js, TypeScript, Supabase, Prisma, en shadcn/ui.

## 🚀 Features

- **Next.js 15** met App Router en TypeScript
- **Supabase** voor authentication en real-time database
- **Prisma** voor lokale database development
- **shadcn/ui** voor moderne UI components
- **Tailwind CSS** voor styling
- **Docker** voor lokale development environment

## 📦 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: 
  - Supabase (production)
  - PostgreSQL (local development via Docker)
- **ORM**: Prisma
- **Auth**: Supabase Auth
- **UI**: shadcn/ui + Tailwind CSS
- **DevOps**: Docker + Docker Compose

## 🛠️ Setup Instructions

### 1. Environment Setup

Kopieer `.env.example` naar `.env.local` en vul je Supabase credentials in:

```bash
cp .env.example .env.local
```

Vul de volgende waarden in je `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

### 2. Lokale Development met Docker

Start de lokale PostgreSQL database:

```bash
npm run docker:up
```

### 3. Database Setup

Genereer Prisma client:

```bash
npm run db:generate
```

Run database migrations:

```bash
npm run db:migrate
```

Seed de database met initial data:

```bash
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

De applicatie is nu beschikbaar op:
- **Main app**: http://localhost:3000
- **Admin dashboard**: http://localhost:3000/admin
- **Database admin**: http://localhost:8080 (Adminer)

## 📁 Project Structure

```
cms-project/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin dashboard
│   │   ├── auth/              # Authentication pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   └── ui/                # shadcn/ui components
│   ├── lib/                   # Utility libraries
│   │   ├── prisma.ts          # Prisma client
│   │   └── supabase/          # Supabase clients
│   └── types/                 # TypeScript type definitions
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts               # Database seeding
├── docker-compose.yml         # Docker configuration
└── Dockerfile                # Docker image
```

## 🗄️ Database Schema

Het CMS gebruikt de volgende hoofdentiteiten:

- **User**: Gebruikers met rollen (ADMIN, EDITOR, USER)
- **Post**: Blog posts/artikelen met status (DRAFT, PUBLISHED, ARCHIVED)
- **Category**: Categorieën voor content organisatie
- **Tag**: Tags voor content labeling

## 🔐 Authentication

Het systeem gebruikt Supabase Auth met:
- Email/password authentication
- Google OAuth (optioneel)
- Protected admin routes
- Role-based access control

## 📋 Available Scripts

### Development
- `npm run dev` - Start development server met Turbopack
- `npm run build` - Build voor productie
- `npm run start` - Start productie server

### Database
- `npm run db:generate` - Genereer Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:reset` - Reset database
- `npm run db:seed` - Seed database met data
- `npm run db:studio` - Open Prisma Studio

### Docker
- `npm run docker:up` - Start containers
- `npm run docker:down` - Stop containers
- `npm run docker:build` - Build Docker images

## 🚀 Next Steps

1. **Content Management**: Implementeer CRUD operaties voor posts
2. **Rich Text Editor**: Integreer een rich text editor
3. **File Upload**: Implementeer afbeelding upload functionaliteit
4. **SEO**: Voeg SEO meta tags en sitemap toe
5. **Performance**: Implementeer caching en optimizations

## 🤝 Contributing

1. Fork het project
2. Maak een feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit je changes (`git commit -m 'Add some AmazingFeature'`)
4. Push naar de branch (`git push origin feature/AmazingFeature`)
5. Open een Pull Request

## 📝 License

Dit project is gelicenseerd onder de MIT License.