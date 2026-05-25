import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { getMenuItem, getMenu, getCart, addToCart } from '../lib/api';
import { supabase } from '../lib/supabase';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const getDishImage = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('burger')) return require('../../assets/burger.png');
  if (n.includes('pizza') || n.includes('pasta') || n.includes('arrabiata')) return require('../../assets/pizza.jpg');
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
  const [selectedSize, setSelectedSize] = useState(1); // default Medium
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        if (user) {
          const cartData = await getCart(user.id);
          const totalQty = cartData.reduce((sum: number, cItem: any) => sum + cItem.quantity, 0);
          setCartCount(totalQty);
        }
        const data = await getMenuItem(itemId);
        setItem(data);
        const allItems = await getMenu();
        setMenuItems(allItems || []);
      } catch (e: any) {
        Alert.alert('Error', 'Could not load item details.');
        navigation.goBack();
      }
      setLoading(false);
    };
    init();
  }, [itemId]);

  const sizePrice = (basePrice: any) => {
    const parsedBase = typeof basePrice === 'string' ? parseFloat(basePrice) : (basePrice || 0);
    const offset = SIZE_OPTIONS[selectedSize].price;
    return parsedBase + offset;
  };

  const isPizza = item?.name?.toLowerCase().includes('pizza');

  const getRecommendedExtras = () => {
    if (!item || menuItems.length === 0) return [];
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
      // 1. Add primary item in chosen quantity
      await addToCart(currentUser.id, item.id, quantity);
      
      // 2. Add each selected extra in quantity 1
      const extrasToAdd = getRecommendedExtras().filter(e => selectedExtras.includes(e.id));
      for (const extra of extrasToAdd) {
        await addToCart(currentUser.id, extra.id, 1);
      }

      // 3. Update dynamic cart badge count
      const cartData = await getCart(currentUser.id);
      const totalQty = cartData.reduce((sum: number, cItem: any) => sum + cItem.quantity, 0);
      setCartCount(totalQty);

      Alert.alert(
        '🎉 Added to Cart',
        `${item.name} x${quantity}${extrasToAdd.length > 0 ? ` & ${extrasToAdd.length} extra(s)` : ''} successfully added!`,
        [{ text: 'Great!' }]
      );
      
      // Reset choices
      setSelectedExtras([]);
      setQuantity(1);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not add items to cart.');
    }
    setAddingToCart(false);
  };

  if (loading || !item) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  // Description truncation helper
  const desc = item.description || `${item.name} is a delicious classic topped with golden melted cheese and rich flavor. Made fresh daily with the finest ingredients for your perfect meal.`;
  const truncatedDesc = desc.slice(0, 110);
  const showReadMore = desc.length > 110;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ── HEADER NAVIGATION ── */}
      <SafeAreaView style={s.headerSafeArea}>
        <View style={s.header}>
          <TouchableOpacity style={s.circleBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={s.circleBtnTxt}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Details</Text>
          <TouchableOpacity style={s.circleBtn} activeOpacity={0.8} onPress={() => navigation.navigate('CartTab')}>
            <Text style={s.circleBtnTxt}>🛒</Text>
            {cartCount > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── FLOATING HERO IMAGE ── */}
      <View style={s.heroContainer}>
        <Image
          source={getDishImage(item.name)}
          style={s.heroImage}
          resizeMode="contain"
        />
      </View>

      {/* ── WHITE DETAILS CARD ── */}
      <View style={s.card}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          bounces={false}
        >
          {/* Item Title & Favorite Heart */}
          <View style={s.titleRow}>
            <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
            <TouchableOpacity 
              style={s.heartBtn} 
              activeOpacity={0.8}
              onPress={() => setIsFavorite(prev => !prev)}
            >
              <Text style={[s.heartIcon, isFavorite && s.heartIconActive]}>
                {isFavorite ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pricing Info */}
          <Text style={s.priceRow}>
            From: <Text style={s.priceValue}>₹{isPizza ? sizePrice(item.price).toFixed(2) : parseFloat(item.price).toFixed(2)}</Text>
          </Text>

          {/* Expandable Description */}
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

          {/* Pizza size selector conditional */}
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

          {/* Horizontal Add-ons list */}
          {getRecommendedExtras().length > 0 && (
            <View style={{ marginTop: 22 }}>
              <Text style={s.sectionTitle}>Add Extra Additional</Text>
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
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedExtras(prev => 
                          isSelected ? prev.filter(id => id !== extra.id) : [...prev, extra.id]
                        );
                      }}
                      style={[s.extraCard, isSelected && s.extraCardSelected]}
                    >
                      <Text style={[s.extraPrice, isSelected && s.extraPriceSelected]}>
                        +₹{parseFloat(extra.price).toFixed(0)}
                      </Text>
                      <Text style={[s.extraName, isSelected && s.extraNameSelected]} numberOfLines={1}>
                        {extra.name}
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
        {/* Quantity controller pill */}
        <View style={s.qtyPill}>
          <TouchableOpacity 
            style={s.qtyBtn} 
            activeOpacity={0.75}
            onPress={() => setQuantity(q => Math.max(1, q - 1))}
          >
            <Text style={s.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={s.qtyText}>{quantity < 10 ? `0${quantity}` : quantity}</Text>
          <TouchableOpacity 
            style={[s.qtyBtn, s.qtyBtnPlus]} 
            activeOpacity={0.75}
            onPress={() => setQuantity(q => q + 1)}
          >
            <Text style={[s.qtyBtnText, { color: '#FFFFFF' }]}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Primary Checkout Button */}
        <TouchableOpacity
          style={s.nextBtn}
          activeOpacity={0.88}
          disabled={addingToCart}
          onPress={handleConfirmAddToCart}
        >
          {addingToCart ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={s.nextBtnTxt}>Next - ₹{getCurrentTotal().toFixed(0)}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CARD_BORDER = 36;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Header ──
  headerSafeArea: {
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 12 : 12,
    paddingBottom: 10,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 3 },
    }),
  },
  circleBtnTxt: {
    fontSize: 18,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // ── Floating Hero image ──
  heroContainer: {
    width: SCREEN_W,
    height: SCREEN_H * 0.38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    zIndex: 1,
  },
  heroImage: {
    width: '88%',
    height: '100%',
  },

  // ── Details Card ──
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: CARD_BORDER,
    borderTopRightRadius: CARD_BORDER,
    paddingTop: 28,
    paddingHorizontal: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // ── Name & Price Row ──
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 10,
    letterSpacing: -0.3,
  },
  heartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    fontSize: 20,
    color: '#1A1A1A',
    marginTop: 1,
  },
  heartIconActive: {
    color: '#EF4444',
  },
  priceRow: {
    fontSize: 14.5,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 16,
  },
  priceValue: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#1A1A1A',
  },

  // ── Description ──
  description: {
    fontSize: 13.5,
    color: '#6B7280',
    lineHeight: 22,
  },
  readMoreBtn: {
    color: '#1A1A1A',
    fontWeight: '800',
  },

  // ── Sizing selector ──
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    letterSpacing: -0.1,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sizePill: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sizePillSelected: {
    backgroundColor: '#FFF3EE',
    borderColor: '#FF6B35',
  },
  sizePillPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
    marginBottom: 2,
  },
  sizePillPriceSelected: {
    color: '#FF6B35',
  },
  sizePillLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#AAAAAA',
    textAlign: 'center',
  },
  sizePillLabelSelected: {
    color: '#FF6B35',
  },

  // ── Horizontal Extras Addons ──
  extrasScroll: {
    gap: 12,
    paddingBottom: 6,
  },
  extraCard: {
    width: 128,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
    }),
  },
  extraCardSelected: {
    backgroundColor: '#FFF3EE',
    borderColor: '#FF6B35',
  },
  extraPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  extraPriceSelected: {
    color: '#FF6B35',
  },
  extraName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  extraNameSelected: {
    color: '#FF6B35',
    fontWeight: '600',
  },

  // ── Bottom Bar ──
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 32 : 18,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
    gap: 14,
  },
  qtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 30,
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 12,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 1 },
    }),
  },
  qtyBtnPlus: {
    backgroundColor: '#1C1C2E',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 22,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    minWidth: 22,
    textAlign: 'center',
  },
  nextBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#1C1C2E',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
    }),
  },
  nextBtnTxt: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});