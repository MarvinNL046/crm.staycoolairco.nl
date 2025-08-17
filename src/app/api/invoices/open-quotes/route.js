import { NextResponse } from 'next/server'
import { Invoice } from '@/models/invoice'

export async function GET(request) {
  try {
    const quotes = await Invoice.getOpenQuotes()
    return NextResponse.json(quotes)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}