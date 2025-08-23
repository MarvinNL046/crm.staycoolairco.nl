import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  const headersList = await headers()
  
  // Check if we're on localhost
  const host = headersList.get('host') || ''
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
  
  // Create a mock client for localhost that doesn't require authentication
  if (isLocalhost) {
    console.log('Localhost detected in createClient, using mock Supabase client')
    // Return a mock client that returns empty data for all queries
    const mockQueryBuilder = {
      select: (columns?: string) => mockQueryBuilder,
      insert: (data: any) => mockQueryBuilder,
      update: (data: any) => mockQueryBuilder,
      delete: () => mockQueryBuilder,
      eq: (column: string, value: any) => mockQueryBuilder,
      neq: (column: string, value: any) => mockQueryBuilder,
      gt: (column: string, value: any) => mockQueryBuilder,
      gte: (column: string, value: any) => mockQueryBuilder,
      lt: (column: string, value: any) => mockQueryBuilder,
      lte: (column: string, value: any) => mockQueryBuilder,
      like: (column: string, pattern: string) => mockQueryBuilder,
      ilike: (column: string, pattern: string) => mockQueryBuilder,
      is: (column: string, value: any) => mockQueryBuilder,
      in: (column: string, values: any[]) => mockQueryBuilder,
      contains: (column: string, value: any) => mockQueryBuilder,
      containedBy: (column: string, value: any) => mockQueryBuilder,
      or: (filters: string) => mockQueryBuilder,
      filter: (column: string, operator: string, value: any) => mockQueryBuilder,
      match: (query: object) => mockQueryBuilder,
      not: (column: string, operator: string, value: any) => mockQueryBuilder,
      order: (column: string, options?: any) => mockQueryBuilder,
      limit: (count: number) => mockQueryBuilder,
      range: (from: number, to: number) => mockQueryBuilder,
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (onfulfilled?: any, onrejected?: any) => 
        Promise.resolve({ data: [], error: null }).then(onfulfilled, onrejected),
      catch: (onrejected?: any) => 
        Promise.resolve({ data: [], error: null }).catch(onrejected),
      finally: (onfinally?: any) => 
        Promise.resolve({ data: [], error: null }).finally(onfinally)
    }

    return {
      auth: {
        getUser: async () => ({ 
          data: { user: { id: 'localhost-user', email: 'test@localhost' } }, 
          error: null 
        }),
        signOut: async () => ({ error: null })
      },
      from: (table: string) => mockQueryBuilder
    } as any
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}