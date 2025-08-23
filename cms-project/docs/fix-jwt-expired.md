# Fix voor "JWT Expired" error in Supabase Dashboard

## Snelle Fixes (probeer in deze volgorde):

### 1. **Browser Refresh (meest effectief)**
- Hard refresh: `Ctrl + F5` (Windows) of `Cmd + Shift + R` (Mac)
- Of sluit browser tab en open Supabase dashboard opnieuw

### 2. **Uitloggen en Opnieuw Inloggen**
- Klik op je avatar rechtsboven
- Log uit
- Log opnieuw in

### 3. **Browser Cache/Cookies Wissen**
- Clear cookies voor `supabase.com` domein
- Clear localStorage voor Supabase dashboard
- Chrome: F12 → Application → Storage → Clear site data

### 4. **Incognito/Private Window**
- Open Supabase dashboard in incognito modus
- Dit voorkomt cache/cookie problemen

## Structurele Oplossingen:

### 1. **Check JWT Expiry Settings** (in je app)
```typescript
// In je supabase client config
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,  // Automatisch tokens vernieuwen
    persistSession: true,     // Sessie bewaren
    detectSessionInUrl: true
  }
})
```

### 2. **Session Management in je App**
```typescript
// Check en refresh session
const { data: { session }, error } = await supabase.auth.getSession()

if (error || !session) {
  // Redirect naar login
  window.location.href = '/login'
}

// Luister naar auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully')
  }
  if (event === 'SIGNED_OUT') {
    window.location.href = '/login'
  }
})
```

### 3. **Environment Variables Check**
Zorg dat deze correct zijn in je `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
```

## Als het Probleem Blijft:

### 1. **Check Supabase Status**
- Ga naar: https://status.supabase.com/
- Check of er service issues zijn

### 2. **Project Settings**
- Ga naar Settings → API in Supabase dashboard
- Check JWT Settings
- Regenereer API keys indien nodig (⚠️ update dan ook je app!)

### 3. **Browser Specifiek**
- Probeer een andere browser
- Disable browser extensions (vooral ad blockers)
- Check of third-party cookies enabled zijn

### 4. **Contact Support**
Als niets werkt:
- Open support ticket via Supabase dashboard
- Of via: https://supabase.com/support

## Preventie Tips:

1. **Regelmatig Uitloggen/Inloggen**
   - Voorkomt token buildup
   - Reset session state

2. **Browser Updates**
   - Houd browser up-to-date
   - Clear cache regelmatig

3. **Monitor in Development**
   ```typescript
   // Debug auth state
   if (process.env.NODE_ENV === 'development') {
     supabase.auth.onAuthStateChange((event, session) => {
       console.log('Auth event:', event)
       console.log('Session:', session)
     })
   }
   ```

## Voor je CRM App:

De JWT expired in het Supabase dashboard heeft **geen invloed** op je productie app, maar voor development kun je dit toevoegen aan je app:

```typescript
// utils/supabase/client.ts
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      refreshThreshold: 300, // Refresh 5 min voor expiry
    }
  }
)
```

Dit zorgt ervoor dat tokens automatisch worden vernieuwd voordat ze verlopen.