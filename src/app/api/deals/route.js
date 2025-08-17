import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    // For now, return empty array since deals table might not exist yet
    // In the future, this would fetch from a dedicated deals table
    return NextResponse.json([])
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}