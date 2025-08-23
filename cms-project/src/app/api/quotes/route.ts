import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest, createUnauthorizedResponse } from '@/lib/auth/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Check if we're on localhost for development
  const host = request.headers.get('host') || ''
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
  
  if (isLocalhost) {
    // Return mock data for localhost
    return NextResponse.json([
      {
        id: '1',
        quote_number: 'Q-2024-001',
        title: 'Airco installatie - Kantoor ABC',
        status: 'draft',
        total_amount: 4500,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        customer_name: 'ABC Company',
        customer_email: 'info@abc.com',
        created_at: new Date().toISOString(),
        tenant_id: 'localhost-tenant',
        items: [
          {
            id: '1',
            description: 'Daikin Split Unit 3.5kW',
            quantity: 2,
            unit_price: 1500,
            total: 3000
          },
          {
            id: '2',
            description: 'Installatie & montage',
            quantity: 1,
            unit_price: 1500,
            total: 1500
          }
        ]
      },
      {
        id: '2',
        quote_number: 'Q-2024-002',
        title: 'Onderhoud contract - Restaurant XYZ',
        status: 'sent',
        total_amount: 1200,
        valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        customer_name: 'Restaurant XYZ',
        customer_email: 'manager@xyz.nl',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        tenant_id: 'localhost-tenant',
        items: [
          {
            id: '3',
            description: 'Jaarlijks onderhoudscontract - 4 units',
            quantity: 1,
            unit_price: 1200,
            total: 1200
          }
        ]
      },
      {
        id: '3',
        quote_number: 'Q-2024-003',
        title: 'VRF systeem - Hotel Plaza',
        status: 'accepted',
        total_amount: 25000,
        valid_until: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        customer_name: 'Hotel Plaza',
        customer_email: 'facilities@hotelplaza.com',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        tenant_id: 'localhost-tenant',
        items: [
          {
            id: '4',
            description: 'Mitsubishi VRF buitenunit',
            quantity: 1,
            unit_price: 8000,
            total: 8000
          },
          {
            id: '5',
            description: 'Mitsubishi binnenunit - wandmodel',
            quantity: 10,
            unit_price: 1200,
            total: 12000
          },
          {
            id: '6',
            description: 'Installatie, leidingwerk & inbedrijfstelling',
            quantity: 1,
            unit_price: 5000,
            total: 5000
          }
        ]
      }
    ])
  }

  try {
    // SECURITY: Authenticate user and get tenant
    const authResult = await authenticateApiRequest(request);
    if ('error' in authResult) {
      return createUnauthorizedResponse(authResult.error, authResult.status);
    }

    const { supabase, tenantId } = authResult;
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    // Build query
    let query = supabase
      .from('quotes')
      .select(`
        *,
        items:quote_items(count),
        customer:customers(id, name, email),
        contact:contacts(id, first_name, last_name, email),
        lead:leads(id, name, email)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`
        quote_number.ilike.%${search}%,
        title.ilike.%${search}%,
        customer_name.ilike.%${search}%,
        customer_email.ilike.%${search}%
      `);
    }

    const { data: quotes, error } = await query;

    if (error) {
      console.error('Error fetching quotes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quotes' },
        { status: 500 }
      );
    }

    // Get items for each quote
    const quotesWithItems = await Promise.all(
      (quotes || []).map(async (quote: any) => {
        const { data: items } = await supabase
          .from('quote_items')
          .select('*')
          .eq('quote_id', quote.id)
          .eq('tenant_id', tenantId)
          .order('sort_order', { ascending: true });

        return {
          ...quote,
          items: items || []
        };
      })
    );

    return NextResponse.json(quotesWithItems);
  } catch (error) {
    console.error('Error in quotes GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Check if we're on localhost for development
  const host = request.headers.get('host') || ''
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
  
  if (isLocalhost) {
    // Return mock created quote for localhost
    const body = await request.json();
    return NextResponse.json({
      id: 'new-quote-id',
      quote_number: 'Q-2024-004',
      ...body,
      tenant_id: 'localhost-tenant',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { status: 201 });
  }

  try {
    // SECURITY: Authenticate user and get tenant
    const authResult = await authenticateApiRequest(request);
    if ('error' in authResult) {
      return createUnauthorizedResponse(authResult.error, authResult.status);
    }

    const { supabase, tenantId, user } = authResult;
    const body = await request.json();

    // Generate quote number
    const { data: quoteNumber } = await supabase
      .rpc('generate_quote_number', { p_tenant_id: tenantId });

    // Extract items from body
    const { items, ...quoteData } = body;

    // Create quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        ...quoteData,
        quote_number: quoteNumber,
        tenant_id: tenantId,
        created_by: user.id,
        status: quoteData.status || 'draft'
      })
      .select()
      .single();

    if (quoteError) {
      console.error('Error creating quote:', quoteError);
      return NextResponse.json(
        { error: 'Failed to create quote' },
        { status: 500 }
      );
    }

    // Create quote items if provided
    if (items && items.length > 0) {
      const quoteItems = items.map((item: any, index: number) => ({
        ...item,
        quote_id: quote.id,
        tenant_id: tenantId,
        sort_order: index
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItems);

      if (itemsError) {
        console.error('Error creating quote items:', itemsError);
        // Rollback by deleting the quote
        await supabase.from('quotes').delete().eq('id', quote.id);
        return NextResponse.json(
          { error: 'Failed to create quote items' },
          { status: 500 }
        );
      }
    }

    // Fetch complete quote with items
    const { data: completeQuote } = await supabase
      .from('quotes')
      .select(`
        *,
        items:quote_items(*)
      `)
      .eq('id', quote.id)
      .eq('tenant_id', tenantId)
      .single();

    return NextResponse.json(completeQuote, { status: 201 });
  } catch (error) {
    console.error('Error in quotes POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // Check if we're on localhost for development
  const host = request.headers.get('host') || ''
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
  
  if (isLocalhost) {
    // Return mock updated quote for localhost
    const body = await request.json();
    return NextResponse.json({
      ...body,
      updated_at: new Date().toISOString()
    });
  }

  try {
    // SECURITY: Authenticate user and get tenant
    const authResult = await authenticateApiRequest(request);
    if ('error' in authResult) {
      return createUnauthorizedResponse(authResult.error, authResult.status);
    }

    const { supabase, tenantId } = authResult;
    const body = await request.json();
    const { id, items, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    // Update quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (quoteError) {
      console.error('Error updating quote:', quoteError);
      return NextResponse.json(
        { error: 'Failed to update quote' },
        { status: 500 }
      );
    }

    // Update items if provided
    if (items) {
      // Delete existing items
      await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', id)
        .eq('tenant_id', tenantId);

      // Insert new items
      if (items.length > 0) {
        const quoteItems = items.map((item: any, index: number) => ({
          ...item,
          quote_id: id,
          tenant_id: tenantId,
          sort_order: index
        }));

        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(quoteItems);

        if (itemsError) {
          console.error('Error updating quote items:', itemsError);
          return NextResponse.json(
            { error: 'Failed to update quote items' },
            { status: 500 }
          );
        }
      }
    }

    // Fetch complete updated quote
    const { data: completeQuote } = await supabase
      .from('quotes')
      .select(`
        *,
        items:quote_items(*)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    return NextResponse.json(completeQuote);
  } catch (error) {
    console.error('Error in quotes PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Check if we're on localhost for development
  const host = request.headers.get('host') || ''
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
  
  if (isLocalhost) {
    // Return success for localhost
    return NextResponse.json({ success: true });
  }

  try {
    // SECURITY: Authenticate user and get tenant
    const authResult = await authenticateApiRequest(request);
    if ('error' in authResult) {
      return createUnauthorizedResponse(authResult.error, authResult.status);
    }

    const { supabase, tenantId } = authResult;
    
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    // Delete quote (items will be cascade deleted)
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Error deleting quote:', error);
      return NextResponse.json(
        { error: 'Failed to delete quote' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in quotes DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}