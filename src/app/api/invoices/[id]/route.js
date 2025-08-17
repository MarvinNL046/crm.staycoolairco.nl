import { NextResponse } from 'next/server'
import { Invoice } from '@/models/invoice'

export async function GET(request, { params }) {
  try {
    const invoice = await Invoice.getById(params.id)
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(invoice)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const data = await request.json()
    const invoice = await Invoice.update(params.id, data)
    return NextResponse.json(invoice)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    await Invoice.delete(params.id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}