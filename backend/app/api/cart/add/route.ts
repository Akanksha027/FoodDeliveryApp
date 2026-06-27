// backend/app/api/cart/add/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer_id, menu_item_id, quantity = 1 } = body;

    if (!customer_id || !menu_item_id) {
      return withCors({ error: 'customer_id and menu_item_id are required' }, 400);
    }

    // Check if the item already exists in the customer's cart
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('cart_items')
      .select('id, quantity')
      .eq('customer_id', customer_id)
      .eq('menu_item_id', menu_item_id)
      .maybeSingle();

    if (existing) {
      // Update quantity (increment by requested quantity)
      const newQuantity = existing.quantity + quantity;
      const { data, error } = await supabaseAdmin
        .from('cart_items')
        .update({ quantity: newQuantity })
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
  } catch (err: any) {
    return withCors({ error: err.message }, 500);
  }
}
