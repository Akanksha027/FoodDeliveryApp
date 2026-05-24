// backend/app/api/orders/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customer_id');

  let query = supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  const { data, error } = await query;
  if (error) return withCors({ error: error.message }, 500);
  return withCors(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { customer_id, customer_email, items, total } = body;

  if (!customer_id || !items || !total) {
    return withCors(
      { error: 'customer_id, items, and total are required' },
      400
    );
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .insert([{
      customer_id,
      customer_email,
      items: JSON.stringify(items),
      total,
      status: 'pending',
    }])
    .select()
    .single();

  if (error) return withCors({ error: error.message }, 500);
  return withCors(data, 201);
}
