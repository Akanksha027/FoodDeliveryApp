// backend/app/api/favorites/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customer_id = searchParams.get('customer_id');

    if (!customer_id) {
      return withCors({ error: 'customer_id is required' }, 400);
    }

    const { data, error } = await supabaseAdmin
      .from('favorites')
      .select('*, menu_items(*)')
      .eq('customer_id', customer_id);

    if (error) return withCors({ error: error.message }, 500);

    return withCors(data, 200);
  } catch (err: any) {
    return withCors({ error: err.message }, 500);
  }
}
