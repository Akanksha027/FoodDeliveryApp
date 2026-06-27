// backend/app/api/menu/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('menu_items')
    .select('*')
    .eq('available', true)
    .order('created_at', { ascending: true });

  if (error) return withCors({ error: error.message }, 500);
  return withCors(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, price, image_url, category, recommendations } = body;

  if (!name || !price) {
    return withCors({ error: 'name and price are required' }, 400);
  }

  const { data, error } = await supabaseAdmin
    .from('menu_items')
    .insert([{
      name,
      description,
      price,
      image_url,
      category,
      recommendations: recommendations || [],
      available: true
    }])
    .select()
    .single();

  if (error) return withCors({ error: error.message }, 500);
  return withCors(data, 201);
}
