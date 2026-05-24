// backend/lib/cors.ts
// Helper to add CORS headers to all API responses

import { NextResponse, NextRequest } from 'next/server';

const ALLOWED_ORIGINS = [
  'http://localhost:8081',  // Expo web dev server
  'http://localhost:3000',  // Next.js backend itself
  'http://127.0.0.1:8081',
  'http://127.0.0.1:3000',
];

function getCorsHeaders(origin?: string | null) {
  // If origin is in our allowed list OR we allow all, respond with that origin
  // Using '*' still causes issues with some browsers for certain methods,
  // so we explicitly echo back the requesting origin when it's local
  const allowOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : '*';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, ngrok-skip-browser-warning, x-requested-with',
    'Access-Control-Allow-Credentials': 'false',
    'Vary': 'Origin',
  };
}

export const corsHeaders = getCorsHeaders(null);

export function withCors(data: any, status = 200, req?: NextRequest) {
  const origin = req?.headers.get('origin');
  return NextResponse.json(data, { status, headers: getCorsHeaders(origin) });
}

export function handleOptions(req?: NextRequest) {
  const origin = req?.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}
