// backend/app/api/favorites/remove/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customer_id = searchParams.get('customer_id');
    const menu_item_id = searchParams.get('menu_item_id');

    if (!customer_id || !menu_item_id) {
      return withCors({ error: 'customer_id and menu_item_id are required' }, 400);
    }

    const { data, error } = await supabaseAdmin
      .from('favorites')
      .delete()
      .match({ customer_id, menu_item_id })
      .select();

    if (error) return withCors({ error: error.message }, 500);

    return withCors(data, 200);
  } catch (err: any) {
    return withCors({ error: err.message }, 500);
  }
}
