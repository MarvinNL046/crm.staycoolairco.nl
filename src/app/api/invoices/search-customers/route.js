import { NextResponse } from 'next/server'
import { Invoice } from '@/models/invoice'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('q')
    
    if (!search) {
      return NextResponse.json({ leads: [], contacts: [] })
    }

    const results = await Invoice.searchCustomers(search)
    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}