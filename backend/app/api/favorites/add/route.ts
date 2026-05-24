// backend/app/api/favorites/add/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer_id, menu_item_id } = body;

    if (!customer_id || !menu_item_id) {
      return withCors({ error: 'customer_id and menu_item_id are required' }, 400);
    }

    const { data, error } = await supabaseAdmin
      .from('favorites')
      .insert([{ customer_id, menu_item_id }])
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (already favorited)
      if (error.code === '23505') {
        return withCors({ message: 'Already in favorites' }, 200);
      }
      return withCors({ error: error.message }, 500);
    }

    return withCors(data, 201);
  } catch (err: any) {
    return withCors({ error: err.message }, 500);
  }
}
