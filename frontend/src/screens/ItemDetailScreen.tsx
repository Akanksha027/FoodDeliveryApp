import React, { useEffect, useState, useRef } from 'react';
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
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { getMenuItem, getMenu, addToCart } from '../lib/api';
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
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedSize, setSelectedSize] = useState(1); // default Medium
  const [extrasModalVisible, setExtrasModalVisible] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  // Button animation values
  const btnWidth = useRef(new Animated.Value(1)).current;       // scale X for "shrink to circle"
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const cartIconTranslate = useRef(new Animated.Value(0)).current;
  const cartTextOpacity = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(0.4)).current;
  const btnBgAnim = useRef(new Animated.Value(0)).current;      // 0=orange 1=dark

  // Toast
  const toastAnim = useRef(new Animated.Value(-120)).current;
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    Animated.sequence([
      Animated.spring(toastAnim, { toValue: 60, useNativeDriver: true, speed: 14, bounciness: 8 }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: -120, duration: 280, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      try {
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

  const runAddToCartAnimation = () => {
    // Step 1: Slide cart icon left & fade text out
    Animated.parallel([
      Animated.timing(cartIconTranslate, { toValue: -30, duration: 220, useNativeDriver: true }),
      Animated.timing(cartTextOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      // Step 2: Fade in the checkmark
      Animated.parallel([
        Animated.spring(checkScale, { toValue: 1, speed: 18, bounciness: 10, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(btnBgAnim, { toValue: 1, duration: 250, useNativeDriver: false }),
      ]).start(() => {
        setAddedToCart(true);
        // Step 3: After a beat, reverse back to normal
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(checkOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
            Animated.spring(checkScale, { toValue: 0.4, speed: 18, bounciness: 4, useNativeDriver: true }),
            Animated.timing(btnBgAnim, { toValue: 0, duration: 250, useNativeDriver: false }),
          ]).start(() => {
            Animated.parallel([
              Animated.timing(cartIconTranslate, { toValue: 0, duration: 220, useNativeDriver: true }),
              Animated.timing(cartTextOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
            ]).start(() => setAddedToCart(false));
          });
        }, 1400);
      });
    });
  };

  const handleConfirmAddToCart = async (extrasToAdd: any[] = []) => {
    setExtrasModalVisible(false);
    setAddingToCart(true);
    runAddToCartAnimation();

    try {
      await addToCart(currentUser.id, item.id, 1);
      for (const extra of extrasToAdd) {
        await addToCart(currentUser.id, extra.id, 1);
      }
      showToast(extrasToAdd.length > 0 
        ? `✅ Item & ${extrasToAdd.length} extra(s) added!` 
        : 'Item added to cart!'
      );
    } catch (e: any) {
      showToast(e.message || 'Could not add to cart');
    }
    setAddingToCart(false);
    setSelectedExtras([]);
  };

  const handleAddToCart = async () => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please log in to add items to your cart.');
      return;
    }
    if (addingToCart || addedToCart) return;

    const recs = getRecommendedExtras();
    if (recs.length > 0) {
      setExtrasModalVisible(true);
    } else {
      await handleConfirmAddToCart([]);
    }
  };

  const bgColor = btnBgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FF6B35', '#1A1A1A'],
  });

  const sizePrice = (basePrice: any) => {
    const parsedBase = typeof basePrice === 'string' ? parseFloat(basePrice) : (basePrice || 0);
    const offset = SIZE_OPTIONS[selectedSize].price;
    return (parsedBase + offset).toFixed(2);
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

  if (loading || !item) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Toast ── */}
      {toastVisible && (
        <Animated.View style={[s.toast, { transform: [{ translateY: toastAnim }] }]}>
          <Text style={s.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}

      {/* ── HERO IMAGE ── */}
      <View style={s.heroContainer}>
        <Image
          source={getDishImage(item.name)}
          style={s.heroImage}
          resizeMode="cover"
        />
        {/* gradient overlay */}
        <View style={s.heroGradient} />

        {/* Header on top of image */}
        <SafeAreaView style={s.headerSafeArea}>
          <View style={s.header}>
            <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Text style={s.iconTxt}>←</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>Details</Text>
            <TouchableOpacity style={s.iconBtn} activeOpacity={0.8}>
              <Text style={s.iconTxtMore}>•••</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* ── WHITE CARD ── */}
      <View style={s.card}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          bounces={false}
        >
          {/* Brand logo + name row */}
          <View style={s.namePriceRow}>
            <View style={s.nameGroup}>
              {/* Brand icon placeholder */}
              <View style={s.brandBadge}>
                <Text style={s.brandBadgeTxt}>🍕</Text>
              </View>
              <View>
                <Text style={s.itemName}>{item.name}</Text>
                <Text style={s.brandName}>Pizza Hut</Text>
              </View>
            </View>
            {/* Favorite heart */}
            <TouchableOpacity style={s.heartBtn} activeOpacity={0.7}>
              <Text style={s.heartIcon}>♡</Text>
            </TouchableOpacity>
          </View>

          {/* Rating + Price */}
          <View style={s.ratingPriceRow}>
            <View style={s.ratingGroup}>
              <Text style={s.star}>★</Text>
              <Text style={s.ratingVal}>4.9</Text>
              <Text style={s.ratingCount}>(1.2k)</Text>
            </View>
            <Text style={s.price}>₹{isPizza ? sizePrice(item.price) : parseFloat(item.price).toFixed(2)}</Text>
          </View>

          {/* Size selector */}
          {isPizza && (
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
                      ₹{(parseFloat(item.price) + opt.price).toFixed(2)}
                    </Text>
                    <Text style={[s.sizePillLabel, selected && s.sizePillLabelSelected]}>
                      {opt.size} - {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Details section */}
          <Text style={s.sectionTitle}>Details</Text>
          <Text style={s.description}>
            {item.description
              ? item.description
              : `${item.name} is a delicious classic topped with golden melted cheese and rich flavor. Made fresh daily with the finest ingredients for your perfect meal.`}
          </Text>
        </ScrollView>

        {/* ── Add to Cart button ── */}
        <View style={s.bottomBar}>
          <TouchableOpacity
            onPress={handleAddToCart}
            activeOpacity={0.92}
            disabled={addingToCart || addedToCart}
            style={s.cartBtnWrapper}
          >
            <Animated.View style={[s.cartBtn, { backgroundColor: bgColor }]}>
              {/* Cart icon circle (left side) */}
              <Animated.View style={[s.cartIconCircle, { transform: [{ translateX: cartIconTranslate }] }]}>
                {/* Cart SVG-like icon using text */}
                <Text style={s.cartIcon}>🛒</Text>
              </Animated.View>

              {/* "Add to Cart" text */}
              <Animated.Text style={[s.cartBtnText, { opacity: cartTextOpacity }]}>
                Add to Cart
              </Animated.Text>

              {/* Checkmark (appears on success) */}
              <Animated.View style={[
                s.checkmarkWrap,
                { opacity: checkOpacity, transform: [{ scale: checkScale }] }
              ]}>
                <Text style={s.checkmark}>✓</Text>
              </Animated.View>

              {/* Arrow icon (right side) */}
              <Animated.View style={[s.arrowCircle, { opacity: cartTextOpacity }]}>
                <Text style={s.arrowIcon}>→</Text>
              </Animated.View>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recommended Extras Modal */}
      <Modal
        visible={extrasModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setExtrasModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalContainer, { maxHeight: '80%' }]}>
            {/* Pull handle bar */}
            <View style={{
              width: 42,
              height: 5,
              borderRadius: 3,
              backgroundColor: '#E2E8F0',
              alignSelf: 'center',
              marginTop: 10,
              marginBottom: 2,
            }} />

            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>🎉 Complete Your Meal</Text>
              <TouchableOpacity onPress={() => setExtrasModalVisible(false)}>
                <Text style={s.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 20 }}>
              <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 16, fontWeight: '500' }}>
                Would you like to add some delicious sides or beverages to accompany your <Text style={{ fontWeight: '700', color: '#1A1A1A' }}>{item.name}</Text>?
              </Text>

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
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 16,
                      padding: 14,
                      marginBottom: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1.5,
                      borderColor: isSelected ? '#FF6B35' : '#E2E8F0',
                      ...Platform.select({
                        ios: {
                          shadowColor: '#000',
                          shadowOpacity: 0.03,
                          shadowRadius: 6,
                          shadowOffset: { width: 0, height: 2 },
                        },
                        android: { elevation: 2 },
                      }),
                    }}
                  >
                    {/* Emoji / Icon Container */}
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: '#FFF3EE',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 14,
                    }}>
                      <Text style={{ fontSize: 24 }}>
                        {extra.name.toLowerCase().includes('naan') ? '🫓' :
                         extra.name.toLowerCase().includes('fries') ? '🍟' :
                         extra.name.toLowerCase().includes('coffee') ? '🥤' :
                         extra.name.toLowerCase().includes('brownie') ? '🍰' : '😋'}
                      </Text>
                    </View>

                    {/* Extra Details */}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14.5, fontWeight: '700', color: '#1A1A1A' }}>
                        {extra.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, fontWeight: '500' }}>
                        {extra.category || 'Add-on'}
                      </Text>
                    </View>

                    {/* Price & Selection Checkbox */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: isSelected ? '#FF6B35' : '#4B5563' }}>
                        + ₹{parseFloat(extra.price).toFixed(0)}
                      </Text>
                      
                      <View style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: isSelected ? '#FF6B35' : '#CBD5E1',
                        backgroundColor: isSelected ? '#FF6B35' : 'transparent',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        {isSelected && (
                          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>✓</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Footer Actions */}
            <View style={{
              padding: 20,
              borderTopWidth: 1,
              borderColor: '#F0F0F5',
              backgroundColor: '#FFFFFF',
            }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  const extrasToAdd = getRecommendedExtras().filter(e => selectedExtras.includes(e.id));
                  handleConfirmAddToCart(extrasToAdd);
                }}
                style={{
                  backgroundColor: '#FF6B35',
                  borderRadius: 16,
                  paddingVertical: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15.5 }}>
                  {selectedExtras.length > 0 
                    ? `Add Selected Extras & Continue (+₹${getRecommendedExtras()
                        .filter(e => selectedExtras.includes(e.id))
                        .reduce((sum, e) => sum + parseFloat(e.price), 0)
                        .toFixed(0)})` 
                    : 'Continue With Item Only'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleConfirmAddToCart([])}
                style={{
                  paddingVertical: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 14 }}>
                  Skip & Continue Without Extras
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const CARD_BORDER = 32;
const HERO_HEIGHT = SCREEN_H * 0.46;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F4F0',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F7F4F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Toast ──
  toast: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 999,
    backgroundColor: '#1C1C2E',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  toastText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── Hero ──
  heroContainer: {
    width: SCREEN_W,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    // simulated gradient: transparent top → dark bottom
    backgroundColor: 'transparent',
  },
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 12,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  iconTxt: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
  },
  iconTxtMore: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // ── Card ──
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: CARD_BORDER,
    borderTopRightRadius: CARD_BORDER,
    marginTop: -CARD_BORDER,
    paddingTop: 24,
    paddingHorizontal: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // ── Name / Price ──
  namePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF3EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  brandBadgeTxt: {
    fontSize: 22,
  },
  itemName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  brandName: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
    marginTop: 1,
  },
  heartBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    fontSize: 18,
    color: '#333',
  },

  // ── Rating + Price ──
  ratingPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  ratingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: {
    fontSize: 15,
    color: '#FFC107',
  },
  ratingVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  ratingCount: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
  },

  // ── Size Selector ──
  sizeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 26,
  },
  sizePill: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
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

  // ── Description ──
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#777',
    lineHeight: 22,
  },

  // ── Bottom Bar ──
  bottomBar: {
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
  },
  cartBtnWrapper: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: 50,
    paddingHorizontal: 10,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 16,
    elevation: 10,
    position: 'relative',
  },
  cartIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 8,
  },
  cartIcon: {
    fontSize: 20,
  },
  cartBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  checkmarkWrap: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  arrowCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 8,
  },
  arrowIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderColor: '#F0F0F5' },
  modalTitle: { fontSize: 17, fontWeight: '900', color: '#1a1a1a' },
  closeModalText: { fontSize: 18, color: '#9CA3AF', fontWeight: 'bold' },
});