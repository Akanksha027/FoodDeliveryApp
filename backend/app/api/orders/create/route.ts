// backend/app/api/orders/create/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customer_id,
      customer_email,
      items,
      total,
      address_id,
      payment_status = 'pending',
      razorpay_order_id = null,
      razorpay_payment_id = null,
    } = body;

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
        items: typeof items === 'string' ? JSON.parse(items) : items,
        total,
        status: 'pending',
        address_id,
        payment_status,
        razorpay_order_id,
        razorpay_payment_id,
      }])
      .select()
      .single();

    if (error) {
      return withCors({ error: error.message }, 500);
    }

    // Automatically clear user's cart on order creation
    await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('customer_id', customer_id);

    return withCors(data, 201);
  } catch (err: any) {
    return withCors({ error: err.message }, 500);
  }
}
