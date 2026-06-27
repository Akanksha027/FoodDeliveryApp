// backend/app/api/address/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
      return withCors({ error: 'customer_id is required' }, 400);
    }

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      return withCors({ error: error.message }, 500);
    }

    return withCors(data ?? []);
  } catch (err: any) {
    return withCors({ error: err.message }, 500);
  }
}
