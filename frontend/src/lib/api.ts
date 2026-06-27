// src/lib/api.ts
// Central API helper — all frontend → backend calls go through here

// On native (iOS/Android), always use the full backend URL.
// On web, the browser needs a full absolute URL// Use the deployed Vercel URL
const BACKEND = 'https://food-delivery-app-beta-wheat.vercel.app';

const defaultHeaders = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
};

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BACKEND}${path}`, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ─── MENU ────────────────────────────────────────────────────────
/** GET /api/menu — all available menu items */
export const getMenu = () => request('/api/menu');

/** GET /api/menu/:id — single menu item */
export const getMenuItem = (id: string) => request(`/api/menu/${id}`);

/** GET /api/menu/category/:cat — items by category */
export const getMenuByCategory = (category: string) =>
  request(`/api/menu/category/${encodeURIComponent(category)}`);

/** POST /api/menu — add item (admin only) */
export const addMenuItem = (item: {
  name: string;
  description?: string;
  price: number;
  category?: string;
  image_url?: string;
}) => request('/api/menu', { method: 'POST', body: JSON.stringify(item) });

/** DELETE /api/menu/:id — remove item (admin only) */
export const deleteMenuItem = (id: string) =>
  request(`/api/menu/${id}`, { method: 'DELETE' });

/** PATCH /api/menu/:id — update item (admin only) */
export const updateMenuItem = (id: string, updates: object) =>
  request(`/api/menu/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });

// ─── ADDRESSES ────────────────────────────────────────────────────
/** POST /api/address/add — add delivery address */
export const addAddress = (address: {
  customer_id: string;
  receiver_name: string;
  phone_number: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  is_default?: boolean;
}) => request('/api/address/add', { method: 'POST', body: JSON.stringify(address) });

/** GET /api/address?customer_id=X — fetch user addresses */
export const getAddresses = (customerId: string) =>
  request(`/api/address?customer_id=${customerId}`);

/** PUT /api/address/:id — update address by ID */
export const updateAddress = (id: string, address: object) =>
  request(`/api/address/${id}`, { method: 'PUT', body: JSON.stringify(address) });

/** DELETE /api/address/:id — delete address by ID */
export const deleteAddress = (id: string) =>
  request(`/api/address/${id}`, { method: 'DELETE' });

// ─── FAVORITES ───────────────────────────────────────────────────
/** GET /api/favorites?customer_id=X — fetch user's favorite items */
export const getFavorites = (customerId: string) =>
  request(`/api/favorites?customer_id=${customerId}`);

/** POST /api/favorites/add — add item to favorites */
export const addFavorite = (customerId: string, menuItemId: string) =>
  request('/api/favorites/add', {
    method: 'POST',
    body: JSON.stringify({ customer_id: customerId, menu_item_id: menuItemId }),
  });

/** DELETE /api/favorites/remove?customer_id=X&menu_item_id=Y — remove favorite */
export const removeFavorite = (customerId: string, menuItemId: string) =>
  request(`/api/favorites/remove?customer_id=${customerId}&menu_item_id=${menuItemId}`, { method: 'DELETE' });

// ─── CART ────────────────────────────────────────────────────────
/** GET /api/cart?customer_id=X — fetch cart with full item details */
export const getCart = (customerId: string) =>
  request(`/api/cart?customer_id=${customerId}`);

/** POST /api/cart/add — add or increment item in cart */
export const addToCart = (customerId: string, menuItemId: string, quantity = 1) =>
  request('/api/cart/add', {
    method: 'POST',
    body: JSON.stringify({ customer_id: customerId, menu_item_id: menuItemId, quantity }),
  });

/** PUT /api/cart/update/:itemId — update cart item quantity (0 = remove) */
export const updateCartItem = (itemId: string, customerId: string, quantity: number) =>
  request(`/api/cart/update/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ customer_id: customerId, quantity }),
  });

/** DELETE /api/cart/remove/:itemId — remove item from cart */
export const removeCartItem = (itemId: string, customerId: string) =>
  request(`/api/cart/remove/${itemId}?customer_id=${customerId}`, { method: 'DELETE' });

/** DELETE /api/cart/clear?customer_id=X — clear user's cart */
export const clearCart = (customerId: string) =>
  request(`/api/cart/clear?customer_id=${customerId}`, { method: 'DELETE' });

// ─── ORDERS ──────────────────────────────────────────────────────
/** GET /api/orders — all orders (admin) */
export const getAllOrders = () => request('/api/orders');

/** GET /api/orders?customer_id=X — my orders (customer) */
export const getMyOrders = (customerId: string) =>
  request(`/api/orders?customer_id=${customerId}`);

/** GET /api/orders/:id — single order details */
export const getOrderById = (id: string) => request(`/api/orders/${id}`);

/** POST /api/orders/create — place a new order */
export const createOrder = (order: {
  customer_id: string;
  customer_email: string;
  items: { menu_item_id: string; name: string; price: number; quantity: number }[];
  total: number;
  address_id?: string;
  payment_status?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  promo_code?: string;
  discount_amount?: number;
}) => request('/api/orders/create', { method: 'POST', body: JSON.stringify(order) });

/** PUT /api/orders/cancel/:id — cancel order */
export const cancelOrder = (id: string) =>
  request(`/api/orders/cancel/${id}`, { method: 'PUT' });

/** PATCH /api/orders/:id — update status (admin) */
export const updateOrderStatus = (orderId: string, status: string) =>
  request(`/api/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

// ─── PROMO CODES ──────────────────────────────────────────────────
/** GET /api/promocodes — fetch all promo codes */
export const getPromoCodes = () => request('/api/promocodes');

/** POST /api/promocodes — create promo code */
export const createPromoCode = (promo: {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value?: number;
  active?: boolean;
}) => request('/api/promocodes', { method: 'POST', body: JSON.stringify(promo) });

/** POST /api/promocodes/validate — validate a promo code */
export const validatePromoCode = (code: string, cartValue: number) =>
  request('/api/promocodes/validate', {
    method: 'POST',
    body: JSON.stringify({ code, cartValue }),
  });

/** DELETE /api/promocodes/:id — delete a promo code */
export const deletePromoCode = (id: string) =>
  request(`/api/promocodes/${id}`, { method: 'DELETE' });

/** PATCH /api/promocodes/:id — toggle promo code active status */
export const togglePromoCode = (id: string, active: boolean) =>
  request(`/api/promocodes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });

// ─── PAYMENT ─────────────────────────────────────────────────────
/** POST /api/payment/create-order — initiate payment */
export const createPaymentOrder = (amount: number, currency = 'INR', receipt?: string) =>
  request('/api/payment/create-order', {
    method: 'POST',
    body: JSON.stringify({ amount, currency, receipt }),
  });

/** POST /api/payment/verify — verify signature after payment */
export const verifyPayment = (paymentData: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => request('/api/payment/verify', { method: 'POST', body: JSON.stringify(paymentData) });
