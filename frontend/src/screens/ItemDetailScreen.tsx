import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMenuItem, getMenu, getCart, addToCart, updateCartItem, removeCartItem } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Loader } from '../components/Loader';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const getDishImage = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('burger')) return require('../../assets/burger.png');
  if (n.includes('pizza') || n.includes('pasta') || n.includes('arrabiata')) return require('../../assets/pizza.png');
  if (n.includes('fries') || n.includes('french')) return require('../../assets/fries.png');
  if (n.includes('coffee') || n.includes('drink') || n.includes('tea') || n.includes('shake') || n.includes('smoothie')) return require('../../assets/drinks.png');
  return require('../../assets/burger.png');
};

const SIZE_OPTIONS = [
  { label: 'Small', size: '6\'', price: -2 },
  { label: 'Medium', size: '8\'', price: 0 },
  { label: 'Large', size: '10\'', price: 2 },
];

export const ItemDetailScreen = ({ route, navigation }: any) => {
  const { itemId } = route.params;
  const [item, setItem] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedSize, setSelectedSize] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [cart, setCart] = useState<any[]>([]);

  // Soft toast states for high-end alert replacement
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          setToastMessage(null);
        });
      }, 1800);
    });
  }, [toastOpacity]);

  useEffect(() => {
    const init = async () => {
      let cacheLoaded = false;

      // 1. Try to load instantly from local storage cache
      try {
        const cachedMenuStr = await AsyncStorage.getItem('@cache_menu_items');
        if (cachedMenuStr) {
          const cachedMenu = JSON.parse(cachedMenuStr);
          if (Array.isArray(cachedMenu) && cachedMenu.length > 0) {
            setMenuItems(cachedMenu);
            const found = cachedMenu.find((m: any) => m.id === itemId);
            if (found) {
              setItem(found);
              // Dismiss loading spinner immediately! Rendering is instant!
              setLoading(false);
              cacheLoaded = true;
              console.log('[ItemDetailScreen] Loaded item instantly from menu cache:', found.name);
            }
          }
        }

        // Also try to restore cached user and cart if available
        const cachedUserStr = await AsyncStorage.getItem('@cache_user_data');
        if (cachedUserStr) {
          const cachedUser = JSON.parse(cachedUserStr);
          if (cachedUser) {
            setCurrentUser(cachedUser);
            const cachedCartStr = await AsyncStorage.getItem(`@cache_cart_data_${cachedUser.id}`);
            if (cachedCartStr) {
              const cachedCart = JSON.parse(cachedCartStr);
              if (Array.isArray(cachedCart)) {
                setCart(cachedCart);
                const totalQty = cachedCart.reduce((sum: number, cItem: any) => sum + cItem.quantity, 0);
                setCartCount(totalQty);
              }
            }
          }
        }
      } catch (cacheErr) {
        console.error('[ItemDetailScreen] Cache read error:', cacheErr);
      }

      // 2. Perform background revalidation (silent REST API update)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          await AsyncStorage.setItem('@cache_user_data', JSON.stringify(user));

          const cartData = await getCart(user.id);
          setCart(cartData);
          const totalQty = cartData.reduce((sum: number, cItem: any) => sum + cItem.quantity, 0);
          setCartCount(totalQty);
          await AsyncStorage.setItem(`@cache_cart_data_${user.id}`, JSON.stringify(cartData));
        }

        const data = await getMenuItem(itemId);
        if (data) {
          setItem(data);
        }

        const allItems = await getMenu();
        if (allItems) {
          setMenuItems(allItems);
          await AsyncStorage.setItem('@cache_menu_items', JSON.stringify(allItems));
        }
      } catch (e: any) {
        console.error('[ItemDetailScreen] Revalidation error:', e);
        // Only show alert if we didn't manage to load from cache
        if (!cacheLoaded) {
          Alert.alert('Error', 'Could not load item details.');
          navigation.goBack();
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [itemId]);

  const sizePrice = (basePrice: any) => {
    const parsedBase = typeof basePrice === 'string' ? parseFloat(basePrice) : (basePrice || 0);
    const offset = SIZE_OPTIONS[selectedSize].price;
    return parsedBase + offset;
  };

  const isPizza = item?.name?.toLowerCase().includes('pizza');

  const cartItem = cart.find((c: any) => c.id === item?.id);
  const isInCart = !!cartItem;

  const getRecommendedExtras = () => {
    if (!item || menuItems.length === 0) return [];

    // Parse recommendations safely (handles both parsed arrays and stringified JSON)
    let recs: string[] = [];
    if (item.recommendations) {
      if (Array.isArray(item.recommendations)) {
        recs = item.recommendations;
      } else if (typeof item.recommendations === 'string') {
        try {
          const parsed = JSON.parse(item.recommendations);
          if (Array.isArray(parsed)) {
            recs = parsed;
          }
        } catch (e) {
          console.error('[ItemDetailScreen] Failed to parse recommendations JSON:', e);
        }
      }
    }

    // If admin has set specific recommendations for this product, use them!
    if (recs.length > 0) {
      return menuItems.filter(m => recs.includes(m.id) && m.id !== item.id);
    }

    // Intelligent fallbacks based on category/name
    const category = item.category?.toLowerCase() || '';
    const name = item.name?.toLowerCase() || '';

    let targets: string[] = [];
    if (category.includes('burger') || name.includes('burger') || category.includes('pizza') || name.includes('pizza')) {
      targets = ['fries', 'coffee', 'brownie'];
    } else if (category.includes('main') || name.includes('paneer') || name.includes('dal')) {
      targets = ['naan', 'coffee', 'brownie'];
    } else {
      targets = ['fries', 'coffee'];
    }

    return menuItems.filter(m => {
      const mName = m.name.toLowerCase();
      if (m.id === item.id) return false;
      return targets.some(t => mName.includes(t));
    });
  };

  const handleIncreaseQty = async () => {
    if (!currentUser || !cartItem) return;

    // 1. Optimistic UI update
    const newQty = cartItem.quantity + 1;

    // Update local cart state instantly
    const updatedCart = cart.map(c => c.id === item.id ? { ...c, quantity: newQty } : c);
    setCart(updatedCart);

    // Instantly update the cartCount badge on top of screen
    const totalQty = updatedCart.reduce((sum: number, cItem: any) => sum + cItem.quantity, 0);
    setCartCount(totalQty);

    // Fire API call silently in background
    try {
      await updateCartItem(cartItem.id, currentUser.id, newQty);
      const cartData = await getCart(currentUser.id);
      setCart(cartData);

      const verifiedTotalQty = cartData.reduce((sum: number, cItem: any) => sum + cItem.quantity, 0);
      setCartCount(verifiedTotalQty);
    } catch (e) {
      // Revert on error
      const cartData = await getCart(currentUser.id).catch(() => cart);
      setCart(cartData);

      const revertedTotalQty = cartData.reduce((sum: number, cItem: any) => sum + cItem.quantity, 0);
      setCartCount(revertedTotalQty);
      Alert.alert('Error', 'Could not update quantity.');
    }
  };

  const handleDecreaseQty = async () => {
    if (!currentUser || !cartItem) return;

    // 1. Optimistic UI update
    const newQty = cartItem.quantity - 1;

    // Update local cart state instantly
    const updatedCart = cart.map(c => c.id === item.id ? { ...c, quantity: newQty } : c).filter(c => c.quantity > 0);
    setCart(updatedCart);

    // Instantly update the cartCount badge on top of screen
    const totalQty = updatedCart.reduce((sum: number, cItem: any) => sum + cItem.quantity, 0);
    setCartCount(totalQty);

    // Fire API call silently in background
    try {
      if (newQty <= 0) {
        await removeCartItem(cartItem.id, currentUser.id);
      } else {
        await updateCartItem(cartItem.id, currentUser.id, newQty);
      }
      const cartData = await getCart(currentUser.id);
      setCart(cartData);

      const verifiedTotalQty = cartData.reduce((sum: number, cItem: any) => sum + cItem.quantity, 0);
      setCartCount(verifiedTotalQty);
    } catch (e) {
      // Revert on error
      const cartData = await getCart(currentUser.id).catch(() => cart);
      setCart(cartData);

      const revertedTotalQty = cartData.reduce((sum: number, cItem: any) => sum + cItem.quantity, 0);
      setCartCount(revertedTotalQty);
      Alert.alert('Error', 'Could not update quantity.');
    }
  };

  const getCurrentTotal = () => {
    if (!item) return 0;
    const base = isPizza ? sizePrice(item.price) : parseFloat(item.price);
    const extrasTotal = getRecommendedExtras()
      .filter(e => selectedExtras.includes(e.id))
      .reduce((sum, e) => sum + parseFloat(e.price), 0);
    return (base * quantity) + extrasTotal;
  };

  const handleConfirmAddToCart = async () => {
    if (!currentUser || !item) return;
    setAddingToCart(true);

    try {
      await addToCart(currentUser.id, item.id, quantity);

      const extrasToAdd = getRecommendedExtras().filter(e => selectedExtras.includes(e.id));
      for (const extra of extrasToAdd) {
        await addToCart(currentUser.id, extra.id, 1);
      }

      const cartData = await getCart(currentUser.id);
      setCart(cartData);
      const totalQty = cartData.reduce((sum: number, cItem: any) => sum + cItem.quantity, 0);
      setCartCount(totalQty);

      showToast(`${item.name} added to cart!`);

      setSelectedExtras([]);
      setQuantity(1);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not add items to cart.');
    }
    setAddingToCart(false);
  };

  if (loading || !item) {
    return (
      <Loader
        fullScreen={true}
        text="Loading item details..."
        color="#E8956D"
        backgroundColor="#F5EFE6"
      />
    );
  }

  const desc = item.description || `${item.name} is a delicious classic topped with golden melted cheese and rich flavor. Made fresh daily with the finest ingredients for your perfect meal.`;
  const truncatedDesc = desc.slice(0, 110);
  const showReadMore = desc.length > 110;

  // Fake calorie value for display — in real app, fetch from item data
  const calories = item.calories || '460 kcal';

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ── HERO IMAGE AREA ── */}
      <View style={s.heroWrapper}>
        <Image
          source={getDishImage(item.name)}
          style={s.heroImage}
          resizeMode="contain"
        />

        {/* Calorie badge bottom-right of image */}
        <View style={s.calorieBadge}>
          <Text style={s.calorieText}>{calories}</Text>
        </View>
      </View>

      {/* ── FLOATING TOP NAV (over hero) ── */}
      <SafeAreaView style={s.navOverlay} pointerEvents="box-none">
        <View style={s.navRow}>
          {/* Back button */}
          <TouchableOpacity style={s.navBtnTransparent} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={s.backBtnTxt}>‹</Text>
          </TouchableOpacity>

          {/* Favorites Toggle Button */}
          <TouchableOpacity
            style={s.navBtnTransparent}
            activeOpacity={0.75}
            onPress={() => setIsFavorite(prev => !prev)}
          >
            <Text style={s.topHeartIcon}>
              {isFavorite ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── WHITE BOTTOM CARD ── */}
      <View style={s.card}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          bounces={false}
        >
          {/* Title row with weight */}
          <View style={s.titleRow}>
            <View style={s.titleBlock}>
              <Text style={s.itemName}>
                {item.name},{'  '}
                <Text style={s.itemWeight}>
                  {item.weight || '110g'}
                </Text>
              </Text>
            </View>
          </View>

          {/* Description / Ingredients */}
          <Text style={s.description}>
            {isDescriptionExpanded ? desc : truncatedDesc}
            {showReadMore && (
              <Text
                onPress={() => setIsDescriptionExpanded(prev => !prev)}
                style={s.readMoreBtn}
              >
                {isDescriptionExpanded ? '  Read Less' : '... Read More'}
              </Text>
            )}
          </Text>

          {/* Pizza size selector */}
          {isPizza && (
            <View style={{ marginTop: 22 }}>
              <Text style={s.sectionTitle}>Select Size</Text>
              <View style={s.sizeRow}>
                {SIZE_OPTIONS.map((opt, idx) => {
                  const selected = selectedSize === idx;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[s.sizePill, selected && s.sizePillSelected]}
                      onPress={() => setSelectedSize(idx)}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.sizePillPrice, selected && s.sizePillPriceSelected]}>
                        ₹{(parseFloat(item.price) + opt.price).toFixed(0)}
                      </Text>
                      <Text style={[s.sizePillLabel, selected && s.sizePillLabelSelected]}>
                        {opt.size} - {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Add to order / extras */}
          {getRecommendedExtras().length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={s.sectionTitle}>Add to order</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.extrasScroll}
              >
                {getRecommendedExtras().map((extra) => {
                  const isSelected = selectedExtras.includes(extra.id);
                  return (
                    <TouchableOpacity
                      key={extra.id}
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedExtras(prev =>
                          isSelected ? prev.filter(id => id !== extra.id) : [...prev, extra.id]
                        );
                      }}
                      style={[s.extraCard, isSelected && s.extraCardSelected]}
                    >
                      {/* + button top-right */}
                      <View style={[s.extraPlusBtn, isSelected && s.extraPlusBtnSelected]}>
                        <Text style={s.extraPlusTxt}>{isSelected ? '✓' : '+'}</Text>
                      </View>

                      {/* Extra image placeholder */}
                      <Image
                        source={getDishImage(extra.name)}
                        style={s.extraImage}
                        resizeMode="contain"
                      />

                      <Text style={s.extraName} numberOfLines={1}>
                        {extra.name}
                      </Text>
                      <Text style={s.extraPrice}>
                        ₹{parseFloat(extra.price).toFixed(0)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </View>

      {/* ── BOTTOM ACTION BAR ── */}
      <View style={s.bottomBar}>
        {!isInCart ? (
          /* Default: Single full-width Add to Cart button split internally */
          <TouchableOpacity
            style={s.unifiedButtonContainer}
            activeOpacity={0.88}
            disabled={addingToCart}
            onPress={handleConfirmAddToCart}
          >
            {addingToCart ? (
              <Loader size="small" color="#FFFFFF" />
            ) : (
              <View style={s.unifiedButtonRow}>
                {/* Left Half: Price space */}
                <View style={s.unifiedButtonHalf}>
                  <Text style={s.unifiedPriceText}>₹{getCurrentTotal().toFixed(0)}</Text>
                </View>

                {/* Vertical Divider */}
                <View style={s.unifiedDivider} />

                {/* Right Half: Add to cart label */}
                <View style={s.unifiedButtonHalf}>
                  <Text style={s.unifiedLabelText}>Add to cart</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          /* Divided: 2 equal pointed halves inside the exact same shape container */
          <View style={s.unifiedButtonContainer}>
            <View style={s.unifiedButtonRow}>
              {/* Left Half: [- Qty +] option in the price space */}
              <View style={s.unifiedButtonHalf}>
                <View style={s.unifiedQtyRow}>
                  <TouchableOpacity
                    style={s.qtyBtn}
                    activeOpacity={0.7}
                    onPress={handleDecreaseQty}
                  >
                    <Text style={s.qtyBtnTxt}>−</Text>
                  </TouchableOpacity>
                  <Text style={s.qtyValueTxt}>
                    {cartItem.quantity < 10 ? `0${cartItem.quantity}` : cartItem.quantity}
                  </Text>
                  <TouchableOpacity
                    style={s.qtyBtn}
                    activeOpacity={0.7}
                    onPress={handleIncreaseQty}
                  >
                    <Text style={s.qtyBtnTxt}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Vertical Divider */}
              <View style={s.unifiedDivider} />

              {/* Right Half: Go to cart option in the add to cart space */}
              <TouchableOpacity
                style={s.unifiedButtonHalf}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('CustomerDashboard', { tab: 'cart' })}
              >
                <Text style={s.unifiedLabelText}>Go to cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Premium Automated Soft Toast Notification */}
      {toastMessage && (
        <Animated.View style={[s.toastContainer, { opacity: toastOpacity }]}>
          <Text style={s.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const CARD_RADIUS = 32;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5EFE6',
  },

  // ── Hero ──
  heroWrapper: {
    width: SCREEN_W,
    height: SCREEN_H * 0.48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '95%',
    height: '95%',
  },
  calorieBadge: {
    position: 'absolute',
    bottom: 18,
    right: 22,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  calorieText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5C4A3A',
  },

  // ── Nav overlay ──
  navOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 10 : 14,
    paddingBottom: 8,
  },
  navBtnTransparent: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnTxt: {
    fontSize: 36,
    color: '#3D2C1E',
    fontWeight: '300',
    lineHeight: 40,
  },
  topHeartIcon: {
    fontSize: 32,
    color: '#E8956D',
    fontWeight: '900',
  },

  // ── White card ──
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    paddingTop: 28,
    paddingHorizontal: 22,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
      },
      android: { elevation: 10 },
    }),
  },
  scrollContent: {
    paddingBottom: 16,
  },

  // ── Title & heart ──
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleBlock: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E1209',
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  itemWeight: {
    fontSize: 20,
    fontWeight: '400',
    color: '#BFA98A',
  },

  // ── Description ──
  description: {
    fontSize: 13,
    color: '#7A6A57',
    lineHeight: 20,
    marginBottom: 4,
  },
  readMoreBtn: {
    color: '#3D2C1E',
    fontWeight: '700',
  },

  // ── Section title ──
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E1209',
    marginBottom: 14,
  },

  // ── Size pills ──
  sizeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sizePill: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#F5EFE6',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sizePillSelected: {
    backgroundColor: '#FFF4EE',
    borderColor: '#E8956D',
  },
  sizePillPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
    marginBottom: 2,
  },
  sizePillPriceSelected: { color: '#E8956D' },
  sizePillLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#BBBBBB',
    textAlign: 'center',
  },
  sizePillLabelSelected: { color: '#E8956D' },

  // ── Extras ──
  extrasScroll: {
    gap: 14,
    paddingBottom: 4,
    paddingRight: 4,
  },
  extraCard: {
    width: 125,
    height: 125,
    borderRadius: 0,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 8,
    backgroundColor: '#F9F4EF',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  extraCardSelected: {
    backgroundColor: '#FFF4EE',
    borderColor: '#E8956D',
  },
  extraPlusBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 0,
    backgroundColor: '#E8956D',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  extraPlusBtnSelected: {
    backgroundColor: '#3D2C1E',
  },
  extraPlusTxt: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  extraImage: {
    width: 55,
    height: 55,
    marginBottom: 2,
    marginTop: 8,
  },
  extraName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3D2C1E',
    textAlign: 'center',
    marginBottom: 1,
  },
  extraPrice: {
    fontSize: 10,
    color: '#9C8877',
    fontWeight: '500',
  },

  // ── Bottom bar ──
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 32 : 18,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#F0EAE2',
  },
  unifiedButtonContainer: {
    width: '100%',
    height: 52,
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
  unifiedButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  unifiedButtonHalf: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unifiedDivider: {
    width: 1.5,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  unifiedPriceText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  unifiedLabelText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  unifiedQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnTxt: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  qtyValueTxt: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 120, // Above bottom unified buttons
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E8956D',
    borderRadius: 0, // Sharp corners!
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E8956D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 99999,
  },
  toastText: {
    color: '#E8956D',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});