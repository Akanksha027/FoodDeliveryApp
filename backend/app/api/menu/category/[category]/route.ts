// backend/app/api/menu/category/[category]/route.ts
// GET /api/menu/category/:category — fetch menu items by category (public)

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory).toLowerCase();

  const { data, error } = await supabaseAdmin
    .from('menu_items')
    .select('*')
    .ilike('category', category) // case-insensitive match
    .eq('available', true)
    .order('created_at', { ascending: true });

  if (error) return withCors({ error: error.message }, 500);
  return withCors(data ?? []);
}
