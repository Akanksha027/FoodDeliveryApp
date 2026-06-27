// backend/app/api/promocodes/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req: NextRequest) {
  const { data, error } = await supabaseAdmin
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return withCors({ error: error.message }, 500);
  return withCors(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, discount_type, discount_value, min_order_value, active = true } = body;

    if (!code || !discount_type || discount_value === undefined) {
      return withCors(
        { error: 'code, discount_type, and discount_value are required' },
        400
      );
    }

    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .insert([{
        code: code.toUpperCase().trim(),
        discount_type,
        discount_value: parseFloat(discount_value),
        min_order_value: min_order_value ? parseFloat(min_order_value) : 0,
        active,
      }])
      .select()
      .single();

    if (error) return withCors({ error: error.message }, 500);
    return withCors(data, 201);
  } catch (err: any) {
    return withCors({ error: err.message }, 500);
  }
}
