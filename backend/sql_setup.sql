-- C:\Users\Akanksha Singh\OneDrive\Desktop\FoodDeliveryProject\FoodDeliveryApp\backend\sql_setup.sql
-- Run this script in the Supabase SQL Editor to configure all tables.

-- 1. Create Menu Items Table (if not exists)
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  category TEXT DEFAULT 'Main Course',
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Addresses Table
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  receiver_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'India',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Cart Items Table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  customer_email TEXT,
  items JSONB NOT NULL, -- list of items ordered: [{menu_item_id, name, price, quantity}]
  total NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','preparing','ready','delivered','cancelled')),
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Disable Row Level Security (RLS) for easy development
-- Because Next.js backend handles all operations using service_role bypass keys securely.
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- 5. Create Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, menu_item_id)
);
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;

-- 6. Insert Mock Menu Data (if empty)
INSERT INTO menu_items (name, description, price, category) VALUES
  ('Classic Veg Burger', 'Juicy veg patty with cheese and lettuce', 129, 'Burgers'),
  ('Cheesy Chicken Burger', 'Crispy chicken patty with double cheese', 179, 'Burgers'),
  ('Pizza Margherita', 'Classic tomato, mozzarella and fresh basil', 249, 'Pizza'),
  ('Farmhouse Pizza', 'Loaded with fresh capsicum, onion, tomato, and mushrooms', 329, 'Pizza'),
  ('Paneer Butter Masala', 'Rich cottage cheese in creamy tomato gravy', 219, 'Main Course'),
  ('Dal Makhani', 'Slow-cooked black lentils with cream and butter', 189, 'Main Course'),
  ('Garlic Naan', 'Soft clay oven bread with minced garlic', 49, 'Breads'),
  ('Crispy French Fries', 'Golden salted fries served with ketchup', 99, 'Sides'),
  ('Chocolaty Brownie', 'Fudgy chocolate brownie with chocolate sauce', 119, 'Desserts'),
  ('Chilled Cold Coffee', 'Rich coffee blended with vanilla ice cream', 139, 'Beverages');

-- 7. Create Kitchen Location Table (dynamic store settings)
CREATE TABLE IF NOT EXISTS kitchen_location (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE kitchen_location DISABLE ROW LEVEL SECURITY;

-- Insert default Ghaziabad center coordinates as seed
INSERT INTO kitchen_location (address, latitude, longitude)
VALUES ('Ghaziabad Center, Uttar Pradesh, India', 28.6692, 77.4538)
ON CONFLICT DO NOTHING;
