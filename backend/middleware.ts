// backend/middleware.ts
// Adds CORS headers to all /api/* routes so Expo Web (localhost:8081) can call them

import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'http://localhost:8081',
  'http://localhost:3000',
  'http://10.0.0.0/8', // local network for physical device
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o.split('/')[0] + '//' + o.split('/')[2]))
    ? origin
    : '*'; // fallback: allow all (fine for dev)

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, ngrok-skip-browser-warning',
    'Access-Control-Max-Age': '86400',
  };
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }

  // For all other requests, let them pass through but add CORS headers to response
  const response = NextResponse.next();
  const corsHeaders = getCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  // Only run middleware on API routes
  matcher: '/api/:path*',
};
