// backend/app/api/cart/remove/[itemId]/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const { searchParams } = new URL(req.url);
    let customerId = searchParams.get('customer_id');

    // Also support reading from body if not in query string (safe check)
    if (!customerId) {
      try {
        const body = await req.json();
        customerId = body.customer_id;
      } catch (e) {
        // Body reading failed, move on
      }
    }

    if (!customerId) {
      return withCors({ error: 'customer_id is required' }, 400);
    }

    // Try deleting by cart ID first
    let { data: cartItem, error: fetchError } = await supabaseAdmin
      .from('cart_items')
      .select('id')
      .eq('customer_id', customerId)
      .eq('id', itemId)
      .maybeSingle();

    // If not found, try by menu_item_id
    if (!cartItem) {
      const { data: menuCartItem } = await supabaseAdmin
        .from('cart_items')
        .select('id')
        .eq('customer_id', customerId)
        .eq('menu_item_id', itemId)
        .maybeSingle();
      
      cartItem = menuCartItem;
    }

    if (!cartItem) {
      return withCors({ error: 'Cart item not found' }, 404);
    }

    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('id', cartItem.id);

    if (error) {
      return withCors({ error: error.message }, 500);
    }

    return withCors({ success: true, message: 'Item removed from cart' });
  } catch (err: any) {
    return withCors({ error: err.message }, 500);
  }
}
