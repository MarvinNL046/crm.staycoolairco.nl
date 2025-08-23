import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
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
      quotes.map(async (quote) => {
        const { data: items } = await supabase
          .from('quote_items')
          .select('*')
          .eq('quote_id', quote.id)
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
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();

    // Get current user and tenant
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, tenant_users!inner(tenant_id)')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.tenant_users?.[0]?.tenant_id) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 400 }
      );
    }

    const tenant_id = profile.tenant_users[0].tenant_id;

    // Generate quote number
    const { data: quoteNumber } = await supabase
      .rpc('generate_quote_number', { p_tenant_id: tenant_id });

    // Extract items from body
    const { items, ...quoteData } = body;

    // Create quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        ...quoteData,
        quote_number: quoteNumber,
        tenant_id,
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
        tenant_id,
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