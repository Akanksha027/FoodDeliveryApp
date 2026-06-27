// backend/app/api/kitchen/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

// GET /api/kitchen — fetch the active storefront address and coordinates
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('kitchen_location')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    return withCors({ error: error.message }, 500);
  }

  // Fallback to default Ghaziabad center if database is empty
  const activeLocation = data && data[0] ? data[0] : {
    address: 'Ghaziabad Center, Uttar Pradesh, India',
    latitude: 28.6692,
    longitude: 77.4538
  };

  return withCors(activeLocation);
}

// POST /api/kitchen — configure new storefront address and coordinates (Admin only)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, latitude, longitude } = body;

    if (!address || latitude === undefined || longitude === undefined) {
      return withCors({ error: 'address, latitude, and longitude are required' }, 400);
    }

    const { data, error } = await supabaseAdmin
      .from('kitchen_location')
      .insert([{
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        updated_at: new Date().toISOString()
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
