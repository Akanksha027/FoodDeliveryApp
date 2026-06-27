// backend/app/api/cart/clear/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let customerId = searchParams.get('customer_id');

    if (!customerId) {
      try {
        const body = await req.json();
        customerId = body.customer_id;
      } catch (e) {
        // Ignore
      }
    }

    if (!customerId) {
      return withCors({ error: 'customer_id is required' }, 400);
    }

    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('customer_id', customerId);

    if (error) {
      return withCors({ error: error.message }, 500);
    }

    return withCors({ success: true, message: 'Cart cleared successfully' });
  } catch (err: any) {
    return withCors({ error: err.message }, 500);
  }
}
