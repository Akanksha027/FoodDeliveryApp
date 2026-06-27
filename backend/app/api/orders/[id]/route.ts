// backend/app/api/orders/[id]/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

const VALID_STATUSES = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, addresses(*)')
    .eq('id', id)
    .single();

  if (error) return withCors({ error: error.message }, 404);
  return withCors(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json();
  const { status } = body;

  if (!VALID_STATUSES.includes(status)) {
    return withCors(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      400
    );
  }

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) return withCors({ error: error.message }, 500);
  return withCors(data);
}
