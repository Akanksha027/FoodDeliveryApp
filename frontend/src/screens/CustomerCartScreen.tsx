// src/screens/CustomerCartScreen.tsx
import React, { useState } from 'react';
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');

const getDishImage = (name: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('burger')) return require('../../assets/burger.png');
  if (n.includes('pizza') || n.includes('pasta') || n.includes('arrabiata')) return require('../../assets/pizza.png');
  if (n.includes('fries') || n.includes('french')) return require('../../assets/fries.png');
  if (n.includes('coffee') || n.includes('drink') || n.includes('tea') || n.includes('shake') || n.includes('smoothie')) return require('../../assets/drinks.png');
  return require('../../assets/burger.png');
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
  const [selectedDelivery, setSelectedDelivery] = useState<'standard' | 'express'>('standard');

  const deliveryFee = selectedDelivery === 'express' ? 2.0 : 0;
  const finalTotal = cartTotal + deliveryFee;

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* ── HEADER ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>
          Cart,{' '}
          <Text style={s.headerCount}>{cart.length} items</Text>
        </Text>
        <TouchableOpacity
          style={s.closeBtn}
          onPress={() => setActiveNav('home')}
          activeOpacity={0.7}
        >
          <Text style={s.closeBtnTxt}>×</Text>
        </TouchableOpacity>
      </View>

      {cart.length === 0 ? (
        /* ── EMPTY STATE ── */
        <View style={s.empty}>
          <View style={s.emptyIconWrap}>
            <Text style={{ fontSize: 52 }}>🛒</Text>
          </View>
          <Text style={s.emptyTitle}>Your cart is empty</Text>
          <Text style={s.emptySub}>Add some delicious items to get started</Text>
          <TouchableOpacity style={s.exploreBtn} onPress={() => setActiveNav('home')}>
            <Text style={s.exploreBtnText}>Explore Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* ── DELIVERY OPTIONS ── */}
            <View style={s.deliverySection}>
              {/* Standard */}
              <TouchableOpacity
                style={s.deliveryRow}
                activeOpacity={0.7}
                onPress={() => setSelectedDelivery('standard')}
              >
                <View style={s.deliveryInfo}>
                  <Text style={s.deliveryLabel}>Standard delivery, 40–60 minutes</Text>
                  <Text style={s.deliveryPrice}>Free</Text>
                </View>
                <View style={[s.radio, selectedDelivery === 'standard' && s.radioActive]}>
                  {selectedDelivery === 'standard' && <View style={s.radioInner} />}
                </View>
              </TouchableOpacity>

              <View style={s.deliverySep} />

              {/* Express */}
              <TouchableOpacity
                style={s.deliveryRow}
                activeOpacity={0.7}
                onPress={() => setSelectedDelivery('express')}
              >
                <View style={s.deliveryInfo}>
                  <Text style={s.deliveryLabel}>Express, 15–25 minutes ⚡</Text>
                  <Text style={s.deliveryPrice}>₹2.00</Text>
                </View>
                <View style={[s.radio, selectedDelivery === 'express' && s.radioActive]}>
                  {selectedDelivery === 'express' && <View style={s.radioInner} />}
                </View>
              </TouchableOpacity>
            </View>

            <View style={s.sectionSep} />

            {/* ── CART ITEMS ── */}
            <View style={s.itemsSection}>
              {cart.map((item: any, index: number) => (
                <View key={item.id || index}>
                  <View style={s.itemRow}>
                    {/* Circular image */}
                    <View style={s.itemImgWrap}>
                      <Image
                        source={getDishImage(item.name)}
                        style={s.itemImg}
                        resizeMode="cover"
                      />
                    </View>

                    {/* Name + weight + price */}
                    <View style={s.itemInfo}>
                      <Text style={s.itemName}>
                        {item.name}
                        <Text style={s.itemWeight}>, {item.weight || '150g'}</Text>
                      </Text>
                      <Text style={s.itemPrice}>₹{parseFloat(item.price).toFixed(2)}</Text>
                    </View>

                    {/* Qty controls */}
                    <View style={s.qtyControls}>
                      <TouchableOpacity
                        style={s.qtyBtn}
                        activeOpacity={0.7}
                        onPress={() => handleUpdateQty(item.cart_item_id, item.quantity, false)}
                      >
                        <Text style={s.qtyBtnTxt}>−</Text>
                      </TouchableOpacity>
                      <Text style={s.qtyVal}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={s.qtyBtn}
                        activeOpacity={0.7}
                        onPress={() => handleUpdateQty(item.cart_item_id, item.quantity, true)}
                      >
                        <Text style={s.qtyBtnTxt}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                </View>
              ))}
            </View>

            <View style={s.sectionSep} />

            {/* ── PROMOCODE ROW ── */}
            <View style={s.promoSection}>
              <View style={s.promoHeader}>
                <Text style={s.promoHeaderTitle}>Promo Code</Text>
                <TouchableOpacity onPress={() => { fetchCouponsForUser(); setCouponsModalVisible(true); }}>
                  <Text style={s.viewAllLink}>View All Coupons</Text>
                </TouchableOpacity>
              </View>
              <View style={s.promoBox}>
                <View style={s.promoInputWrap}>
                  <Text style={s.promoIcon}>🏷</Text>
                  <TextInput
                    style={s.promoInput}
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChangeText={setPromoCode}
                    placeholderTextColor="#BFA98A"
                    autoCapitalize="characters"
                  />
                </View>
                <TouchableOpacity style={s.promoApplyBtnWrap} onPress={handleApplyPromo} activeOpacity={0.7}>
                  <Text style={s.promoApplyBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
              {discount > 0 && (
                <View style={s.promoAppliedRow}>
                  <Text style={s.promoAppliedText}>✓ {promoCode} applied — ₹{discount.toFixed(2)} off</Text>
                </View>
              )}
            </View>

            <View style={s.sectionSep} />

            {/* ── ORDER SUMMARY ── */}
            <View style={s.summarySection}>
              <Text style={s.summaryTitle}>Order Summary</Text>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Subtotal</Text>
                <Text style={s.summaryVal}>₹{subtotal.toFixed(2)}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Delivery Fee</Text>
                <Text style={[s.summaryVal, deliveryFee === 0 && { color: '#22C55E' }]}>
                  {deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toFixed(2)}`}
                </Text>
              </View>
              {discount > 0 && (
                <View style={s.summaryRow}>
                  <Text style={[s.summaryLabel, { color: '#22C55E' }]}>Promo Discount</Text>
                  <Text style={[s.summaryVal, { color: '#22C55E' }]}>− ₹{discount.toFixed(2)}</Text>
                </View>
              )}
              <View style={s.summaryDivider} />
              <View style={s.summaryRow}>
                <Text style={s.summaryTotalLabel}>Total Amount</Text>
                <Text style={s.summaryTotalVal}>₹{finalTotal.toFixed(2)}</Text>
              </View>
            </View>
          </ScrollView>

          {/* ── BOTTOM CHECKOUT BAR ── */}
          <View style={s.bottomBar}>
            <TouchableOpacity
              style={s.checkoutBtn}
              activeOpacity={0.88}
              disabled={placingOrder}
              onPress={handleCheckout}
            >
              {placingOrder ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={s.checkoutBtnRow}>
                  {/* Left Half: Total price */}
                  <View style={s.checkoutHalf}>
                    <Text style={s.checkoutPrice}>₹{finalTotal.toFixed(2)}</Text>
                  </View>

                  {/* Vertical Divider */}
                  <View style={s.checkoutDivider} />

                  {/* Right Half: Confirm order */}
                  <View style={s.checkoutHalf}>
                    <Text style={s.checkoutLabel}>Confirm order</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 3,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E1209',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    letterSpacing: -0.5,
  },
  headerCount: {
    fontSize: 28,
    fontWeight: '400',
    color: '#8a817c',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  closeBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnTxt: {
    fontSize: 28,
    color: '#1E1209',
    fontWeight: '300',
    lineHeight: 30,
  },

  /* ── Empty ── */
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFF4EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1209',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#BFA98A',
    marginBottom: 28,
  },
  exploreBtn: {
    backgroundColor: '#E8956D',
    borderRadius: 0,
    paddingHorizontal: 30,
    paddingVertical: 14,
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* ── Delivery Options ── */
  deliverySection: {
    backgroundColor: '#F9F6F2',
    marginHorizontal: 22,
    borderRadius: 0,
    paddingVertical: 4,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  deliveryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deliveryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E1209',
    flex: 1,
  },
  deliveryPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1209',
  },
  deliverySep: {
    height: 1,
    backgroundColor: '#F0EAE2',
    marginHorizontal: 18,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D0C4B4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  radioActive: {
    borderColor: '#E8956D',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8956D',
  },

  /* ── Section Separator ── */
  sectionSep: {
    height: 16,
  },

  /* ── Cart Items ── */
  itemsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    paddingVertical: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 22,
  },
  itemImgWrap: {
    width: 80,
    height: 80,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#F5EFE6',
    marginRight: 14,
  },
  itemImg: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1209',
    lineHeight: 22,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  itemWeight: {
    fontSize: 16,
    fontWeight: '400',
    color: '#BFA98A',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E8956D',
    marginTop: 4,
  },


  /* ── Qty Controls ── */
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#F0EAE2',
    borderRadius: 0,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnTxt: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1E1209',
    lineHeight: 20,
  },
  qtyVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1209',
    width: 24,
    textAlign: 'center',
  },

  /* ── Promocode ── */
  promoSection: {
    paddingHorizontal: 22,
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  promoHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1209',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  viewAllLink: {
    fontSize: 12,
    color: '#7A6A57',
    fontWeight: '700',
    textDecorationLine: 'none',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  promoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  promoInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F6F2',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#F0EAE2',
    paddingHorizontal: 14,
    height: 48,
  },
  promoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  promoInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E1209',
    fontWeight: '600',
    height: '100%',
  },
  promoApplyBtnWrap: {
    backgroundColor: '#E8956D',
    height: 48,
    borderRadius: 0,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  promoApplyBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  promoAppliedRow: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  promoAppliedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22C55E',
  },

  /* ── Order Summary ── */
  summarySection: {
    paddingHorizontal: 22,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1209',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7A6A57',
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 14,
    color: '#1E1209',
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F0EAE2',
    marginTop: 8,
    marginBottom: 12,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1209',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  summaryTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#E8956D',
    letterSpacing: -0.5,
  },

  /* ── Bottom Checkout Bar ── */
  bottomBar: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 18,
    backgroundColor: '#FFFFFF',
  },
  checkoutBtn: {
    width: '100%',
    height: 54,
    backgroundColor: '#E8956D',
    borderRadius: 0,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#E8956D',
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  checkoutBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  checkoutHalf: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutDivider: {
    width: 1.5,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  checkoutPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  checkoutLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
});