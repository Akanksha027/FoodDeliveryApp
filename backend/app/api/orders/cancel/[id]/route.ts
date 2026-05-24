// backend/app/api/orders/cancel/[id]/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function PUT(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if the order is already delivered or cancelled
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return withCors({ error: 'Order not found' }, 404);
    }

    if (order.status === 'delivered') {
      return withCors({ error: 'Delivered orders cannot be cancelled' }, 400);
    }

    const { data: updatedOrder, error } = await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return withCors({ error: error.message }, 500);
    }

    return withCors(updatedOrder);
  } catch (err: any) {
    return withCors({ error: err.message }, 500);
  }
}
