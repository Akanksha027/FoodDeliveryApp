// backend/app/api/cart/[id]/route.ts
// PATCH  /api/cart/:id — update quantity of a specific cart item
// DELETE /api/cart/:id — remove a specific cart item

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { quantity } = body;

  if (quantity === undefined || quantity < 0) {
    return withCors({ error: 'Valid quantity is required (>= 0)' }, 400);
  }

  // If quantity is 0, remove item entirely
  if (quantity === 0) {
    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('id', params.id);

    if (error) return withCors({ error: error.message }, 500);
    return withCors({ success: true, removed: true });
  }

  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .update({ quantity })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return withCors({ error: error.message }, 500);
  return withCors(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('id', params.id);

  if (error) return withCors({ error: error.message }, 500);
  return withCors({ success: true });
}
