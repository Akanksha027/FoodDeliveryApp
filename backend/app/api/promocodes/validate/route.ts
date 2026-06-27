// backend/app/api/promocodes/validate/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { withCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, cartValue } = body;

    if (!code || cartValue === undefined) {
      return withCors({ error: 'code and cartValue are required' }, 400);
    }

    const { data: promoCode, error } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .maybeSingle();

    if (error || !promoCode) {
      return withCors({ valid: false, reason: 'The promo code entered is invalid.' });
    }

    if (!promoCode.active) {
      return withCors({ valid: false, reason: 'This promo code is no longer active.' });
    }

    const minVal = parseFloat(promoCode.min_order_value);
    const subtotal = parseFloat(cartValue);

    if (subtotal < minVal) {
      return withCors({
        valid: false,
        reason: `Minimum order value for this code is ₹${minVal.toFixed(2)}. Add ₹${(minVal - subtotal).toFixed(2)} more to apply.`
      });
    }

    let discountAmount = 0;
    const discountVal = parseFloat(promoCode.discount_value);

    if (promoCode.discount_type === 'percentage') {
      discountAmount = (subtotal * discountVal) / 100;
    } else {
      // fixed discount
      discountAmount = Math.min(discountVal, subtotal);
    }

    return withCors({
      valid: true,
      code: promoCode.code,
      discountType: promoCode.discount_type,
      discountValue: discountVal,
      discountAmount: parseFloat(discountAmount.toFixed(2))
    });
  } catch (err: any) {
    return withCors({ error: err.message }, 500);
  }
}
