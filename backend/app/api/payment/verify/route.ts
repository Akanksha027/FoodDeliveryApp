// backend/app/api/payment/verify/route.ts
import { NextRequest } from 'next/server';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return withCors({ error: 'razorpay_order_id and razorpay_payment_id are required' }, 400);
    }

    // Since we are mocking payment validation, we return success automatically.
    // If the developer wants real integration, they can configure secret keys and use HMAC.
    return withCors({
      success: true,
      message: 'Payment verified successfully',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
    });
  } catch (err: any) {
    return withCors({ error: err.message }, 500);
  }
}
