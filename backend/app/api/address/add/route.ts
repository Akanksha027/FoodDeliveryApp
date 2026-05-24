// backend/app/api/address/add/route.ts
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
      receiver_name,
      phone_number,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country = 'India',
      is_default = false,
    } = body;

    if (!customer_id || !receiver_name || !phone_number || !address_line1 || !city || !state || !postal_code) {
      return withCors(
        { error: 'customer_id, receiver_name, phone_number, address_line1, city, state, and postal_code are required' },
        400
      );
    }

    // If is_default is true, un-default other addresses for this user
    if (is_default) {
      await supabaseAdmin
        .from('addresses')
        .update({ is_default: false })
        .eq('customer_id', customer_id);
    }

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .insert([{
        customer_id,
        receiver_name,
        phone_number,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        is_default,
      }])
      .select()
      .single();

    if (error) {
      return withCors({ error: error.message }, 500);
    }

    return withCors(data, 201);
  } catch (err: any) {
    return withCors({ error: err.message }, 500);
  }
}
