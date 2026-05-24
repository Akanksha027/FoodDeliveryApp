// backend/app/api/cart/route.ts
// GET  /api/cart?customer_id=X  — fetch user's cart with menu item details
// POST /api/cart                — add item to cart (or increment qty if exists)
// DELETE /api/cart?customer_id=X — clear entire cart (called after order placed)

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customer_id');

  if (!customerId) {
    return withCors({ error: 'customer_id query param required' }, 400);
  }

  // Join with menu_items to get full item details
  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .select(`
      id,
      quantity,
      menu_item_id,
      menu_items (
        id,
        name,
        description,
        price,
        image_url
      )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: true });

  if (error) return withCors({ error: error.message }, 500);

  // Flatten for easy frontend use
  const cart = (data ?? []).map((item: any) => ({
    cart_item_id: item.id,
    quantity: item.quantity,
    ...item.menu_items,
  }));

  return withCors(cart);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { customer_id, menu_item_id, quantity = 1 } = body;

  if (!customer_id || !menu_item_id) {
    return withCors({ error: 'customer_id and menu_item_id are required' }, 400);
  }

  // Check if item already exists in cart
  const { data: existing } = await supabaseAdmin
    .from('cart_items')
    .select('id, quantity')
    .eq('customer_id', customer_id)
    .eq('menu_item_id', menu_item_id)
    .maybeSingle();

  if (existing) {
    // Increment quantity
    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) return withCors({ error: error.message }, 500);
    return withCors({ ...data, updated: true });
  }

  // Insert new cart item
  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .insert([{ customer_id, menu_item_id, quantity }])
    .select()
    .single();

  if (error) return withCors({ error: error.message }, 500);
  return withCors(data, 201);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customer_id');

  if (!customerId) {
    return withCors({ error: 'customer_id query param required' }, 400);
  }

  const { error } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('customer_id', customerId);

  if (error) return withCors({ error: error.message }, 500);
  return withCors({ success: true, message: 'Cart cleared' });
}
