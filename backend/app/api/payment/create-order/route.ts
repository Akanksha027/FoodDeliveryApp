// backend/app/api/payment/create-order/route.ts
import { NextRequest } from 'next/server';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency = 'INR', receipt = `receipt_${Date.now()}` } = body;

    if (!amount) {
      return withCors({ error: 'amount is required' }, 400);
    }

    // Razorpay amount is in paise (e.g. 100 Rs = 10000 Paise)
    // If the amount is passed in Rs, we convert it to Paise.
    // We assume if it's less than 10000, it might be in Rupees, but let's just use what they pass.
    const amountInPaise = amount * 100;

    // Generate a secure-looking mock Razorpay order ID
    const randomSuffix = Math.random().toString(36).substring(2, 12).toUpperCase();
    const orderId = `order_${randomSuffix}`;

    const mockOrder = {
      id: orderId,
      entity: 'order',
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency: currency,
      receipt: receipt,
      status: 'created',
      attempts: 0,
      notes: [],
      created_at: Math.floor(Date.now() / 1000),
    };

    return withCors(mockOrder, 201);
  } catch (err: any) {
    return withCors({ error: err.message }, 500);
  }
}
