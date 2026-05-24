// backend/app/api/cart/update/[itemId]/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params; // This can be the menu_item_id or the cart_item_id
    const body = await req.json();
    const { customer_id, quantity } = body;

    if (!customer_id || quantity === undefined) {
      return withCors({ error: 'customer_id and quantity are required' }, 400);
    }

    if (quantity < 0) {
      return withCors({ error: 'Quantity must be greater than or equal to 0' }, 400);
    }

    // Attempt 1: Find by cart item ID first
    let query = supabaseAdmin
      .from('cart_items')
      .select('id, quantity')
      .eq('customer_id', customer_id)
      .eq('id', itemId)
      .maybeSingle();

    let { data: cartItem, error: fetchError } = await query;

    // Attempt 2: If not found, try finding by menu_item_id
    if (!cartItem) {
      const { data: menuCartItem } = await supabaseAdmin
        .from('cart_items')
        .select('id, quantity')
        .eq('customer_id', customer_id)
        .eq('menu_item_id', itemId)
        .maybeSingle();
      
      cartItem = menuCartItem;
    }

    if (!cartItem) {
      return withCors({ error: 'Cart item not found' }, 404);
    }

    // If quantity is 0, delete the item
    if (quantity === 0) {
      const { error } = await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('id', cartItem.id);

      if (error) return withCors({ error: error.message }, 500);
      return withCors({ success: true, message: 'Item removed from cart', removed: true });
    }

    // Otherwise update quantity
    const { data: updated, error } = await supabaseAdmin
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItem.id)
      .select()
      .single();

    if (error) return withCors({ error: error.message }, 500);
    return withCors(updated);
  } catch (err: any) {
    return withCors({ error: err.message }, 500);
  }
}
