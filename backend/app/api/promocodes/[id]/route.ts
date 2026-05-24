// backend/app/api/promocodes/[id]/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { active } = body;

    if (active === undefined) {
      return withCors({ error: 'active field is required' }, 400);
    }

    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .update({ active })
      .eq('id', id)
      .select()
      .single();

    if (error) return withCors({ error: error.message }, 500);
    return withCors(data);
  } catch (err: any) {
    return withCors({ error: err.message }, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('promo_codes')
      .delete()
      .eq('id', id);

    if (error) return withCors({ error: error.message }, 500);
    return withCors({ success: true });
  } catch (err: any) {
    return withCors({ error: err.message }, 500);
  }
}
