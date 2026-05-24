import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { clearSession } from '../utils/session';
import {
  getMenu,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getMyOrders,
  createOrder,
  cancelOrder,
  getAddresses,
  addAddress,
  deleteAddress,
  createPaymentOrder,
  verifyPayment,
  getFavorites,
  addFavorite,
  removeFavorite,
  validatePromoCode,
  getPromoCodes,
} from '../lib/api';

// ─── Theme Design Tokens ──────────────────────────────────
const T = {
  bg: '#F5F6FA',
  surface: '#FFFFFF',
  accent: '#FF5A30',
  accentBg: '#FFF4F1',
  dark: '#1C1C2E',
  text: '#111111',
  sub: '#9CA3AF',
  border: '#F0F0F5',
  star: '#FBBF24',
  green: '#16A34A',
  greenBg: '#F0FDF4',
  shadow: 'rgba(0,0,0,0.06)',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#FBBF24',
  preparing: '#3B82F6',
  ready: '#8B5CF6',
  delivered: '#16A34A',
  cancelled: '#EF4444',
};

// ─── Location & Delivery Boundary Constants ───────────────────
const STORE_LAT = 28.6692; // Ghaziabad Kitchen coordinates
const STORE_LON = 77.4538;
const MAX_DELIVERY_RADIUS_KM = 6.0;

// Haversine formula to compute exact distance in Kilometers
const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const CATEGORIES = [
  { id: 'burger', label: 'Burger', image: require('../../assets/burger.png') },
  { id: 'pizza', label: 'Pizza', image: require('../../assets/PIZZA.png') },
  { id: 'fries', label: 'Fries', image: require('../../assets/fries.png') },
  { id: 'drink', label: 'Drink', image: require('../../assets/drinks.png') },
];

const RESTAURANTS = [
  { id: '1', name: 'Burger Palace', type: 'Burgers & Snacks', rating: '4.9', time: '15–20 min', emoji: '🍔', freeDelivery: true },
  { id: '2', name: 'Pizzeria Roma', type: 'Pizza & Pasta', rating: '4.8', time: '20–30 min', emoji: '🍕', freeDelivery: false },
  { id: '3', name: 'Tokyo Garden', type: 'Japanese Cuisine', rating: '4.9', time: '25–35 min', emoji: '🍣', freeDelivery: true },
  { id: '4', name: 'Fresh Squeeze', type: 'Drinks & Bowls', rating: '4.7', time: '10–15 min', emoji: '🥤', freeDelivery: false },
];

const NAV_ITEMS = [
  { id: 'home', label: 'Home', image: require('../../assets/tabs/home (1).png') },
  { id: 'fav', label: 'Favorites', image: require('../../assets/tabs/favouriet.png') },
  { id: 'cart', label: 'Cart', image: require('../../assets/tabs/cart.png'), showBadge: true },
  { id: 'profile', label: 'Profile', image: require('../../assets/tabs/user (2).png') },
];

const { width: SW } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const LAYOUT_MAX_W = 600;
const ACTUAL_LAYOUT_W = isWeb ? Math.min(SW, LAYOUT_MAX_W) : SW;
const CARD_W = Math.floor((ACTUAL_LAYOUT_W - 48) / 2);

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
  if (n.includes('pizza') || n.includes('pasta') || n.includes('arrabiata')) return require('../../assets/PIZZA.png');
  if (n.includes('fries') || n.includes('french')) return require('../../assets/fries.png');
  if (n.includes('coffee') || n.includes('drink') || n.includes('tea') || n.includes('shake') || n.includes('smoothie')) return require('../../assets/drinks.png');
  return require('../../assets/burger.png'); // default fallback
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

// Removed duplicate CATEGORIES, using global CATEGORIES instead

// Removed POPULAR_FOODS mock data, using real menu items from database

// ─── Sub-components ───────────────────────────────────────────────────────────

const CategoryPill = ({ item, selected, onPress }: any) => (
  <TouchableOpacity
    style={[s.pill, selected && s.pillSelected]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Image source={item.image} style={s.pillImage} />
    <Text style={[s.pillText, selected && s.pillTextSelected]}>
      {item.label}
    </Text>
  </TouchableOpacity>
);

const FoodCard = ({ item, cartQty, cartItem, onAddToCart, onUpdateQty, isLiked, onToggleLike }: any) => {
  const cardWidth = ACTUAL_LAYOUT_W * 0.62;

  return (
    <View style={[s.card, { width: cardWidth }]}>
      <Image source={getDishImage(item.name)} style={s.cardImage} />

      {/* Price badge */}
      <View style={s.priceBadge}>
        <Text style={s.priceText}>₹{item.price}</Text>
      </View>

      {/* Heart button */}
      <TouchableOpacity
        style={[s.heartBtn, isLiked && s.heartBtnActive]}
        onPress={() => onToggleLike(item.id)}
        activeOpacity={0.8}
      >
        <Text style={s.heartIcon}>{isLiked ? '❤️' : '🤍'}</Text>
      </TouchableOpacity>

      {/* Bottom strip */}
      <View style={s.cardBottom}>
        <Text style={s.cardName}>{item.name}</Text>
        
        {cartQty > 0 ? (
          <View style={s.popularQtyControl}>
            <TouchableOpacity style={s.popularSmallBtn} onPress={() => onUpdateQty(cartItem?.cart_item_id, cartItem?.quantity, false)}>
              <Text style={s.popularSmallBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={s.popularQtyText}>{cartQty}</Text>
            <TouchableOpacity style={s.popularSmallBtn} onPress={() => onUpdateQty(cartItem?.cart_item_id, cartItem?.quantity, true)}>
              <Text style={s.popularSmallBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={s.addBtn} activeOpacity={0.85} onPress={() => onAddToCart(item)}>
            <Text style={s.addBtnText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export const CustomerDashboard = ({ navigation }: any) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState<'home' | 'fav' | 'orders' | 'cart' | 'profile'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [placingOrder, setPlacingOrder] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  
  // Coupons modal states
  const [couponsModalVisible, setCouponsModalVisible] = useState(false);
  const [allCoupons, setAllCoupons] = useState<any[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  const fetchCouponsForUser = async () => {
    setLoadingCoupons(true);
    try {
      const res = await getPromoCodes();
      // Filter for active coupons only
      setAllCoupons(Array.isArray(res) ? res.filter((c: any) => c.active) : []);
    } catch (e) {
      console.error('Failed to load coupons', e);
    }
    setLoadingCoupons(false);
  };

  // Checkout Order Placement & Bill Confirmation States
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);

  // Address form modal state
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // ─── Location State Hooks ─────────────────────────────────
  const [locationState, setLocationState] = useState<'checking' | 'requesting' | 'detecting' | 'valid' | 'out_of_range' | 'manual_input'>('checking');
  const [detectedLocation, setDetectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    distance: number;
  } | null>(null);
  const [manualAddressInput, setManualAddressInput] = useState('');
  const [manualSearchLoading, setManualSearchLoading] = useState(false);
  const [manualSearchError, setManualSearchError] = useState('');

  // Configured storefront location from Admin database
  const [storeLocation, setStoreLocation] = useState({
    address: 'Ghaziabad Center, Uttar Pradesh, India',
    latitude: 28.6692,
    longitude: 77.4538
  });

  const fetchActiveKitchen = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/kitchen', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.latitude && data.longitude) {
          setStoreLocation(data);
          console.log('[Location] Synchronized kitchen coordinates:', data.address, data.latitude, data.longitude);
        }
      }
    } catch (e) {
      console.error('Failed to synchronize kitchen location settings:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Synchronize active storefront settings
      await fetchActiveKitchen();

      // Load persisted location from AsyncStorage
      try {
        const savedLoc = await AsyncStorage.getItem('@delivery_location');
        if (savedLoc) {
          const parsed = JSON.parse(savedLoc);
          if (parsed && parsed.valid) {
            setDetectedLocation(parsed);
            setLocationState('valid');
          } else {
            setLocationState('requesting');
          }
        } else {
          setLocationState('requesting');
        }
      } catch (e) {
        console.error('Failed to load saved location:', e);
        setLocationState('requesting');
      }

      if (user) {
        await loadData(user.id);
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  // GPS Automatic Location Detection Handler
  const handleDetectGPS = async () => {
    setLocationState('detecting');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please grant GPS permission to automatically detect your coordinates, or type your address manually.',
          [
            { text: 'Try Manual Input', onPress: () => setLocationState('manual_input') },
            { text: 'Cancel', style: 'cancel', onPress: () => setLocationState('requesting') }
          ]
        );
        return;
      }

      const currentPos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      const { latitude, longitude } = currentPos.coords;

      const distance = getDistanceInKm(latitude, longitude, storeLocation.latitude, storeLocation.longitude);

      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      let addressString = 'Ghaziabad, India';
      if (geocode && geocode[0]) {
        const item = geocode[0];
        const parts = [
          item.name || item.street || '',
          item.district || item.subregion || item.city || ''
        ].filter(Boolean);
        addressString = parts.length > 0 ? parts.join(', ') : 'Detected GPS Address';
      }

      const locationDetails = {
        latitude,
        longitude,
        address: addressString,
        distance: parseFloat(distance.toFixed(2)),
        valid: distance <= MAX_DELIVERY_RADIUS_KM
      };

      setDetectedLocation(locationDetails);

      if (locationDetails.valid) {
        await AsyncStorage.setItem('@delivery_location', JSON.stringify(locationDetails));
        setLocationState('valid');
        Alert.alert('📍 Location Set Successfully', `Delivering to: ${addressString}`);
      } else {
        setLocationState('out_of_range');
      }
    } catch (e: any) {
      console.error('GPS Detection failed:', e);
      Alert.alert('GPS Detection Failed', 'We could not fetch your coordinates. Please try again or enter your address manually.');
      setLocationState('requesting');
    }
  };

  // Manual Geocode Address Search Handler
  const handleManualSearch = async () => {
    if (!manualAddressInput.trim()) {
      setManualSearchError('Please type a valid address.');
      return;
    }
    setManualSearchLoading(true);
    setManualSearchError('');
    try {
      const result = await Location.geocodeAsync(manualAddressInput);
      if (result && result.length > 0) {
        const { latitude, longitude } = result[0];
        const distance = getDistanceInKm(latitude, longitude, storeLocation.latitude, storeLocation.longitude);

        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        let addressString = manualAddressInput;
        if (geocode && geocode[0]) {
          const item = geocode[0];
          const parts = [
            item.name || item.street || '',
            item.district || item.subregion || item.city || ''
          ].filter(Boolean);
          addressString = parts.length > 0 ? parts.join(', ') : manualAddressInput;
        }

        const locationDetails = {
          latitude,
          longitude,
          address: addressString,
          distance: parseFloat(distance.toFixed(2)),
          valid: distance <= MAX_DELIVERY_RADIUS_KM
        };

        setDetectedLocation(locationDetails);

        if (locationDetails.valid) {
          await AsyncStorage.setItem('@delivery_location', JSON.stringify(locationDetails));
          setManualAddressInput('');
          setLocationState('valid');
          Alert.alert('📍 Location Set Successfully', `Delivering to: ${addressString}`);
        } else {
          setManualSearchError(`This address is ${locationDetails.distance} km away from our kitchen and is out of our ${MAX_DELIVERY_RADIUS_KM}km delivery radius.`);
          setLocationState('out_of_range');
        }
      } else {
        setManualSearchError('Address not found. Please verify the address and try again.');
      }
    } catch (e) {
      console.error('Manual search failed:', e);
      setManualSearchError('Failed to geocode address. Please make sure you are connected to the internet.');
    }
    setManualSearchLoading(false);
  };

  // Refresh cart quietly when coming back from other screens (like ItemDetail)
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const refreshCart = async () => {
        if (currentUser) {
          try {
            const cartData = await getCart(currentUser.id);
            if (isActive) setCart(cartData);
          } catch (e) {
            console.error('Failed to refresh cart on focus:', e);
          }
        }
      };
      refreshCart();
      return () => { isActive = false; };
    }, [currentUser])
  );

  const loadData = async (userId: string) => {
    setLoading(true);

    // ── Load menu first (public, no user needed) ──────────────────
    try {
      const menuData = await getMenu();
      console.log('[CustomerDashboard] Menu loaded:', menuData?.length, 'items');
      setMenuItems(Array.isArray(menuData) ? menuData : []);
    } catch (e) {
      console.error('[CustomerDashboard] Failed to load menu:', e);
    }

    // ── Load user-specific data (cart, orders, addresses, favorites) ─────────
    try {
      const [cartData, ordersData, addressData, favData] = await Promise.all([
        getCart(userId),
        getMyOrders(userId),
        getAddresses(userId),
        getFavorites(userId),
      ]);
      setCart(Array.isArray(cartData) ? cartData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);

      const addrList = Array.isArray(addressData) ? addressData : [];
      setAddresses(addrList);

      const favs = Array.isArray(favData) ? favData : [];
      const likedMap: Record<string, boolean> = {};
      favs.forEach((f: any) => {
        likedMap[f.menu_item_id] = true;
      });
      setLiked(likedMap);

      const defaultAddr = addrList.find((a: any) => a.is_default) || addrList[0];
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
    } catch (e) {
      console.error('[CustomerDashboard] Failed to load user data:', e);
    }

    setLoading(false);
  };

  const refreshData = async () => {
    if (!currentUser) return;
    setRefreshing(true);

    try {
      const menuData = await getMenu();
      setMenuItems(Array.isArray(menuData) ? menuData : []);
    } catch (e) {
      console.error('[CustomerDashboard] Refresh menu failed:', e);
    }

    try {
      const [cartData, ordersData, addressData, favData] = await Promise.all([
        getCart(currentUser.id),
        getMyOrders(currentUser.id),
        getAddresses(currentUser.id),
        getFavorites(currentUser.id),
      ]);
      setCart(Array.isArray(cartData) ? cartData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setAddresses(Array.isArray(addressData) ? addressData : []);

      const favs = Array.isArray(favData) ? favData : [];
      const likedMap: Record<string, boolean> = {};
      favs.forEach((f: any) => {
        likedMap[f.menu_item_id] = true;
      });
      setLiked(likedMap);
    } catch (e) {
      console.error('[CustomerDashboard] Refresh user data failed:', e);
    }

    setRefreshing(false);
  };

  const handleAddToCart = async (item: any) => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please log in to add items to your cart.');
      return;
    }
    try {
      await addToCart(currentUser.id, item.id, 1);
      const cartData = await getCart(currentUser.id);
      setCart(cartData);
      Alert.alert('🛍️ Added to Cart', `${item.name} has been added!`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not add item to cart');
    }
  };

  const handleUpdateQty = async (itemId: string, currentQty: number, increment: boolean) => {
    if (!currentUser) return;
    const newQty = increment ? currentQty + 1 : currentQty - 1;
    try {
      await updateCartItem(itemId, currentUser.id, newQty);
      const cartData = await getCart(currentUser.id);
      setCart(cartData);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not update quantity');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!currentUser) return;
    try {
      await removeCartItem(itemId, currentUser.id);
      const cartData = await getCart(currentUser.id);
      setCart(cartData);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not remove item');
    }
  };

  const handleClearCart = async () => {
    if (!currentUser) return;
    try {
      await clearCart(currentUser.id);
      setCart([]);
      Alert.alert('Cart Cleared', 'Your shopping basket is now empty.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not clear cart');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelOrder(orderId);
              await refreshData();
              Alert.alert('Order Cancelled', 'Your order was successfully cancelled.');
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Could not cancel order');
            }
          }
        }
      ]
    );
  };

  const handleAddAddress = async () => {
    if (!currentUser) return;
    if (!receiverName || !phoneNumber || !addressLine1 || !city || !state || !postalCode) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    try {
      const isFirstAddress = addresses.length === 0;
      await addAddress({
        customer_id: currentUser.id,
        receiver_name: receiverName,
        phone_number: phoneNumber,
        address_line1: addressLine1,
        address_line2: addressLine2,
        city,
        state,
        postal_code: postalCode,
        is_default: isFirstAddress,
      });

      setReceiverName('');
      setPhoneNumber('');
      setAddressLine1('');
      setAddressLine2('');
      setCity('');
      setState('');
      setPostalCode('');
      setAddressModalVisible(false);

      const addressData = await getAddresses(currentUser.id);
      setAddresses(addressData);

      const defaultAddr = addressData.find((a: any) => a.is_default) || addressData[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      }

      Alert.alert('Address Added', 'Your delivery address was successfully created!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not add address');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!currentUser) return;
    try {
      await deleteAddress(id);
      const addressData = await getAddresses(currentUser.id);
      setAddresses(addressData);
      if (selectedAddressId === id) {
        const nextAddr = addressData.find((a: any) => a.is_default) || addressData[0];
        setSelectedAddressId(nextAddr ? nextAddr.id : null);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not delete address');
    }
  };

  const handleCheckout = async () => {
    if (!currentUser) return;
    if (cart.length === 0) {
      Alert.alert('Cart is empty', 'Add delicious items to place your order!');
      return;
    }
    if (!selectedAddressId) {
      Alert.alert('Address Required', 'Please add a delivery address first in the Profile tab.');
      setActiveNav('profile');
      return;
    }

    setPlacingOrder(true);
    try {
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const totalAmount = Math.max(0, subtotal - discount);

      // Create the order directly, bypassing payment gateway integration!
      const newOrder = await createOrder({
        customer_id: currentUser.id,
        customer_email: currentUser.email,
        items: cart.map(item => ({
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total: totalAmount,
        address_id: selectedAddressId,
        payment_status: 'pending', // Pending payment at door / Cash on Delivery
        promo_code: discount > 0 ? promoCode.trim().toUpperCase() : undefined,
        discount_amount: discount > 0 ? discount : undefined,
      });

      // Clear checkout inputs and store placed order details for the Confirmation Bill
      setPromoCode('');
      setDiscount(0);
      setPlacedOrder(newOrder);
      setCart([]); // Clear the user's cart
      setConfirmationModalVisible(true); // Open the Confirmation Bill modal overlay
      
      // Quietly reload data to keep listings in sync
      await refreshData();
    } catch (e: any) {
      Alert.alert('Checkout Error', e.message || 'An unexpected error occurred.');
    }
    setPlacingOrder(false);
  };

  const toggleLike = useCallback(async (id: string) => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please log in to add favorites.');
      return;
    }

    // Optimistic UI update
    setLiked(prev => {
      const isLiked = !!prev[id];
      return { ...prev, [id]: !isLiked };
    });

    try {
      if (liked[id]) {
        await removeFavorite(currentUser.id, id);
      } else {
        await addFavorite(currentUser.id, id);
      }
    } catch (e: any) {
      // Revert on failure
      setLiked(prev => {
        const isLiked = !!prev[id];
        return { ...prev, [id]: !isLiked };
      });
      Alert.alert('Error', e.message || 'Could not update favorites');
    }
  }, [currentUser, liked]);

  const toggleCat = useCallback((id: string) => {
    setActiveCat(prev => (prev === id ? null : id));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await clearSession();
    navigation.replace('Login');
  };

  const getCartQty = (menuItemId: string) => {
    const item = cart.find(c => c.id === menuItemId);
    return item ? item.quantity : 0;
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      Alert.alert('Promo Code Required', 'Please enter a promo code.');
      return;
    }
    try {
      const res = await validatePromoCode(promoCode, subtotal);
      if (res.valid) {
        setDiscount(res.discountAmount);
        Alert.alert(
          '🎉 Promo Code Applied!',
          `You saved ₹${res.discountAmount.toFixed(2)} with code ${res.code}!`
        );
      } else {
        setDiscount(0);
        Alert.alert('Promo Code Error', res.reason || 'Invalid promo code');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not validate promo code');
      setDiscount(0);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTotal = Math.max(0, subtotal - discount);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const recommendedItems = menuItems
    .filter(item => !cart.some(cartItem => cartItem.id === item.id))
    .slice(0, 5);

  // Dynamic filter for food items based on active category pill and search query
  const filteredFoods = menuItems.filter(f => {
    // 1. Filter by category pill if selected
    if (activeCategory) {
      const cat = f.category?.toLowerCase() || '';
      const name = f.name?.toLowerCase() || '';
      const desc = f.description?.toLowerCase() || '';
      const targetCat = activeCategory.toLowerCase();

      if (targetCat === 'burger') {
        if (!cat.includes('burger') && !name.includes('burger')) return false;
      } else if (targetCat === 'pizza') {
        if (!cat.includes('pizza') && !name.includes('pizza')) return false;
      } else if (targetCat === 'fries') {
        if (!cat.includes('fries') && !cat.includes('sides') && !name.includes('fries')) return false;
      } else if (targetCat === 'drink') {
        if (!cat.includes('drink') && !cat.includes('beverage') && !cat.includes('coffee') && !name.includes('coffee') && !name.includes('lemonade') && !name.includes('smoothie')) return false;
      } else {
        if (!cat.includes(targetCat) && !name.includes(targetCat) && !desc.includes(targetCat)) return false;
      }
    }

    // 2. Filter by search query if typed
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const name = f.name?.toLowerCase() || '';
      const cat = f.category?.toLowerCase() || '';
      const desc = f.description?.toLowerCase() || '';

      if (!name.includes(query) && !cat.includes(query) && !desc.includes(query)) return false;
    }

    return true;
  });

  const selectedAddressObj = addresses.find(a => a.id === selectedAddressId);

  if (locationState === 'checking' || loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={T.accent} />
        <Text style={s.loadingText}>Configuring secure delivery zones...</Text>
      </View>
    );
  }

  if (locationState === 'requesting' || locationState === 'detecting') {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: T.dark }]}>
        <StatusBar barStyle="light-content" backgroundColor={T.dark} />
        <View style={[s.root, isWeb && s.webWrapper, { justifyContent: 'center', padding: 24, backgroundColor: T.dark }]}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,90,48,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 64 }}>📍</Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 12 }}>
              Delivery Location Required
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 }}>
              To view the menu and order fresh meals, please share your location. We deliver within a strict {MAX_DELIVERY_RADIUS_KM}km boundary of our kitchen located in {storeLocation.address?.split(',')[0] || 'Ghaziabad'}.
            </Text>
          </View>

          {locationState === 'detecting' ? (
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <ActivityIndicator size="large" color={T.accent} />
              <Text style={{ color: '#fff', marginTop: 16, fontSize: 15, fontWeight: '600' }}>
                Detecting coordinates via GPS...
              </Text>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#CCFF00', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', ...shadow(4) }}
                onPress={handleDetectGPS}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#111', fontWeight: '850', fontSize: 16 }}>
                  📍 Share Current Location (GPS)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => setLocationState('manual_input')}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                  ✍️ Enter Address Manually
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (locationState === 'out_of_range') {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: T.dark }]}>
        <StatusBar barStyle="light-content" backgroundColor={T.dark} />
        <View style={[s.root, isWeb && s.webWrapper, { justifyContent: 'center', padding: 24, backgroundColor: T.dark }]}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(239,68,68,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 64 }}>🛵❌</Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 12 }}>
              Out of Delivery Range
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 12 }}>
              Our central kitchen is located in {storeLocation.address?.split(',')[0] || 'Ghaziabad'} and can only deliver fresh meals within a {MAX_DELIVERY_RADIUS_KM}km radius.
            </Text>
          </View>

          {detectedLocation && (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 32 }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                Detected Location
              </Text>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '750', marginBottom: 10 }}>
                📍 {detectedLocation.address}
              </Text>
              <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 10 }} />
              <Text style={{ color: T.accent, fontSize: 15, fontWeight: '800' }}>
                📏 Distance: {detectedLocation.distance} km away (Exceeds 6km limit)
              </Text>
            </View>
          )}

          <View style={{ gap: 14 }}>
            <TouchableOpacity
              style={{ backgroundColor: T.accent, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', ...shadow(4) }}
              onPress={() => setLocationState('manual_input')}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                ✍️ Enter a Delivery Address
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' }}
              onPress={handleDetectGPS}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                🔄 Re-detect GPS Location
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (locationState === 'manual_input') {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: T.dark }]}>
        <StatusBar barStyle="light-content" backgroundColor={T.dark} />
        <View style={[s.root, isWeb && s.webWrapper, { padding: 24, backgroundColor: T.dark, justifyContent: 'space-between' }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 30 }}>
            <TouchableOpacity
              style={{ alignSelf: 'flex-start', paddingVertical: 10, paddingRight: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
              onPress={() => setLocationState('requesting')}
            >
              <Text style={{ color: T.accent, fontSize: 18, marginRight: 6 }}>←</Text>
              <Text style={{ color: T.accent, fontSize: 16, fontWeight: '700' }}>Back</Text>
            </TouchableOpacity>

            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 10 }}>
              Enter Address
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 20, marginBottom: 24 }}>
              Enter a delivery location (near our kitchen at {storeLocation.address || 'Ghaziabad'}) to confirm it is within range.
            </Text>

            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              Delivery Street or Sector
            </Text>
            <TextInput
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, height: 56, color: '#fff', paddingHorizontal: 16, fontSize: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 12 }}
              placeholder="e.g. Kavi Nagar, Ghaziabad"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={manualAddressInput}
              onChangeText={(text) => {
                setManualAddressInput(text);
                setManualSearchError('');
              }}
            />

            {manualSearchError ? (
              <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', marginBottom: 20 }}>
                <Text style={{ color: '#EF4444', fontSize: 13, lineHeight: 18, fontWeight: '600' }}>
                  ⚠️ {manualSearchError}
                </Text>
              </View>
            ) : null}

            {manualSearchLoading ? (
              <ActivityIndicator size="large" color={T.accent} style={{ marginVertical: 20 }} />
            ) : (
              <TouchableOpacity
                style={{ backgroundColor: '#CCFF00', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 10, ...shadow(4) }}
                onPress={handleManualSearch}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#111', fontWeight: '850', fontSize: 16 }}>
                  🔍 Search & Validate Address
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <TouchableOpacity
            style={{ borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}
            onPress={() => setLocationState('requesting')}
          >
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 15 }}>
              📍 Detect Coordinates (GPS)
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={T.surface} />
      <View style={[s.root, isWeb && s.webWrapper]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshData} colors={[T.accent]} />}
        >
          {/* ───────────────── HOME TAB ───────────────── */}
          {activeNav === 'home' && (
            <>
              {/* ── Header ── */}
              <View style={s.foodHomeHeader}>
                <TouchableOpacity
                  style={s.locationRow}
                  activeOpacity={0.7}
                  onPress={() => setLocationState('requesting')}
                >
                  <Image source={require('../../assets/navigation.png')} style={s.locationIconImg} resizeMode="contain" />
                  <Text style={[s.locationText, { maxWidth: ACTUAL_LAYOUT_W - 120 }]} numberOfLines={1}>
                    {detectedLocation?.address || 'Set Location'}
                  </Text>
                  <Text style={{ fontSize: 12, marginLeft: 4, color: T.accent }}>▼</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.heartCircle} activeOpacity={0.75} onPress={() => setActiveNav('cart')}>
                  <Image source={require('../../assets/tabs/cart.png')} style={s.heartCircleIconImg} resizeMode="contain" />
                  {cartCount > 0 && <View style={s.notifPip} />}
                </TouchableOpacity>
              </View>

              {/* ── Search ── */}
              <View style={s.searchBar}>
                <Image source={require('../../assets/search.png')} style={s.searchIconImg} resizeMode="contain" />
                <TextInput
                  style={s.searchInput}
                  placeholder="Type to search"
                  placeholderTextColor="#aaa"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* ── Categories ── */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.categoryRow}
              >
                {CATEGORIES.filter(c => c.id !== 'fries').map(cat => (
                  <CategoryPill
                    key={cat.id}
                    item={cat}
                    selected={activeCategory === cat.id}
                    onPress={() => setActiveCategory(prev => prev === cat.id ? '' : cat.id)}
                  />
                ))}
              </ScrollView>

              {/* ── Popular Food (Only visible when not searching or filtering) ── */}
              {!searchQuery && !activeCategory && (
                <>
                  <View style={s.foodHomeSectionHeader}>
                    <Text style={s.foodHomeSectionTitle}>Popular Food</Text>
                    <TouchableOpacity activeOpacity={0.7}>
                      <Text style={s.seeAllText}>See All</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Horizontal cards */}
                  <FlatList
                    data={menuItems.slice(0, 4)}
                    keyExtractor={i => i.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.cardList}
                    renderItem={({ item }) => (
                      <FoodCard 
                        item={item} 
                        cartQty={getCartQty(item.id)}
                        cartItem={cart.find((c: any) => c.id === item.id)}
                        onAddToCart={handleAddToCart}
                        onUpdateQty={handleUpdateQty}
                        isLiked={liked[item.id]}
                        onToggleLike={toggleLike}
                      />
                    )}
                    snapToInterval={ACTUAL_LAYOUT_W * 0.62 + 16}
                    decelerationRate="fast"
                  />
                </>
              )}

              {/* Menu Items Grid */}
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>
                  {searchQuery || activeCategory ? 'Search Results' : 'Menu'}
                </Text>
                <Text style={s.seeAll}>Our Dishes</Text>
              </View>

              <View style={s.foodGrid}>
                {filteredFoods.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.fcard, { width: CARD_W }]}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
                  >
                    <View style={s.fcardImg}>
                      <Image source={getDishImage(item.name)} style={s.fcardImage} />

                      <TouchableOpacity
                        style={s.likeBtn}
                        onPress={() => toggleLike(item.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={s.likeTxt}>{liked[item.id] ? '❤️' : '🤍'}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={s.fcardBody}>
                      <Text style={s.fcardName} numberOfLines={1}>{item.name}</Text>
                      <Text style={s.fcardShop} numberOfLines={1}>
                        {item.description || 'Cooked fresh by top chefs.'}
                      </Text>
                      <View style={s.fcardFoot}>
                        <Text style={s.fcardPrice}>₹{item.price}</Text>

                        <View style={s.qtyControlRow}>
                          {getCartQty(item.id) > 0 && (
                            <>
                              <TouchableOpacity
                                style={s.smallQtyBtn}
                                onPress={() => {
                                  const cartItem = cart.find(c => c.id === item.id);
                                  if (cartItem) handleUpdateQty(cartItem.cart_item_id, cartItem.quantity, false);
                                }}
                              >
                                <Text style={s.smallQtyBtnText}>−</Text>
                              </TouchableOpacity>
                              <Text style={s.qtyCardText}>{getCartQty(item.id)}</Text>
                            </>
                          )}

                          <TouchableOpacity style={s.addBtn} onPress={() => handleAddToCart(item)} activeOpacity={0.8}>
                            <Text style={s.addBtnTxt}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}

                {filteredFoods.length === 0 && (
                  <View style={s.empty}>
                    <Text style={s.emptyTxt}>
                      {searchQuery || activeCategory
                        ? 'No dishes match your search 🍽'
                        : 'No dishes available in the kitchen 🍽'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Near You restaurants list (Only visible when not searching or filtering) */}
              {!searchQuery && !activeCategory && (
                <>
                  <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>Near you</Text>
                    <Text style={s.seeAll}>Online Kitchens</Text>
                  </View>

                  <FlatList
                    data={RESTAURANTS}
                    keyExtractor={i => i.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.restList}
                    renderItem={({ item }) => (
                      <View style={s.rcard}>
                        <View style={s.rcardThumb}>
                          <Text style={s.rcardEmoji}>{item.emoji}</Text>
                        </View>
                        <View style={s.rcardInfo}>
                          <Text style={s.rcardName} numberOfLines={1}>{item.name}</Text>
                          <Text style={s.rcardType}>{item.type}</Text>
                          <View style={s.rcardMeta}>
                            <Text style={s.rcardStar}>★ {item.rating}</Text>
                            <View style={s.rcardDot} />
                            <Text style={s.rcardTime}>{item.time}</Text>
                            {item.freeDelivery && (
                              <View style={s.freeBadge}>
                                <Text style={s.freeTxt}>Free</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    )}
                  />
                </>
              )}
            </>
          )}

          {/* ───────────────── FAVORITES TAB ───────────────── */}
          {activeNav === 'fav' && (
            <View style={s.tabWrapper}>
              <Text style={s.tabTitle}>My Favorites</Text>
              <Text style={s.tabSub}>Loved food collections</Text>

              <View style={s.foodGrid}>
                {menuItems.filter(f => liked[f.id]).map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.fcard, { width: CARD_W }]}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
                  >
                    <View style={s.fcardImg}>
                      <Image source={getDishImage(item.name)} style={s.fcardImage} />
                      <TouchableOpacity style={s.likeBtn} onPress={() => toggleLike(item.id)}>
                        <Text style={s.likeTxt}>❤️</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={s.fcardBody}>
                      <Text style={s.fcardName} numberOfLines={1}>{item.name}</Text>
                      <View style={s.fcardFoot}>
                        <Text style={s.fcardPrice}>₹{item.price}</Text>
                        <TouchableOpacity style={s.addBtn} onPress={() => handleAddToCart(item)}>
                          <Text style={s.addBtnTxt}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
                {menuItems.filter(f => liked[f.id]).length === 0 && (
                  <View style={s.empty}>
                    <Text style={s.emptyTxt}>Liked items will appear here ❤️</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ───────────────── ORDERS TAB ───────────────── */}
          {activeNav === 'orders' && (
            <View style={s.tabWrapper}>
              <Text style={s.tabTitle}>Order Status</Text>
              <Text style={s.tabSub}>Track preparation details</Text>

              {orders.length === 0 ? (
                <View style={s.empty}>
                  <Text style={s.emptyTxt}>No active orders placed 📋</Text>
                </View>
              ) : (
                orders.map(order => (
                  <View key={order.id} style={s.orderHistoryCard}>
                    <View style={s.orderHistoryHeader}>
                      <Text style={s.orderHistoryId}>Order #{order.id?.slice(-6)}</Text>
                      <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[order.status] || '#555' }]}>
                        <Text style={s.statusBadgeText}>{order.status?.toUpperCase()}</Text>
                      </View>
                    </View>

                    {order.items && (
                      <Text style={s.orderHistoryItems}>
                        🛍️ {JSON.parse(typeof order.items === 'string' ? order.items : JSON.stringify(order.items))
                          .map((i: any) => `${i.name} x${i.quantity}`).join(', ')}
                      </Text>
                    )}

                    {order.addresses && (
                      <Text style={s.orderHistoryAddr}>
                        📍 Delivery: {order.addresses.receiver_name} - {order.addresses.address_line1}, {order.addresses.city}
                      </Text>
                    )}

                    <View style={s.orderHistoryBottom}>
                      <Text style={s.orderHistoryTotal}>Total Paid: ₹{order.total}</Text>
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <TouchableOpacity
                          style={s.cancelOrderBtn}
                          onPress={() => handleCancelOrder(order.id)}
                        >
                          <Text style={s.cancelOrderBtnTxt}>Cancel</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* ───────────────── CART TAB ───────────────── */}
          {activeNav === 'cart' && (
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
                    {cart.map(item => (
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
                        {recommendedItems.map(item => (
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
                              <Text style={{ fontSize: 13, fontWeight: '850', color: T.text }}>
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
                        {addresses.map(addr => (
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
          )}

          {/* ───────────────── PROFILE TAB ───────────────── */}
          {activeNav === 'profile' && (
            <View style={s.tabWrapper}>
              <View style={s.profileHeader}>
                <View style={s.profileAvatar}>
                  <Text style={{ fontSize: 36 }}>👤</Text>
                </View>
                <Text style={s.profileEmail}>{currentUser?.email}</Text>
                <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
                  <Text style={s.logoutBtnText}>Sign Out</Text>
                </TouchableOpacity>
              </View>

              {/* Delivery addresses details */}
              <View style={s.profileCardContainer}>
                <View style={s.profileSectionHeader}>
                  <Text style={s.profileSectionTitle}>Delivery Addresses</Text>
                  <TouchableOpacity
                    style={s.profileAddAddrBtn}
                    onPress={() => setAddressModalVisible(true)}
                  >
                    <Text style={s.profileAddAddrBtnText}>+ Add New</Text>
                  </TouchableOpacity>
                </View>

                {addresses.length === 0 ? (
                  <Text style={s.emptyAddressesText}>No addresses created yet. Add one above!</Text>
                ) : (
                  addresses.map(addr => (
                    <View key={addr.id} style={s.profileAddrCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.profileAddrReceiver}>
                          {addr.receiver_name} {addr.is_default && '(Default)'}
                        </Text>
                        <Text style={s.profileAddrText}>{addr.address_line1}, {addr.address_line2}</Text>
                        <Text style={s.profileAddrText}>{addr.city}, {addr.state} - {addr.postal_code}</Text>
                        <Text style={s.profileAddrPhone}>📞 {addr.phone_number}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteAddress(addr.id)}>
                        <Text style={{ color: T.accent, fontWeight: '700', fontSize: 13 }}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={s.bottomNav}>
          {NAV_ITEMS.map(nav => (
            <TouchableOpacity
              key={nav.id}
              style={s.navItem}
              onPress={() => setActiveNav(nav.id as any)}
              activeOpacity={0.7}
            >
              <View style={{ position: 'relative' }}>
                <View style={[s.navIconWrap, activeNav === nav.id && s.navIconActive]}>
                  <Image
                    source={nav.image}
                    style={[
                      s.navIconImage,
                      { tintColor: activeNav === nav.id ? T.text : T.sub }
                    ]}
                  />
                </View>
                {nav.showBadge && cartCount > 0 && (
                  <View style={s.navBadge}>
                    <Text style={s.navBadgeTxt}>{cartCount > 99 ? '99+' : cartCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[s.navLabel, activeNav === nav.id && s.navLabelActive]}>
                {nav.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Address creation Modal */}
      <Modal
        visible={addressModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add Delivery Address</Text>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                <Text style={s.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={s.modalContent}>
              <Text style={s.inputLabel}>Receiver Name *</Text>
              <TextInput
                style={s.modalInput}
                placeholder="e.g. Akanksha Singh"
                placeholderTextColor="#777"
                value={receiverName}
                onChangeText={setReceiverName}
              />

              <Text style={s.inputLabel}>Phone Number *</Text>
              <TextInput
                style={s.modalInput}
                placeholder="e.g. +91 98765 43210"
                placeholderTextColor="#777"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />

              <Text style={s.inputLabel}>Address Line 1 *</Text>
              <TextInput
                style={s.modalInput}
                placeholder="e.g. Sector 15, Flat 402"
                placeholderTextColor="#777"
                value={addressLine1}
                onChangeText={setAddressLine1}
              />

              <Text style={s.inputLabel}>Address Line 2 (Optional)</Text>
              <TextInput
                style={s.modalInput}
                placeholder="e.g. Near Central Park"
                placeholderTextColor="#777"
                value={addressLine2}
                onChangeText={setAddressLine2}
              />

              <View style={s.inputRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={s.inputLabel}>City *</Text>
                  <TextInput
                    style={s.modalInput}
                    placeholder="e.g. Delhi"
                    placeholderTextColor="#777"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>State *</Text>
                  <TextInput
                    style={s.modalInput}
                    placeholder="e.g. Delhi"
                    placeholderTextColor="#777"
                    value={state}
                    onChangeText={setState}
                  />
                </View>
              </View>

              <Text style={s.inputLabel}>Postal Code *</Text>
              <TextInput
                style={s.modalInput}
                placeholder="e.g. 110001"
                placeholderTextColor="#777"
                keyboardType="number-pad"
                value={postalCode}
                onChangeText={setPostalCode}
              />

              <TouchableOpacity style={s.saveAddrBtn} onPress={handleAddAddress}>
                <Text style={s.saveAddrBtnText}>💾 Save Address</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* View All Coupons Modal */}
      <Modal
        visible={couponsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCouponsModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalContainer, { maxHeight: '75%' }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>🏷️ Available Coupons</Text>
              <TouchableOpacity onPress={() => setCouponsModalVisible(false)}>
                <Text style={s.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingCoupons ? (
              <ActivityIndicator color={T.accent} style={{ marginVertical: 30 }} />
            ) : (
              <ScrollView contentContainerStyle={{ padding: 16 }}>
                {allCoupons.length === 0 ? (
                  <Text style={{ textAlign: 'center', color: T.sub, marginVertical: 20 }}>No coupons available right now</Text>
                ) : (
                  allCoupons.map((coupon) => {
                    const isEligible = subtotal >= parseFloat(coupon.min_order_value);
                    return (
                      <TouchableOpacity
                        key={coupon.id}
                        disabled={!isEligible}
                        onPress={() => {
                          setPromoCode(coupon.code);
                          setDiscount(coupon.discount_type === 'percentage' 
                            ? parseFloat(((subtotal * parseFloat(coupon.discount_value)) / 100).toFixed(2))
                            : Math.min(parseFloat(coupon.discount_value), subtotal)
                          );
                          setCouponsModalVisible(false);
                          Alert.alert('🎉 Promo Applied!', `You saved ₹${
                            (coupon.discount_type === 'percentage' 
                              ? (subtotal * parseFloat(coupon.discount_value)) / 100
                              : Math.min(parseFloat(coupon.discount_value), subtotal)
                            ).toFixed(2)
                          } with code ${coupon.code}!`);
                        }}
                        style={{
                          backgroundColor: isEligible ? '#E5E7EB' : '#F3F4F6', // Highlight grey bg if eligible, faint grey if not
                          borderRadius: 12,
                          padding: 16,
                          marginBottom: 12,
                          borderWidth: 1.5,
                          borderColor: isEligible ? '#9CA3AF' : '#E5E7EB',
                          opacity: isEligible ? 1 : 0.6,
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 16, fontWeight: '800', color: T.dark, letterSpacing: 0.5 }}>
                            🎫 {coupon.code}
                          </Text>
                          {isEligible ? (
                            <View style={{ backgroundColor: '#00C853', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                              <Text style={{ fontSize: 10, color: '#fff', fontWeight: 'bold' }}>APPLY NOW</Text>
                            </View>
                          ) : (
                            <View style={{ backgroundColor: '#D1D5DB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                              <Text style={{ fontSize: 10, color: '#4B5563', fontWeight: 'bold' }}>LOCKED</Text>
                            </View>
                          )}
                        </View>

                        <Text style={{ fontSize: 14, fontWeight: '700', color: T.text, marginTop: 6 }}>
                          {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% Off` : `Flat ₹${coupon.discount_value} Off`}
                        </Text>

                        <Text style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>
                          🛒 Valid on orders above ₹{parseFloat(coupon.min_order_value).toFixed(2)}
                        </Text>

                        {!isEligible && (
                          <Text style={{ fontSize: 11, color: T.accent, fontWeight: '600', marginTop: 8 }}>
                            💡 Add ₹{(parseFloat(coupon.min_order_value) - subtotal).toFixed(2)} more to unlock this coupon!
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Bill Confirmation success Modal */}
      <Modal
        visible={confirmationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setConfirmationModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalContainer, { maxHeight: '80%' }]}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              {/* Success Badge */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: '#E8F5E9',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 12
                }}>
                  <Text style={{ fontSize: 36 }}>🎉</Text>
                </View>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#1B5E20', textAlign: 'center' }}>
                  Order Placed Successfully!
                </Text>
                <Text style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>
                  Estimated preparation time: 25-35 mins
                </Text>
              </View>

              {placedOrder ? (
                <>
                  {/* Order ID & Status */}
                  <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: T.sub }}>Order Code:</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: T.dark }}>
                        #{placedOrder.id?.slice(-6).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: T.sub }}>Payment Status:</Text>
                      <View style={{ backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#E65100' }}>CASH ON DELIVERY</Text>
                      </View>
                    </View>
                  </View>

                  {/* Items list */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: T.dark, marginBottom: 10 }}>
                      Ordered Items:
                    </Text>
                    {JSON.parse(typeof placedOrder.items === 'string' ? placedOrder.items : JSON.stringify(placedOrder.items || '[]')).map((item: any, idx: number) => (
                      <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
                        <Text style={{ fontSize: 13, color: T.text, flex: 1 }} numberOfLines={1}>
                          🍽️ {item.name} <Text style={{ color: T.sub, fontWeight: '700' }}>x{item.quantity}</Text>
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: T.dark }}>
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Delivery Location Summary */}
                  {selectedAddressObj && (
                    <View style={{ marginBottom: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F0F0F5', paddingVertical: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: T.dark, marginBottom: 6 }}>
                        Delivering To:
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: T.text }}>
                        📍 {selectedAddressObj.receiver_name}
                      </Text>
                      <Text style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>
                        {selectedAddressObj.address_line1}, {selectedAddressObj.city}
                      </Text>
                      <Text style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>
                        📞 {selectedAddressObj.phone_number}
                      </Text>
                    </View>
                  )}

                  {/* Bill Details Summary */}
                  <View style={{ backgroundColor: '#EEF2F6', borderRadius: 12, padding: 14, marginBottom: 20 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: T.dark, marginBottom: 10 }}>
                      Final Bill Summary:
                    </Text>
                    
                    {placedOrder.discount_amount > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 }}>
                        <Text style={{ fontSize: 13, color: '#388E3C', fontWeight: '600' }}>Applied Promo:</Text>
                        <Text style={{ fontSize: 13, color: '#388E3C', fontWeight: '700' }}>
                          🎫 {placedOrder.promo_code}
                        </Text>
                      </View>
                    )}

                    {placedOrder.discount_amount > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 }}>
                        <Text style={{ fontSize: 13, color: '#388E3C', fontWeight: '600' }}>Discount Savings:</Text>
                        <Text style={{ fontSize: 13, color: '#388E3C', fontWeight: '700' }}>
                          - ₹{parseFloat(placedOrder.discount_amount).toFixed(2)}
                        </Text>
                      </View>
                    )}

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 }}>
                      <Text style={{ fontSize: 13, color: T.sub, fontWeight: '600' }}>Delivery Fee:</Text>
                      <Text style={{ fontSize: 13, color: '#388E3C', fontWeight: '700' }}>FREE</Text>
                    </View>

                    <View style={{ height: 1, backgroundColor: '#D1D5DB', marginVertical: 8 }} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 15, fontWeight: '900', color: T.dark }}>Total Bill Amount:</Text>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: T.accent }}>
                        ₹{parseFloat(placedOrder.total).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </>
              ) : null}

              {/* Action Buttons */}
              <View style={{ gap: 10 }}>
                <TouchableOpacity
                  onPress={() => {
                    setConfirmationModalVisible(false);
                    setActiveNav('orders');
                  }}
                  style={{
                    backgroundColor: '#CCFF00',
                    height: 50,
                    borderRadius: 25,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: '#111'
                  }}
                >
                  <Text style={{ color: '#111', fontWeight: '850', fontSize: 15 }}>
                    🛵 Track Active Orders
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setConfirmationModalVisible(false);
                    setActiveNav('home');
                  }}
                  style={{
                    borderWidth: 1.5,
                    borderColor: '#E5E7EB',
                    height: 50,
                    borderRadius: 25,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: T.sub, fontWeight: '700', fontSize: 14 }}>
                    Go Back to Home
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.surface },
  root: { flex: 1, backgroundColor: T.bg },
  scrollContent: { paddingBottom: 110 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg },
  loadingText: { marginTop: 12, color: T.accent, fontSize: 16, fontWeight: '700' },

  webWrapper: {
    maxWidth: LAYOUT_MAX_W,
    alignSelf: 'center',
    width: '100%',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
    height: '100%',
    backgroundColor: T.bg,
  },

  // ── Header ──────────────────────
  header: { backgroundColor: T.surface },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 14,
    backgroundColor: T.surface,
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: T.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  iconCircleTxt: { fontSize: 17 },
  notifPip: {
    position: 'absolute', top: 7, right: 7,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: T.accent,
    borderWidth: 1.5, borderColor: T.surface,
  },
  locBlock: { alignItems: 'center', flex: 1, marginHorizontal: 12 },
  locLabel: { fontSize: 11, color: T.sub, fontWeight: '500', letterSpacing: 0.3 },
  locRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, justifyContent: 'center' },
  locDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: T.accent, marginRight: 4 },
  locName: { fontSize: 14, fontWeight: '700', color: T.text, maxWidth: 160 },
  locCaret: { fontSize: 14, color: T.sub, fontWeight: '700' },

  // ── Banner ──────────────────────
  banner: {
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: T.dark,
    borderRadius: 24,
    paddingTop: 22, paddingLeft: 22, paddingRight: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    overflow: 'hidden',
    minHeight: 160,
    ...shadow(6),
  },
  bannerCircle1: {
    position: 'absolute', right: -50, top: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  bannerCircle2: {
    position: 'absolute', left: -20, bottom: -30,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  bannerLeft: { flex: 1, zIndex: 2, paddingBottom: 22 },
  bannerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,90,48,0.18)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  bannerBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: T.accent },
  bannerBadgeTxt: { fontSize: 9, fontWeight: '800', color: T.accent, letterSpacing: 0.8 },
  bannerTitle: {
    fontSize: 21, fontWeight: '800', color: '#fff',
    lineHeight: 27, marginBottom: 5,
  },
  bannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 18, fontWeight: '400' },
  bannerBtn: {
    backgroundColor: T.accent, borderRadius: 14,
    paddingHorizontal: 18, paddingVertical: 10, alignSelf: 'flex-start',
  },
  bannerBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  bannerPlate: {
    width: 120, height: 140, justifyContent: 'center', alignItems: 'center', zIndex: -10,
  },
  bannerImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },

  // ── Section header ───────────────
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 22, paddingBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: T.text },
  seeAll: { fontSize: 13, fontWeight: '600', color: T.accent },

  // ── Categories ───────────────────
  catList: { paddingHorizontal: 20, gap: 10 },
  catPill: { alignItems: 'center', gap: 7 },
  catBox: {
    width: 86, height: 86, borderRadius: 24,
    backgroundColor: T.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
    ...shadow(2),
  },
  catBoxActive: { backgroundColor: T.accentBg, borderColor: T.accent },
  catImage: {
    width: 66,
    height: 66,
    resizeMode: 'contain',
  },
  catLabel: { fontSize: 11, fontWeight: '600', color: T.sub },
  catLabelActive: { color: T.accent },

  // ── Food grid ────────────────────
  foodGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 14,
  },
  fcard: {
    backgroundColor: T.surface,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadow(4),
    padding: 8,
  },
  fcardImg: {
    width: '100%', aspectRatio: 1.1,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    position: 'relative',
  },
  fcardEmoji: { fontSize: 62 },
  fcardImage: {
    width: '85%',
    height: '85%',
    resizeMode: 'contain',
  },
  likeBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  likeTxt: { fontSize: 20 },
  ratingBadge: {
    position: 'absolute', bottom: 9, left: 9,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
    ...shadow(2),
  },
  ratingStar: { color: T.star, fontSize: 11 },
  ratingTxt: { fontSize: 11, fontWeight: '700', color: T.text },
  fcardBody: { paddingTop: 10, paddingHorizontal: 4 },
  fcardName: { fontSize: 14, fontWeight: '700', color: '#1C1C2E', marginBottom: 4 },
  fcardShop: { fontSize: 11, color: '#9CA3AF', fontWeight: '400', marginBottom: 10 },
  fcardFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fcardPrice: { fontSize: 16, fontWeight: '800', color: '#1C1C2E' },
  qtyControlRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  smallQtyBtn: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  smallQtyBtnText: { color: '#111111', fontWeight: 'bold', fontSize: 12 },
  qtyCardText: { color: '#111111', fontWeight: '700', fontSize: 12 },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#CCFF00',
    alignItems: 'center', justifyContent: 'center',
    ...shadow(2),
  },
  addBtnTxt: { fontSize: 18, fontWeight: '700', color: '#111111', lineHeight: 22 },

  // ── Empty state ───────────────────
  empty: { flex: 1, paddingVertical: 32, alignItems: 'center', width: '100%' },
  emptyTxt: { color: T.sub, fontSize: 14 },

  // ── Restaurants ──────────────────
  restList: { paddingHorizontal: 16, gap: 12 },
  rcard: {
    backgroundColor: T.surface,
    borderRadius: 18, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    width: 240,
    ...shadow(3),
  },
  rcardThumb: {
    width: 58, height: 58, borderRadius: 14,
    backgroundColor: T.accentBg,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  rcardEmoji: { fontSize: 30 },
  rcardInfo: { flex: 1 },
  rcardName: { fontSize: 13, fontWeight: '700', color: T.text },
  rcardType: { fontSize: 11, color: T.sub, fontWeight: '500', marginTop: 1 },
  rcardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 5, flexWrap: 'wrap' },
  rcardStar: { fontSize: 11, fontWeight: '700', color: T.text },
  rcardDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#D1D5DB' },
  rcardTime: { fontSize: 11, color: T.sub, fontWeight: '500' },
  freeBadge: { backgroundColor: T.greenBg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  freeTxt: { fontSize: 10, fontWeight: '700', color: T.green },

  // Tabs general layouts
  tabWrapper: { paddingHorizontal: 16, paddingTop: 12 },
  tabTitle: { fontSize: 22, fontWeight: '900', color: T.text },
  tabSub: { fontSize: 13, color: T.sub, marginTop: 3, marginBottom: 16 },

  // Orders Tab
  orderHistoryCard: {
    backgroundColor: T.surface, borderRadius: 18, padding: 16, marginBottom: 12,
    ...shadow(3),
  },
  orderHistoryCardActive: { borderColor: T.accent, borderWidth: 1 },
  orderHistoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderHistoryId: { fontWeight: '800', fontSize: 14, color: T.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { color: T.surface, fontSize: 10, fontWeight: '900' },
  orderHistoryItems: { fontSize: 13, color: T.text, marginBottom: 6 },
  orderHistoryAddr: { fontSize: 11, color: T.sub, marginBottom: 10 },
  orderHistoryBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderHistoryTotal: { fontWeight: '800', fontSize: 14, color: T.accent },
  cancelOrderBtn: { backgroundColor: T.accentBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  cancelOrderBtnTxt: { color: T.accent, fontWeight: '850', fontSize: 11 },

  // Cart Tab Premium
  exploreBtn: { backgroundColor: T.accent, borderRadius: 20, paddingHorizontal: 22, paddingVertical: 10, marginTop: 16 },
  exploreBtnText: { color: T.surface, fontWeight: '800', fontSize: 13 },
  cartItemsContainer: { marginTop: 10, paddingHorizontal: 4 },
  cartPremiumCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, flexDirection: 'row',
    marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, alignItems: 'center'
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

  promoSection: { marginTop: 16 },
  promoInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  promoInput: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, height: 50,
    fontSize: 14, color: '#111', borderWidth: 1, borderColor: '#EEEEEE', marginRight: 12
  },
  promoApplyBtn: { backgroundColor: '#111', height: 50, borderRadius: 16, justifyContent: 'center', paddingHorizontal: 24 },
  promoApplyBtnTxt: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  premiumCheckoutBtn: {
    backgroundColor: '#CCFF00', borderRadius: 30, height: 60, marginTop: 24,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#CCFF00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5
  },
  premiumCheckoutBtnTxt: { color: '#111', fontWeight: '800', fontSize: 16 },

  checkoutAddrIconWrapper: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F0F5',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8
  },
  checkoutAddrIcon: { fontSize: 16 },

  checkoutSection: { marginTop: 16 },
  checkoutSectionTitle: { fontSize: 15, fontWeight: '800', color: T.text, marginBottom: 8 },
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
  checkoutAddrName: { color: T.text, fontWeight: '850', fontSize: 13, marginBottom: 4 },
  checkoutAddrText: { color: T.sub, fontSize: 11 },

  billingCard: { backgroundColor: T.surface, borderRadius: 18, padding: 16, marginTop: 16, ...shadow(3) },
  billingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billingLabel: { color: T.sub, fontSize: 13 },
  billingVal: { color: T.text, fontWeight: '700', fontSize: 13 },
  billingTotalLabel: { color: T.text, fontSize: 15, fontWeight: '800' },
  billingTotalVal: { color: T.accent, fontWeight: '950', fontSize: 16 },

  cartActionRow: { gap: 10, marginTop: 20 },
  checkoutBtn: { backgroundColor: T.accent, borderRadius: 16, padding: 16, alignItems: 'center' },
  checkoutBtnText: { color: T.surface, fontWeight: '900', fontSize: 15 },
  clearCartBtn: { backgroundColor: T.bg, borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: T.border },
  clearCartBtnText: { color: T.sub, fontWeight: '700', fontSize: 13 },

  // Profile Tab
  profileHeader: { alignItems: 'center', marginVertical: 20 },
  profileAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: T.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 12, ...shadow(2) },
  profileEmail: { fontSize: 16, fontWeight: '800', color: T.text },
  logoutBtn: { backgroundColor: T.accentBg, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, marginTop: 12 },
  logoutBtnText: { color: T.accent, fontWeight: '700', fontSize: 12 },

  profileCardContainer: { backgroundColor: T.surface, borderRadius: 18, padding: 16, marginTop: 16, ...shadow(3) },
  profileSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  profileSectionTitle: { fontSize: 15, fontWeight: '800', color: T.text },
  profileAddAddrBtn: { backgroundColor: T.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  profileAddAddrBtnText: { color: T.surface, fontWeight: 'bold', fontSize: 11 },
  emptyAddressesText: { color: T.sub, fontSize: 13, textAlign: 'center', marginVertical: 12 },

  profileAddrCard: {
    borderBottomWidth: 1, borderColor: T.border, paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  profileAddrReceiver: { color: T.text, fontWeight: '800', fontSize: 13 },
  profileAddrText: { color: T.sub, fontSize: 11, marginTop: 2 },
  profileAddrPhone: { color: T.sub, fontSize: 11, marginTop: 2 },

  // ── Bottom nav ───────────────────
  bottomNav: {
    backgroundColor: T.surface,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 20,
    right: 20,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 12,
      },
    }),
  },
  navItem: { alignItems: 'center', gap: 2, minWidth: 56 },
  navIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  navIconActive: { backgroundColor: T.accentBg },
  navIconImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#CBD5E1' },
  navLabelActive: { color: T.accent },
  navBadge: {
    position: 'absolute', top: 4, right: 4,
    minWidth: 15, height: 15, borderRadius: 8,
    backgroundColor: T.accent,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: T.surface,
  },
  navBadgeTxt: { fontSize: 8, fontWeight: '800', color: '#fff' },

  // Address Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: T.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderColor: T.border },
  modalTitle: { fontSize: 17, fontWeight: '900', color: T.text },
  closeModalText: { fontSize: 18, color: T.sub, fontWeight: 'bold' },
  modalContent: { padding: 18 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: T.sub, marginBottom: 4 },
  modalInput: { backgroundColor: T.bg, borderRadius: 10, padding: 12, fontSize: 13, color: T.text, marginBottom: 14, borderWidth: 1, borderColor: T.border },
  inputRow: { flexDirection: 'row' },
  saveAddrBtn: { backgroundColor: T.accent, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  saveAddrBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  /* New FoodHomeScreen Styles */
  foodHomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationIcon: {
    fontSize: 16,
  },
  locationIconImg: {
    width: 26,
    height: 26,
  },
  locationText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  heartCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartCircleIcon: {
    fontSize: 18,
  },
  heartCircleIconImg: {
    width: 26,
    height: 26,
  },

  /* Search */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ececec',
    borderRadius: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchIconImg: {
    width: 18,
    height: 18,
    marginRight: 8,
    tintColor: '#aaa',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    padding: 0,
  },

  /* Categories */
  categoryRow: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 50,
    paddingHorizontal: 22,
    paddingVertical: 14,
    gap: 10,
  },
  pillSelected: {
    backgroundColor: '#1a1a1a',
  },
  pillImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  pillText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  pillTextSelected: {
    color: '#fff',
  },

  /* Section header */
  foodHomeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  foodHomeSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  seeAllText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },

  /* Card list */
  cardList: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },

  /* Card */
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    position: 'relative',
    height: 220,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  /* Price badge */
  priceBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  priceText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Heart button */
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  heartBtnActive: {
    backgroundColor: '#fff',
  },
  heartIcon: {
    fontSize: 17,
  },

  /* Card bottom */
  cardBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  cardName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  addBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  popularQtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 12,
  },
  popularSmallBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popularSmallBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginTop: -2,
  },
  popularQtyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});