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
} from 'react-native';
import { getMenuItem, addToCart } from '../lib/api';
import { supabase } from '../lib/supabase';

const { width: SCREEN_W } = Dimensions.get('window');

// Reusing the same image resolution logic
const getDishImage = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('burger')) return require('../../assets/burger.png');
  if (n.includes('pizza') || n.includes('pasta') || n.includes('arrabiata')) return require('../../assets/pizza.jpg');
  if (n.includes('fries') || n.includes('french')) return require('../../assets/fries.png');
  if (n.includes('coffee') || n.includes('drink') || n.includes('tea') || n.includes('shake') || n.includes('smoothie')) return require('../../assets/drinks.png');
  return require('../../assets/burger.png'); // default fallback
};

export const ItemDetailScreen = ({ route, navigation }: any) => {
  const { itemId } = route.params;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Toast notification animation
  const toastAnim = useRef(new Animated.Value(-100)).current;
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    Animated.sequence([
      Animated.spring(toastAnim, { toValue: 60, useNativeDriver: true, speed: 12, bounciness: 8 }),
      Animated.delay(2200),
      Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      try {
        const data = await getMenuItem(itemId);
        setItem(data);
      } catch (e: any) {
        Alert.alert('Error', 'Could not load item details.');
        navigation.goBack();
      }
      setLoading(false);
    };
    init();
  }, [itemId]);

  const handleAddToCart = async () => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please log in to add items to your cart.');
      return;
    }
    setAddingToCart(true);
    try {
      await addToCart(currentUser.id, item.id, quantity);
      showToast(`✅  ${item.name} x${quantity} added to cart!`);
    } catch (e: any) {
      showToast(`❌  ${e.message || 'Could not add item to cart'}`);
    }
    setAddingToCart(false);
  };

  if (loading || !item) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color="#CCFF00" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Background shape */}
      <View style={s.bgDark} />
      <View style={s.bgLight} />

      {/* Toast Notification */}
      {toastVisible && (
        <Animated.View style={[s.toastContainer, { transform: [{ translateY: toastAnim }] }]}>
          <Text style={s.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}

      <SafeAreaView style={s.safeArea}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
            <Text style={s.iconTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Details</Text>
          <TouchableOpacity style={s.iconBtn}>
            <Text style={s.iconTxtSmall}>📍</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
          {/* Product Image */}
          <View style={s.imageContainer}>
            <Image source={getDishImage(item.name)} style={s.productImage} resizeMode="contain" />
          </View>

          {/* Title & Location */}
          <Text style={s.title}>{item.name}</Text>
          <View style={s.locationRow}>
            <Text style={s.locationPin}>📍</Text>
            <Text style={s.locationText}>Naperville, Illinois</Text>
          </View>

          {/* Nutrition Facts */}
          <View style={s.nutritionCard}>
            <View style={s.nutriCol}>
              <Text style={s.nutriVal}>198</Text>
              <Text style={s.nutriLabel}>kcal</Text>
            </View>
            <View style={s.divider} />
            <View style={s.nutriCol}>
              <Text style={s.nutriVal}>25.2</Text>
              <Text style={s.nutriLabel}>proteins</Text>
            </View>
            <View style={s.divider} />
            <View style={s.nutriCol}>
              <Text style={s.nutriVal}>13.8</Text>
              <Text style={s.nutriLabel}>fats</Text>
            </View>
            <View style={s.divider} />
            <View style={s.nutriCol}>
              <Text style={s.nutriVal}>23.7</Text>
              <Text style={s.nutriLabel}>carbo</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={s.descTitle}>Description</Text>
          <Text style={s.description}>
            {item.description || 'A delicious dish prepared fresh by our top chefs with premium ingredients.'}
          </Text>

          {/* Price & Quantity Selector */}
          <View style={s.priceQtyRow}>
            <View>
              <Text style={s.priceLabel}>Price</Text>
              <Text style={s.priceVal}>₹{(item.price * quantity).toFixed(0)}</Text>
            </View>
            <View style={s.qtySelector}>
              <TouchableOpacity
                style={s.qtyBtn}
                onPress={() => setQuantity(q => Math.max(1, q - 1))}
                activeOpacity={0.7}
              >
                <Text style={s.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={s.qtyValue}>{quantity}</Text>
              <TouchableOpacity
                style={[s.qtyBtn, s.qtyBtnPlus]}
                onPress={() => setQuantity(q => q + 1)}
                activeOpacity={0.7}
              >
                <Text style={[s.qtyBtnText, s.qtyBtnPlusTxt]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Bar */}
        <View style={s.bottomBar}>
          <TouchableOpacity style={s.cartIconBtn} onPress={() => navigation.goBack()}>
            <Text style={s.cartBtnIcon}>🛍️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.buyBtn} onPress={handleAddToCart} disabled={addingToCart} activeOpacity={0.85}>
            {addingToCart ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={s.buyBtnText}>Add to Cart  •  ₹{(item.price * quantity).toFixed(0)}</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgDark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: '#4A4C50',
    borderBottomLeftRadius: 150,
  },
  bgLight: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F9F9F9',
    borderTopRightRadius: 150,
    zIndex: -1,
  },
  safeArea: {
    flex: 1,
  },
  // ── Toast ──────────────────────────────────────
  toastContainer: {
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
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 20,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  // ── Header ─────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconTxt: {
    fontSize: 24,
    color: '#000',
    fontWeight: '300',
    marginTop: -2,
  },
  iconTxtSmall: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // ── Content ────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  productImage: {
    width: '100%',
    height: 300,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  locationPin: {
    fontSize: 14,
    marginRight: 6,
    color: '#666',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  // ── Nutrition ──────────────────────────────────
  nutritionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  nutriCol: {
    flex: 1,
    alignItems: 'center',
  },
  nutriVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 4,
  },
  nutriLabel: {
    fontSize: 12,
    color: '#999999',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#EEEEEE',
  },
  // ── Description ────────────────────────────────
  descTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 30,
  },
  // ── Price & Qty ────────────────────────────────
  priceQtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  priceVal: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111',
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  qtyBtnPlus: {
    backgroundColor: '#CCFF00',
  },
  qtyBtnText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  qtyBtnPlusTxt: {
    color: '#111',
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    minWidth: 36,
    textAlign: 'center',
  },
  // ── Bottom Bar ─────────────────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 24,
    paddingBottom: 34,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  cartIconBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cartBtnIcon: {
    fontSize: 20,
  },
  buyBtn: {
    flex: 1,
    height: 60,
    backgroundColor: '#CCFF00',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
  },
});
