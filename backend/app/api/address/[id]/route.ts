// backend/app/api/address/[id]/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      receiver_name,
      phone_number,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      is_default,
      customer_id,
    } = body;

    // Check if the address exists
    const { data: existingAddress, error: findError } = await supabaseAdmin
      .from('addresses')
      .select('customer_id')
      .eq('id', id)
      .single();

    if (findError || !existingAddress) {
      return withCors({ error: 'Address not found' }, 404);
    }

    const userId = customer_id || existingAddress.customer_id;

    // If is_default is true, un-default other addresses for this user
    if (is_default && userId) {
      await supabaseAdmin
        .from('addresses')
        .update({ is_default: false })
        .eq('customer_id', userId);
    }

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .update({
        receiver_name,
        phone_number,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        is_default,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return withCors({ error: error.message }, 500);
    }

    return withCors(data);
  } catch (err: any) {
    return withCors({ error: err.message }, 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('addresses')
      .delete()
      .eq('id', id);

    if (error) {
      return withCors({ error: error.message }, 500);
    }

    return withCors({ success: true, message: 'Address deleted successfully' });
  } catch (err: any) {
    return withCors({ error: err.message }, 500);
  }
}
