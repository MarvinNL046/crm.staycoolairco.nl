import { NextResponse } from 'next/server'
import { Invoice } from '@/models/invoice'

export async function POST(request, { params }) {
  try {
    const data = await request.json()
    const item = await Invoice.addItem(params.id, data)
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}