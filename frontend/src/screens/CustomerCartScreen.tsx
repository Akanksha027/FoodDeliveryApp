// src/screens/CustomerCartScreen.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';

const T = {
  bg: '#F5F6FA',
  surface: '#FFFFFF',
  accent: '#FF5A30',
  accentBg: '#FFF4F1',
  dark: '#1C1C2E',
  text: '#111111',
  sub: '#9CA3AF',
  border: '#F0F0F5',
};

const shadow = (elevation = 4) =>
  Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: elevation * 2,
      shadowOffset: { width: 0, height: elevation / 2 },
    },
    android: { elevation },
    default: {},
  });

const getDishImage = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('burger')) return require('../../assets/burger.png');
  if (n.includes('pizza') || n.includes('pasta') || n.includes('arrabiata')) return require('../../assets/pizza.jpg');
  if (n.includes('fries') || n.includes('french')) return require('../../assets/fries.png');
  if (n.includes('coffee') || n.includes('drink') || n.includes('tea') || n.includes('shake') || n.includes('smoothie')) return require('../../assets/drinks.png');
  return require('../../assets/burger.png'); // default fallback
};

export const CustomerCartScreen = ({
  cart,
  recommendedItems,
  promoCode,
  setPromoCode,
  discount,
  addresses,
  selectedAddressId,
  setSelectedAddressId,
  subtotal,
  cartTotal,
  placingOrder,
  handleRemoveItem,
  handleUpdateQty,
  handleAddToCart,
  handleApplyPromo,
  handleCheckout,
  setAddressModalVisible,
  fetchCouponsForUser,
  setCouponsModalVisible,
  setActiveNav,
}: any) => {
  return (
    <View style={s.tabWrapper}>
      <Text style={s.tabTitle}>Shopping Cart</Text>
      <Text style={s.tabSub}>{cart.length} items in your order</Text>

      {cart.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 60, marginBottom: 12 }}>🛒</Text>
          <Text style={s.emptyTxt}>Your cart is empty.</Text>
          <TouchableOpacity style={s.exploreBtn} onPress={() => setActiveNav('home')}>
            <Text style={s.exploreBtnText}>Explore Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={s.cartItemsContainer}>
            {cart.map((item: any) => (
              <View key={item.id} style={s.cartPremiumCard}>
                <View style={s.cartPremiumImageContainer}>
                  <Image source={getDishImage(item.name)} style={s.cartPremiumImage} resizeMode="contain" />
                </View>

                <View style={s.cartPremiumDetails}>
                  <View style={s.cartPremiumHeaderRow}>
                    <Text style={s.cartPremiumName} numberOfLines={1}>{item.name}</Text>
                    <TouchableOpacity onPress={() => handleRemoveItem(item.cart_item_id)}>
                      <Text style={s.cartRemoveIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={s.cartPremiumPrice}>₹{item.price}</Text>

                  <View style={s.cartPremiumQtyRow}>
                    <TouchableOpacity
                      style={s.cartQtyActionBtn}
                      onPress={() => handleUpdateQty(item.cart_item_id, item.quantity, false)}
                    >
                      <Text style={s.cartQtyActionBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={s.cartQtyLabel}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={[s.cartQtyActionBtn, { backgroundColor: '#CCFF00' }]}
                      onPress={() => handleUpdateQty(item.cart_item_id, item.quantity, true)}
                    >
                      <Text style={[s.cartQtyActionBtnText, { color: '#111' }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Recommended Add-ons Section */}
          {recommendedItems.length > 0 && (
            <View style={{ marginVertical: 16 }}>
              <Text style={[s.checkoutSectionTitle, { paddingHorizontal: 16, marginBottom: 10 }]}>
                Complete Your Meal 😋
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                {recommendedItems.map((item: any) => (
                  <View
                    key={item.id}
                    style={{
                      width: 140,
                      backgroundColor: '#fff',
                      borderRadius: 16,
                      padding: 10,
                      borderWidth: 1,
                      borderColor: '#F0F0F5',
                      elevation: 1,
                    }}
                  >
                    <Image
                      source={getDishImage(item.name)}
                      style={{ width: '100%', height: 70, resizeMode: 'contain', marginBottom: 6 }}
                    />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: T.text }} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: T.sub, marginTop: 1 }}>
                      {item.category || 'Add-on'}
                    </Text>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: T.text }}>
                        ₹{item.price}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleAddToCart(item)}
                        style={{
                          backgroundColor: '#CCFF00',
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#111' }}>+ ADD</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Promo Code Section */}
          <View style={s.promoSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={s.checkoutSectionTitle}>Promo Code</Text>
              <TouchableOpacity onPress={() => { fetchCouponsForUser(); setCouponsModalVisible(true); }}>
                <Text style={{ fontSize: 12, color: T.accent, fontWeight: '700', textDecorationLine: 'underline' }}>
                  View All Coupons
                </Text>
              </TouchableOpacity>
            </View>
            <View style={s.promoInputRow}>
              <TextInput
                style={s.promoInput}
                placeholder="Enter promo code (e.g. SAVE15)"
                value={promoCode}
                onChangeText={setPromoCode}
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={s.promoApplyBtn} onPress={handleApplyPromo}>
                <Text style={s.promoApplyBtnTxt}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Delivery Location Carousels */}
          <View style={s.checkoutSection}>
            <Text style={s.checkoutSectionTitle}>Delivery Address</Text>
            {addresses.length === 0 ? (
              <TouchableOpacity
                style={s.checkoutAddAddr}
                onPress={() => {
                  setActiveNav('profile');
                  setAddressModalVisible(true);
                }}
              >
                <Text style={s.checkoutAddAddrText}>➕ Add Delivery Address</Text>
              </TouchableOpacity>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8, paddingHorizontal: 4 }}>
                {addresses.map((addr: any) => (
                  <TouchableOpacity
                    key={addr.id}
                    style={[
                      s.checkoutAddrCard,
                      selectedAddressId === addr.id && s.checkoutAddrCardActive,
                    ]}
                    onPress={() => setSelectedAddressId(addr.id)}
                    activeOpacity={0.8}
                  >
                    <View style={s.checkoutAddrIconWrapper}>
                      <Text style={s.checkoutAddrIcon}>📍</Text>
                    </View>
                    <View>
                      <Text style={[s.checkoutAddrName, selectedAddressId === addr.id && { color: '#000' }]}>
                        {addr.receiver_name}
                      </Text>
                      <Text style={s.checkoutAddrText}>{addr.address_line1}, {addr.city}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Billing Card Details */}
          <View style={s.billingCard}>
            <Text style={s.checkoutSectionTitle}>Payment Summary</Text>
            <View style={s.billingRow}>
              <Text style={s.billingLabel}>Subtotal</Text>
              <Text style={s.billingVal}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <View style={s.billingRow}>
              <Text style={s.billingLabel}>Delivery Fee</Text>
              <Text style={s.billingVal}>₹0.00</Text>
            </View>
            {discount > 0 && (
              <View style={s.billingRow}>
                <Text style={[s.billingLabel, { color: '#00C853' }]}>Discount</Text>
                <Text style={[s.billingVal, { color: '#00C853' }]}>- ₹{discount.toFixed(2)}</Text>
              </View>
            )}
            <View style={[s.billingRow, { borderTopWidth: 1, borderColor: '#F0F0F5', paddingTop: 16, marginTop: 12 }]}>
              <Text style={s.billingTotalLabel}>Total Amount</Text>
              <Text style={s.billingTotalVal}>₹{cartTotal.toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={s.premiumCheckoutBtn}
            onPress={handleCheckout}
            disabled={placingOrder}
            activeOpacity={0.8}
          >
            {placingOrder ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={s.premiumCheckoutBtnTxt}>Checkout • ₹{cartTotal.toFixed(2)}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  tabWrapper: { paddingHorizontal: 16, paddingTop: 12 },
  tabTitle: { fontSize: 22, fontWeight: '900', color: T.text },
  tabSub: { fontSize: 13, color: T.sub, marginTop: 3, marginBottom: 16 },
  empty: { flex: 1, paddingVertical: 32, alignItems: 'center', width: '100%', justifyContent: 'center' },
  emptyTxt: { color: T.sub, fontSize: 14, fontWeight: '600' },
  exploreBtn: { backgroundColor: T.accent, borderRadius: 20, paddingHorizontal: 22, paddingVertical: 10, marginTop: 16 },
  exploreBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  cartItemsContainer: { marginTop: 10, paddingHorizontal: 4 },
  cartPremiumCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, flexDirection: 'row',
    marginBottom: 16, ...shadow(3), alignItems: 'center'
  },
  cartPremiumImageContainer: {
    width: 80, height: 80, borderRadius: 16, backgroundColor: '#F9F9F9',
    justifyContent: 'center', alignItems: 'center', marginRight: 16
  },
  cartPremiumImage: { width: 60, height: 60 },
  cartPremiumDetails: { flex: 1 },
  cartPremiumHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cartPremiumName: { fontSize: 16, fontWeight: '700', color: '#111', flex: 1, marginRight: 8 },
  cartRemoveIcon: { fontSize: 16, color: '#FF3B30', fontWeight: 'bold' },
  cartPremiumPrice: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 12 },
  cartPremiumQtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 20, alignSelf: 'flex-start', padding: 4 },
  cartQtyActionBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
  },
  cartQtyActionBtnText: { color: '#111', fontWeight: 'bold', fontSize: 18 },
  cartQtyLabel: { color: '#111', fontWeight: '800', fontSize: 15, width: 32, textAlign: 'center' },
  checkoutSectionTitle: { fontSize: 15, fontWeight: '800', color: T.text, marginBottom: 8 },
  promoSection: { marginTop: 16 },
  promoInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  promoInput: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, height: 50,
    fontSize: 14, color: '#111', borderWidth: 1, borderColor: '#EEEEEE', marginRight: 12
  },
  promoApplyBtn: { backgroundColor: '#111', height: 50, borderRadius: 16, justifyContent: 'center', paddingHorizontal: 24 },
  promoApplyBtnTxt: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  checkoutSection: { marginTop: 16 },
  checkoutAddAddr: {
    backgroundColor: T.surface, borderStyle: 'dashed', borderWidth: 1.5, borderColor: T.accent,
    borderRadius: 14, padding: 14, alignItems: 'center',
  },
  checkoutAddAddrText: { color: T.accent, fontWeight: '800', fontSize: 13 },
  checkoutAddrCard: {
    backgroundColor: T.surface, borderRadius: 14, padding: 12, marginRight: 10,
    minWidth: 150, borderWidth: 1.5, borderColor: T.border,
    ...shadow(2),
  },
  checkoutAddrCardActive: { borderColor: T.accent, backgroundColor: T.accentBg },
  checkoutAddrIconWrapper: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F0F5',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8
  },
  checkoutAddrIcon: { fontSize: 16 },
  checkoutAddrName: { color: T.text, fontWeight: '800', fontSize: 13, marginBottom: 4 },
  checkoutAddrText: { color: T.sub, fontSize: 11 },
  billingCard: { backgroundColor: T.surface, borderRadius: 18, padding: 16, marginTop: 16, ...shadow(3) },
  billingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billingLabel: { color: T.sub, fontSize: 13 },
  billingVal: { color: T.text, fontWeight: '700', fontSize: 13 },
  billingTotalLabel: { color: T.text, fontSize: 15, fontWeight: '800' },
  billingTotalVal: { color: T.accent, fontWeight: '900', fontSize: 16 },
  premiumCheckoutBtn: {
    backgroundColor: '#CCFF00', borderRadius: 30, height: 60, marginTop: 24,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#CCFF00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5
  },
  premiumCheckoutBtnTxt: { color: '#111', fontWeight: '800', fontSize: 16 },
});
