# CSV Import Feature - StayCool CRM

Complete CSV import functionality voor bulk lead upload met intelligente field mapping en automatische email notificaties.

## ✅ Geïmplementeerde Features

### 🎯 Core Functionaliteit
- **Bulk Lead Upload**: Tot 1000 leads per import
- **Intelligente Field Mapping**: Ondersteunt Nederlandse en Engelse veldnamen
- **Duplicate Detection**: Automatische detectie van bestaande emails
- **Batch Processing**: Verwerkt leads in batches van 100 voor optimale performance
- **Real-time Feedback**: Live status updates tijdens import proces

### 📧 Email Integratie
- **Automatische Welkom Emails**: Nieuwe leads met email krijgen welkom email via Resend
- **Background Processing**: Email verzending gebeurt asynchroon voor snelheid

### 🛡️ Validatie & Error Handling
- **File Type Validation**: Alleen .csv bestanden toegestaan
- **Data Validation**: Controleert verplichte velden en email formaten
- **Comprehensive Error Reporting**: Gedetailleerde foutmeldingen per rij
- **UTF-8 Support**: Ondersteuning voor Nederlandse karakters

### 🎨 User Interface
- **Modal Interface**: Elegante overlay met CSV import wizard
- **Template Download**: Voorbeeld CSV bestand met alle ondersteunde velden
- **Progress Indicators**: Visual feedback tijdens upload en processing
- **Detailed Results**: Success/failed/duplicates statistieken met foutdetails

## 📋 Ondersteunde CSV Velden

### ✅ Verplichte Velden
- **Naam**: `naam`, `name`, `volledige_naam`, `full_name` of `voornaam` + `achternaam`

### 📊 Optionele Velden

| Nederlands | Engels | Alternatief | Beschrijving |
|------------|---------|-------------|--------------|
| `email` | `email` | `e_mail`, `e-mail`, `email_adres` | Email adres |
| `telefoon` | `phone` | `telephone`, `mobiel`, `gsm` | Telefoonnummer |
| `bedrijf` | `company` | `bedrijfsnaam`, `organisatie` | Bedrijfsnaam |
| `bron` | `source` | - | Lead bron (website, telefoon, etc.) |
| `staat` | `status` | - | Lead status (new, contacted, qualified, converted, lost) |
| `notities` | `notes` | `opmerkingen`, `bericht`, `comments` | Opmerkingen |
| `tags` | `tags` | `labels`, `categorieën` | Tags gescheiden door komma's |

## 🗂️ CSV Template Voorbeeld

```csv
naam,email,telefoon,bedrijf,bron,staat,notities,tags
Jan Jansen,jan@example.com,+31612345678,Jansen BV,website,new,Interesse in airco installatie,airco;installatie
Marie Peters,marie@example.com,+31687654321,Peters & Co,telefoon,contacted,Wil offerte ontvangen,offerte;commercieel
Piet de Vries,piet@example.com,+31654321098,,referral,qualified,Doorverwezen door klant,referral;warm
```

## 🔧 Technische Implementatie

### API Endpoint
**POST** `/api/leads/import`
- Multipart form data met CSV file
- Automatische tenant detectie via authentication
- Batch processing met error recovery

### Database Updates
- Bulk insert via Supabase met RLS (Row Level Security)
- Duplicate email detection query optimized
- Automatic lead tagging met import source

### Email Automation
- Background Resend API calls voor welkom emails
- Error handling voor email failures (niet-blokkerend)
- Professional HTML templates met StayCool branding

## 📈 Performance Specificaties

### Verwerking Limieten
- **Max File Size**: Automatisch bepaald door CSV content
- **Max Leads**: 1000 leads per import sessie
- **Batch Size**: 100 leads per database operatie
- **Processing Speed**: ~50-100 leads/seconde (afhankelijk van validatie)

### Memory Efficiency
- **Stream Processing**: CSV parsing zonder volledig geheugen laden
- **Lazy Validation**: Per-row validatie tijdens processing
- **Error Buffering**: Efficient error collection en reporting

## 🚀 Gebruikersinstructies

### Stap 1: CSV Template Downloaden
1. Open Leads pagina in CRM dashboard
2. Klik "CSV Import" button
3. Download template bestand
4. Vul template in met je lead data

### Stap 2: CSV Import Uitvoeren  
1. Klik "CSV Import" button
2. Upload je ingevulde CSV bestand
3. Bekijk real-time progress indicator
4. Review import resultaten (success/failed/duplicates)

### Stap 3: Resultaten Controleren
- Check imported leads in lead pipeline
- Verifieer automatische welkom emails verzonden
- Review error details voor gefaalde imports

## 🐛 Troubleshooting

### Veel Voorkomende Issues

**❌ "Naam is verplicht" Error**
- **Oorzaak**: CSV mist naam kolom of lege waarden
- **Oplossing**: Zorg voor `naam` kolom met geldige waarden

**❌ "Email bestaat al" Duplicates**  
- **Oorzaak**: Email adres bestaat al in CRM
- **Oplossing**: Remove duplicates of update bestaande leads manually

**❌ "Invalid CSV format" Error**
- **Oorzaak**: Bestand is niet valid CSV formaat
- **Oplossing**: Save als .csv in Excel/Google Sheets met UTF-8 encoding

**❌ Emails niet ontvangen**
- **Oorzaak**: Resend API key niet geconfigureerd of email in spam
- **Oplossing**: Check Settings → Email Automatisering voor API key

### Debug Tips
- **Browser Console**: Check voor JavaScript errors
- **Import Results**: Bekijk gedetailleerde foutmeldingen
- **Email Logs**: Check Resend dashboard voor email delivery status

## 🔮 Roadmap Features

### Binnenkort
- [ ] **Column Mapping UI**: Drag & drop field mapping interface
- [ ] **Import History**: Log van alle imports met rollback functie
- [ ] **Scheduled Imports**: Recurring CSV imports via CRON
- [ ] **Excel Support**: Direct .xlsx file import ondersteuning

### Later
- [ ] **Import Templates**: Opslaan van field mappings per bron
- [ ] **Data Preview**: Preview van data voor import bevestiging  
- [ ] **Import Webhooks**: API callbacks voor import completion
- [ ] **Advanced Validation**: Custom validation rules per tenant

## 📊 Import Statistieken

De CSV import functionaliteit tracked de volgende metrics:
- **Success Rate**: Percentage successfully geïmporteerde leads
- **Processing Speed**: Leads per seconde verwerkingssnelheid
- **Error Patterns**: Most common validation failures
- **Email Delivery**: Welkom email success rates

Deze data wordt gebruikt voor performance optimizations en user experience improvements.

---

*CSV Import Feature geïmplementeerd als onderdeel van StayCool CRM MVP roadmap. Voor support of feature requests, neem contact op met het development team.*