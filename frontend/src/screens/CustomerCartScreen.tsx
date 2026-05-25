// src/screens/CustomerCartScreen.tsx
import React, { useRef, useEffect } from 'react';
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const T = {
  bg: '#FAFAFA',
  surface: '#FFFFFF',
  accent: '#FF6B35',
  accentLight: '#FF8C5A',
  accentBg: '#FFF3EF',
  dark: '#1A1A2E',
  text: '#0D0D0D',
  textSoft: '#555566',
  sub: '#A0A8B8',
  border: '#F0F0F5',
  lime: '#CCFF00',
  limeText: '#1A1A1A',
};

const shadow = (elevation = 4) =>
  Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.07,
      shadowRadius: elevation * 2.5,
      shadowOffset: { width: 0, height: elevation * 0.6 },
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
  return require('../../assets/burger.png');
};

// Animated checkout button component
const CheckoutButton = ({ onPress, disabled, cartTotal }: any) => {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 2,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.delay(800),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 2],
    outputRange: [-120, 400],
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={s.checkoutBtnOuter}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        <View style={s.checkoutBtnInner}>
          {/* Shimmer sweep */}
          <Animated.View
            style={[
              s.shimmerBar,
              { transform: [{ translateX }] },
            ]}
          />
          {disabled ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={s.checkoutBtnContent}>
              <Text style={s.checkoutBtnLabel}>Continue to checkout</Text>
              <View style={s.checkoutBtnPill}>
                <Text style={s.checkoutBtnAmount}>₹{cartTotal.toFixed(2)}</Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
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
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My cart</Text>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>{cart.length} Items</Text>
        </View>
      </View>

      {cart.length === 0 ? (
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Cart Items */}
          <View style={s.itemsSection}>
            {cart.map((item: any, index: number) => (
              <View key={item.id} style={s.cartCard}>
                {/* Image */}
                <View style={s.cartImgWrap}>
                  <Image
                    source={getDishImage(item.name)}
                    style={s.cartImg}
                    resizeMode="cover"
                  />
                </View>

                {/* Details */}
                <View style={s.cartDetails}>
                  <View style={s.cartTopRow}>
                    <Text style={s.cartName} numberOfLines={1}>{item.name}</Text>
                    <TouchableOpacity
                      style={s.removeBtn}
                      onPress={() => handleRemoveItem(item.cart_item_id)}
                    >
                      <Text style={s.removeBtnIcon}>🗑</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={s.cartWeight}>Quantity: {item.quantity} large pieces</Text>
                  <Text style={s.cartPrice}>${item.price}</Text>

                  {/* Qty Controls */}
                  <View style={s.qtyRow}>
                    <TouchableOpacity
                      style={s.qtyBtn}
                      onPress={() => handleUpdateQty(item.cart_item_id, item.quantity, false)}
                    >
                      <Text style={s.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={s.qtyVal}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={[s.qtyBtn, s.qtyBtnAdd]}
                      onPress={() => handleUpdateQty(item.cart_item_id, item.quantity, true)}
                    >
                      <Text style={[s.qtyBtnText, { color: '#fff' }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={s.divider} />

          {/* Complete Your Meal */}
          {recommendedItems.length > 0 && (
            <View style={s.sectionBlock}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Complete Your Meal</Text>
                <Text style={s.sectionEmoji}>😋</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              >
                {recommendedItems.map((item: any) => (
                  <View key={item.id} style={s.addonCard}>
                    <Image
                      source={getDishImage(item.name)}
                      style={s.addonImg}
                      resizeMode="cover"
                    />
                    <Text style={s.addonName} numberOfLines={1}>{item.name}</Text>
                    <Text style={s.addonCat}>{item.category || 'Add-on'}</Text>
                    <View style={s.addonFooter}>
                      <Text style={s.addonPrice}>₹{item.price}</Text>
                      <TouchableOpacity
                        onPress={() => handleAddToCart(item)}
                        style={s.addonAddBtn}
                      >
                        <Text style={s.addonAddText}>+ ADD</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Promo Code */}
          <View style={s.sectionBlock}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Promo Code</Text>
              <TouchableOpacity onPress={() => { fetchCouponsForUser(); setCouponsModalVisible(true); }}>
                <Text style={s.viewAllLink}>View All Coupons</Text>
              </TouchableOpacity>
            </View>
            <View style={s.promoRow}>
              <View style={s.promoInputWrap}>
                <Text style={s.promoIcon}>🏷</Text>
                <TextInput
                  style={s.promoInput}
                  placeholder="Enter promo code (e.g. SAVE15)"
                  value={promoCode}
                  onChangeText={setPromoCode}
                  placeholderTextColor={T.sub}
                  autoCapitalize="characters"
                />
              </View>
              <TouchableOpacity style={s.promoApplyBtn} onPress={handleApplyPromo}>
                <Text style={s.promoApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Delivery Address */}
          <View style={s.sectionBlock}>
            <Text style={s.sectionTitle}>Delivery Address</Text>
            {addresses.length === 0 ? (
              <TouchableOpacity
                style={s.addAddrBtn}
                onPress={() => {
                  setActiveNav('profile');
                  setAddressModalVisible(true);
                }}
              >
                <Text style={s.addAddrText}>➕ Add Delivery Address</Text>
              </TouchableOpacity>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 12 }}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
              >
                {addresses.map((addr: any) => (
                  <TouchableOpacity
                    key={addr.id}
                    style={[
                      s.addrCard,
                      selectedAddressId === addr.id && s.addrCardActive,
                    ]}
                    onPress={() => setSelectedAddressId(addr.id)}
                    activeOpacity={0.8}
                  >
                    <View style={s.addrIconWrap}>
                      <Text style={{ fontSize: 16 }}>📍</Text>
                    </View>
                    <Text style={[s.addrName, selectedAddressId === addr.id && { color: T.accent }]}>
                      {addr.receiver_name}
                    </Text>
                    <Text style={s.addrLine}>{addr.address_line1}, {addr.city}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Order Summary */}
          <View style={s.summaryCard}>
            <Text style={s.sectionTitle}>Order Summary</Text>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Total shopping cart</Text>
              <Text style={s.summaryVal}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Delivery Fee</Text>
              <Text style={[s.summaryVal, { color: '#22C55E' }]}>Free</Text>
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
              <Text style={s.summaryTotalVal}>₹{cartTotal.toFixed(2)}</Text>
            </View>
          </View>

          {/* Checkout Button */}
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <CheckoutButton
              onPress={handleCheckout}
              disabled={placingOrder}
              cartTotal={cartTotal}
            />
          </View>
        </ScrollView>
      )}

      {/* Sticky bottom summary bar */}
      {cart.length > 0 && (
        <View style={s.stickyBar} pointerEvents="none">
          <Text style={s.stickyLabel}>Total shopping cart</Text>
          <Text style={s.stickyTotal}>₹{cartTotal.toFixed(2)}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },

  /* Header */
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: T.surface,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: T.text,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    letterSpacing: -0.5,
  },
  headerBadge: {
    backgroundColor: T.accentBg,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  headerBadgeText: {
    color: T.accent,
    fontSize: 13,
    fontWeight: '700',
  },

  /* Empty */
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: T.accentBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: T.text,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: T.sub,
    marginBottom: 28,
  },
  exploreBtn: {
    backgroundColor: T.accent,
    borderRadius: 30,
    paddingHorizontal: 30,
    paddingVertical: 14,
    ...shadow(4),
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* Items Section */
  itemsSection: {
    backgroundColor: T.surface,
    paddingTop: 8,
  },
  cartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5FA',
  },
  cartImgWrap: {
    width: 80,
    height: 80,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    marginRight: 14,
  },
  cartImg: {
    width: '100%',
    height: '100%',
  },
  cartDetails: {
    flex: 1,
  },
  cartTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  cartName: {
    fontSize: 15,
    fontWeight: '700',
    color: T.text,
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  removeBtn: {
    padding: 2,
  },
  removeBtnIcon: {
    fontSize: 15,
  },
  cartWeight: {
    fontSize: 11,
    color: T.sub,
    marginBottom: 6,
    fontWeight: '500',
  },
  cartPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: T.text,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnAdd: {
    backgroundColor: T.accent,
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: T.text,
    lineHeight: 22,
  },
  qtyVal: {
    fontSize: 15,
    fontWeight: '800',
    color: T.text,
    width: 36,
    textAlign: 'center',
  },

  /* Divider */
  divider: {
    height: 8,
    backgroundColor: T.bg,
  },

  /* Section Blocks */
  sectionBlock: {
    backgroundColor: T.surface,
    marginTop: 8,
    paddingTop: 18,
    paddingBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: T.text,
    letterSpacing: -0.3,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  sectionEmoji: {
    fontSize: 18,
  },
  viewAllLink: {
    fontSize: 12,
    color: T.accent,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  /* Addon Cards */
  addonCard: {
    width: 140,
    backgroundColor: T.surface,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: T.border,
    ...shadow(2),
  },
  addonImg: {
    width: '100%',
    height: 75,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  addonName: {
    fontSize: 13,
    fontWeight: '700',
    color: T.text,
    marginBottom: 2,
  },
  addonCat: {
    fontSize: 11,
    color: T.sub,
    marginBottom: 10,
  },
  addonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addonPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: T.text,
  },
  addonAddBtn: {
    backgroundColor: T.accent,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  addonAddText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },

  /* Promo */
  promoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  promoInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.bg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: T.border,
    paddingHorizontal: 14,
    height: 52,
  },
  promoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  promoInput: {
    flex: 1,
    fontSize: 13,
    color: T.text,
    fontWeight: '600',
    height: '100%',
  },
  promoApplyBtn: {
    backgroundColor: T.accent,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 22,
    ...shadow(3),
  },
  promoApplyText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.2,
  },

  /* Address */
  addAddrBtn: {
    marginHorizontal: 20,
    marginTop: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: T.accent,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAddrText: {
    color: T.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  addrCard: {
    backgroundColor: T.surface,
    borderRadius: 16,
    padding: 14,
    minWidth: 160,
    borderWidth: 1.5,
    borderColor: T.border,
    ...shadow(2),
  },
  addrCardActive: {
    borderColor: T.accent,
    backgroundColor: T.accentBg,
  },
  addrIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.accentBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addrName: {
    fontSize: 13,
    fontWeight: '800',
    color: T.text,
    marginBottom: 3,
  },
  addrLine: {
    fontSize: 11,
    color: T.sub,
    lineHeight: 15,
  },

  /* Summary Card */
  summaryCard: {
    backgroundColor: T.surface,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  summaryLabel: {
    fontSize: 14,
    color: T.textSoft,
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 14,
    color: T.text,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: T.border,
    marginTop: 18,
    marginBottom: 4,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: T.text,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  summaryTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: T.accent,
    letterSpacing: -0.5,
  },

  /* Checkout Button */
  checkoutBtnOuter: {
    borderRadius: 30,
    overflow: 'hidden',
    ...shadow(6),
  },
  checkoutBtnInner: {
    backgroundColor: T.accent,
    height: 58,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.18)',
    transform: [{ skewX: '-20deg' }],
    zIndex: 0,
  },
  checkoutBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
  },
  checkoutBtnLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  checkoutBtnPill: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  checkoutBtnAmount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  /* Sticky bar */
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  stickyLabel: {
    fontSize: 13,
    color: T.sub,
    fontWeight: '600',
  },
  stickyTotal: {
    fontSize: 18,
    fontWeight: '900',
    color: T.text,
    letterSpacing: -0.4,
  },
});