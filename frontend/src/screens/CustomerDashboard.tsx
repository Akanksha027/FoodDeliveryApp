import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { clearSession } from '../utils/session';
import { Loader } from '../components/Loader';
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

import { CustomerHomeScreen } from './CustomerHomeScreen';
import { CustomerFavoritesScreen } from './CustomerFavoritesScreen';
import { CustomerCartScreen } from './CustomerCartScreen';
import { CustomerProfileScreen } from './CustomerProfileScreen';

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
  { id: 'pizza', label: 'Pizza', image: require('../../assets/pizza.png') },
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
  { id: 'home', label: 'Home' },
  { id: 'fav', label: 'Catalog' },
  { id: 'cart', label: 'Cart', showBadge: true },
  { id: 'profile', label: 'Profile' },
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
  if (n.includes('pizza') || n.includes('pasta') || n.includes('arrabiata')) return require('../../assets/pizza.png');
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
          <TouchableOpacity style={s.addBtnCard} activeOpacity={0.85} onPress={() => onAddToCart(item)}>
            <Text style={s.addBtnText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export const CustomerDashboard = ({ navigation, route }: any) => {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (route.params?.tab) {
      setActiveNav(route.params.tab);
      navigation.setParams({ tab: undefined });
    }
  }, [route.params?.tab]);
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

  // Custom soft toast states for high-end alert replacement
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
  const [myOrdersModalVisible, setMyOrdersModalVisible] = useState(false);

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
      const res = await fetch('https://backend-akanksha-singhs-projects-40f191a2.vercel.app/api/kitchen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
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

  // ── AUTO CACHE WRITE HOOKS ──────────────────
  // Automatically write menu items to cache whenever they change
  useEffect(() => {
    if (menuItems.length === 0) return;
    const saveMenuCache = async () => {
      try {
        await AsyncStorage.setItem('@cache_menu_items', JSON.stringify(menuItems));
      } catch (e) {
        console.error('Failed to save menu cache:', e);
      }
    };
    saveMenuCache();
  }, [menuItems]);

  // Automatically write user data to cache whenever any user state changes
  useEffect(() => {
    if (!currentUser) return;
    const saveUserCache = async () => {
      try {
        const userData = {
          cart,
          orders,
          addresses,
          liked,
          selectedAddressId,
        };
        await AsyncStorage.setItem(`@cache_user_data_${currentUser.id}`, JSON.stringify(userData));
      } catch (e) {
        console.error('Failed to save user data cache:', e);
      }
    };
    saveUserCache();
  }, [currentUser, cart, orders, addresses, liked, selectedAddressId]);

  const loadData = async (userId: string) => {
    setLoading(true);

    // 1. Try to load from local cache first for instant startup
    try {
      const [cachedMenu, cachedUser] = await Promise.all([
        AsyncStorage.getItem('@cache_menu_items'),
        AsyncStorage.getItem(`@cache_user_data_${userId}`),
      ]);

      let hasMenuCache = false;
      let hasUserCache = false;

      if (cachedMenu) {
        const parsedMenu = JSON.parse(cachedMenu);
        if (Array.isArray(parsedMenu) && parsedMenu.length > 0) {
          setMenuItems(parsedMenu);
          hasMenuCache = true;
        }
      }

      if (cachedUser) {
        const parsedUser = JSON.parse(cachedUser);
        if (parsedUser) {
          if (Array.isArray(parsedUser.cart)) setCart(parsedUser.cart);
          if (Array.isArray(parsedUser.orders)) setOrders(parsedUser.orders);
          if (Array.isArray(parsedUser.addresses)) setAddresses(parsedUser.addresses);
          if (parsedUser.liked) setLiked(parsedUser.liked);
          if (parsedUser.selectedAddressId) setSelectedAddressId(parsedUser.selectedAddressId);
          hasUserCache = true;
        }
      }

      // If we have cached both menu and user data, dismiss loading instantly!
      if (hasMenuCache && hasUserCache) {
        setLoading(false);
      }
    } catch (cacheErr) {
      console.error('[CustomerDashboard] Cache read failed on loadData:', cacheErr);
    }

    // 2. Perform background fetches in the background (SWR pattern)
    // ── Load menu
    try {
      const menuData = await getMenu();
      const freshMenu = Array.isArray(menuData) ? menuData : [];
      setMenuItems(freshMenu);
    } catch (e) {
      console.error('[CustomerDashboard] Background menu load failed:', e);
    }

    // ── Load user data
    try {
      const [cartData, ordersData, addressData, favData] = await Promise.all([
        getCart(userId),
        getMyOrders(userId),
        getAddresses(userId),
        getFavorites(userId),
      ]);

      const freshCart = Array.isArray(cartData) ? cartData : [];
      const freshOrders = Array.isArray(ordersData) ? ordersData : [];
      const freshAddresses = Array.isArray(addressData) ? addressData : [];
      const freshFavs = Array.isArray(favData) ? favData : [];

      setCart(freshCart);
      setOrders(freshOrders);
      setAddresses(freshAddresses);

      const likedMap: Record<string, boolean> = {};
      freshFavs.forEach((f: any) => {
        likedMap[f.menu_item_id] = true;
      });
      setLiked(likedMap);

      const defaultAddr = freshAddresses.find((a: any) => a.is_default) || freshAddresses[0];
      if (defaultAddr && !selectedAddressId) {
        setSelectedAddressId(defaultAddr.id);
      }
    } catch (e) {
      console.error('[CustomerDashboard] Background user data load failed:', e);
    }

    // Ensure spinner is dismissed in case of no cache hits or background completion
    setLoading(false);
  };

  const refreshData = async () => {
    if (!currentUser) return;
    setRefreshing(true);

    try {
      const menuData = await getMenu();
      const freshMenu = Array.isArray(menuData) ? menuData : [];
      setMenuItems(freshMenu);
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

      const freshCart = Array.isArray(cartData) ? cartData : [];
      const freshOrders = Array.isArray(ordersData) ? ordersData : [];
      const freshAddresses = Array.isArray(addressData) ? addressData : [];
      const freshFavs = Array.isArray(favData) ? favData : [];

      setCart(freshCart);
      setOrders(freshOrders);
      setAddresses(freshAddresses);

      const likedMap: Record<string, boolean> = {};
      freshFavs.forEach((f: any) => {
        likedMap[f.menu_item_id] = true;
      });
      setLiked(likedMap);

      const defaultAddr = freshAddresses.find((a: any) => a.is_default) || freshAddresses[0];
      if (defaultAddr && !selectedAddressId) {
        setSelectedAddressId(defaultAddr.id);
      }
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

    // 1. Optimistic UI update
    const existingIndex = cart.findIndex(c => c.id === item.id);
    let updatedCart = [...cart];
    if (existingIndex !== -1) {
      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        quantity: updatedCart[existingIndex].quantity + 1
      };
    } else {
      updatedCart.push({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        cart_item_id: `temp_${Date.now()}` // temporary unique key for instant rendering
      });
    }
    setCart(updatedCart);

    // Optimistically update AsyncStorage cache
    await AsyncStorage.setItem(`@cache_cart_data_${currentUser.id}`, JSON.stringify(updatedCart)).catch(() => { });

    try {
      await addToCart(currentUser.id, item.id, 1);
      const cartData = await getCart(currentUser.id);
      setCart(cartData);
      await AsyncStorage.setItem(`@cache_cart_data_${currentUser.id}`, JSON.stringify(cartData)).catch(() => { });
      showToast(`${item.name} added to cart!`);
    } catch (e: any) {
      // Revert optimistic update by pulling fresh database data
      const cartData = await getCart(currentUser.id).catch(() => cart);
      setCart(cartData);
      await AsyncStorage.setItem(`@cache_cart_data_${currentUser.id}`, JSON.stringify(cartData)).catch(() => { });
      Alert.alert('Error', e.message || 'Could not add item to cart');
    }
  };

  const handleUpdateQty = async (itemId: string, currentQty: number, increment: boolean) => {
    if (!currentUser) return;
    const newQty = increment ? currentQty + 1 : currentQty - 1;

    // 1. Optimistic UI update
    let updatedCart = cart.map(c => {
      if (c.cart_item_id === itemId || c.id === itemId) {
        return { ...c, quantity: newQty };
      }
      return c;
    }).filter(c => c.quantity > 0);
    setCart(updatedCart);

    // Optimistically update AsyncStorage cache
    await AsyncStorage.setItem(`@cache_cart_data_${currentUser.id}`, JSON.stringify(updatedCart)).catch(() => { });

    try {
      if (newQty <= 0) {
        await removeCartItem(itemId, currentUser.id);
      } else {
        await updateCartItem(itemId, currentUser.id, newQty);
      }
      const cartData = await getCart(currentUser.id);
      setCart(cartData);
      await AsyncStorage.setItem(`@cache_cart_data_${currentUser.id}`, JSON.stringify(cartData)).catch(() => { });
    } catch (e: any) {
      // Revert optimistic update by pulling fresh database data
      const cartData = await getCart(currentUser.id).catch(() => cart);
      setCart(cartData);
      await AsyncStorage.setItem(`@cache_cart_data_${currentUser.id}`, JSON.stringify(cartData)).catch(() => { });
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
      showToast('⚠️ Please fill in all required fields.');
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

      showToast('✅ Address saved successfully!');
    } catch (e: any) {
      showToast(`❌ Error: ${e.message || 'Could not add address'}`);
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
      showToast('🗑️ Address deleted successfully!');
    } catch (e: any) {
      showToast(`❌ Error: ${e.message || 'Could not delete address'}`);
    }
  };

  const handleCheckout = async () => {
    if (!currentUser) return;
    if (cart.length === 0) {
      showToast('🛒 Your cart is empty!');
      return;
    }
    if (!selectedAddressId) {
      showToast('📍 Please add a delivery address first!');
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
        const cleanCat = cat.trim();
        const cleanTarget = targetCat.trim();
        const catSingular = cleanCat.endsWith('s') && cleanCat.length > 3 ? cleanCat.slice(0, -1) : cleanCat;
        const targetSingular = cleanTarget.endsWith('s') && cleanTarget.length > 3 ? cleanTarget.slice(0, -1) : cleanTarget;

        const matches =
          cleanCat.includes(cleanTarget) ||
          cleanTarget.includes(cleanCat) ||
          catSingular.includes(targetSingular) ||
          targetSingular.includes(catSingular) ||
          name.includes(cleanTarget) ||
          desc.includes(cleanTarget);

        if (!matches) return false;
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
      <Loader
        fullScreen={true}
        text="Configuring secure delivery zones..."
        color={T.accent}
        backgroundColor="#F5F6FA"
      />
    );
  }

  if (locationState === 'requesting' || locationState === 'detecting') {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: '#F5F6FA' }]} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
        <View style={[s.root, isWeb && s.webWrapper, { justifyContent: 'center', padding: 24, backgroundColor: '#F5F6FA' }]}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF4F1', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#FFE0D6', ...shadow(3) }}>
              <Ionicons name="location" size={54} color="#FF6B35" />
            </View>
            <Text style={{ color: '#1C1C2E', fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 }}>
              Delivery Location Required
            </Text>
            <Text style={{ color: '#8E8E93', fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 }}>
              To view the menu and order fresh meals, please share your location. We deliver within a strict {MAX_DELIVERY_RADIUS_KM}km boundary of our kitchen in {storeLocation.address?.split(',')[0] || 'Ghaziabad'}.
            </Text>
          </View>

          {locationState === 'detecting' ? (
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <Loader text="Detecting coordinates via GPS..." color="#FF6B35" />
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#FF6B35', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', ...shadow(4) }}
                onPress={handleDetectGPS}
                activeOpacity={0.8}
              >
                <Ionicons name="location-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>
                  Share Current Location (GPS)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ borderWidth: 1.5, borderColor: '#FF6B35', backgroundColor: '#FFFFFF', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', ...shadow(2) }}
                onPress={() => setLocationState('manual_input')}
                activeOpacity={0.8}
              >
                <Feather name="edit" size={18} color="#FF6B35" style={{ marginRight: 8 }} />
                <Text style={{ color: '#FF6B35', fontWeight: '700', fontSize: 15 }}>
                  Enter Address Manually
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
      <SafeAreaView style={[s.safe, { backgroundColor: '#F5F6FA' }]} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
        <View style={[s.root, isWeb && s.webWrapper, { justifyContent: 'center', padding: 24, backgroundColor: '#F5F6FA' }]}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#FEE2E2', ...shadow(3) }}>
              <Ionicons name="warning-outline" size={54} color="#EF4444" />
            </View>
            <Text style={{ color: '#1C1C2E', fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 }}>
              Out of Delivery Range
            </Text>
            <Text style={{ color: '#8E8E93', fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 12 }}>
              Our kitchen in {storeLocation.address?.split(',')[0] || 'Ghaziabad'} delivers delicious fresh meals within a strict {MAX_DELIVERY_RADIUS_KM}km radius.
            </Text>
          </View>

          {detectedLocation && (
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 32, ...shadow(2) }}>
              <Text style={{ color: '#8E8E93', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                Detected Location
              </Text>
              <Text style={{ color: '#1C1C2E', fontSize: 15, fontWeight: '700', marginBottom: 12, lineHeight: 20 }}>
                📍 {detectedLocation.address}
              </Text>
              <View style={{ height: 1, backgroundColor: '#F0F0F5', marginBottom: 12 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="navigate-outline" size={16} color="#FF6B35" style={{ marginRight: 6 }} />
                <Text style={{ color: '#FF6B35', fontSize: 14, fontWeight: '800' }}>
                  Distance: {detectedLocation.distance} km away (Exceeds {MAX_DELIVERY_RADIUS_KM}km limit)
                </Text>
              </View>
            </View>
          )}

          <View style={{ gap: 14 }}>
            <TouchableOpacity
              style={{ backgroundColor: '#FF6B35', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', ...shadow(4) }}
              onPress={() => setLocationState('manual_input')}
              activeOpacity={0.8}
            >
              <Feather name="edit" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>
                Enter a Delivery Address
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', ...shadow(2) }}
              onPress={handleDetectGPS}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={18} color="#1C1C2E" style={{ marginRight: 8 }} />
              <Text style={{ color: '#1C1C2E', fontWeight: '700', fontSize: 15 }}>
                Re-detect GPS Location
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (locationState === 'manual_input') {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: '#F5F6FA' }]} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
        <View style={[s.root, isWeb && s.webWrapper, { padding: 24, backgroundColor: '#F5F6FA', justifyContent: 'space-between' }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10 }}>
            <TouchableOpacity
              style={{ alignSelf: 'flex-start', paddingVertical: 10, paddingRight: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}
              onPress={() => setLocationState('requesting')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#FF6B35" style={{ marginRight: 6 }} />
              <Text style={{ color: '#FF6B35', fontSize: 16, fontWeight: '700' }}>Back</Text>
            </TouchableOpacity>

            <Text style={{ color: '#1C1C2E', fontSize: 28, fontWeight: '900', marginBottom: 8, letterSpacing: -0.5 }}>
              Enter Address
            </Text>
            <Text style={{ color: '#8E8E93', fontSize: 14, lineHeight: 20, marginBottom: 28 }}>
              Enter a delivery location (near our kitchen at {storeLocation.address || 'Ghaziabad'}) to confirm it is within range.
            </Text>

            <Text style={{ color: '#1C1C2E', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
              Delivery Street or Sector
            </Text>
            <TextInput
              style={{ backgroundColor: '#FFFFFF', borderRadius: 16, height: 56, color: '#1C1C2E', paddingHorizontal: 16, fontSize: 16, borderWidth: 1.5, borderColor: '#E5E7EB', marginBottom: 16, ...shadow(1) }}
              placeholder="e.g. Kavi Nagar, Ghaziabad"
              placeholderTextColor="#BBBBBB"
              value={manualAddressInput}
              onChangeText={(text) => {
                setManualAddressInput(text);
                setManualSearchError('');
              }}
            />

            {manualSearchError ? (
              <View style={{ backgroundColor: '#FEF2F2', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#FEE2E2', marginBottom: 20, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                <Text style={{ color: '#EF4444', fontSize: 13, lineHeight: 18, fontWeight: '600', flex: 1 }}>
                  {manualSearchError}
                </Text>
              </View>
            ) : null}

            {manualSearchLoading ? (
              <Loader text="Validating address details..." color="#FF6B35" />
            ) : (
              <TouchableOpacity
                style={{ backgroundColor: '#FF6B35', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 10, flexDirection: 'row', ...shadow(4) }}
                onPress={handleManualSearch}
                activeOpacity={0.8}
              >
                <Ionicons name="search" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>
                  Search & Validate Address
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <TouchableOpacity
            style={{ borderWidth: 1.5, borderColor: '#FF6B35', backgroundColor: '#FFFFFF', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 20, flexDirection: 'row', ...shadow(2) }}
            onPress={() => setLocationState('requesting')}
            activeOpacity={0.8}
          >
            <Ionicons name="location-outline" size={18} color="#FF6B35" style={{ marginRight: 8 }} />
            <Text style={{ color: '#FF6B35', fontWeight: '700', fontSize: 15 }}>
              Detect Coordinates (GPS)
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={T.surface} />
      <View style={[s.root, activeNav === 'fav' && { backgroundColor: '#FFFFFF' }, isWeb && s.webWrapper]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.scrollContent,
            activeNav === 'fav' && { backgroundColor: '#FFFFFF' },
            (activeNav === 'cart' || activeNav === 'profile') && { paddingBottom: 0 }
          ]}
          style={activeNav === 'fav' && { backgroundColor: '#FFFFFF' }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshData} colors={[T.accent]} />}
        >
          {/* ───────────────── modular tabs ───────────────── */}
          {activeNav === 'home' && (
            <CustomerHomeScreen
              menuItems={menuItems}
              cart={cart}
              liked={liked}
              detectedLocation={detectedLocation}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              filteredFoods={filteredFoods}
              getCartQty={getCartQty}
              handleAddToCart={handleAddToCart}
              handleUpdateQty={handleUpdateQty}
              toggleLike={toggleLike}
              setLocationState={setLocationState}
              setActiveNav={setActiveNav}
              cartCount={cartCount}
              navigation={navigation}
            />
          )}

          {activeNav === 'fav' && (
            <CustomerFavoritesScreen
              menuItems={menuItems}
              cart={cart}
              liked={liked}
              toggleLike={toggleLike}
              handleAddToCart={handleAddToCart}
              handleUpdateQty={handleUpdateQty}
              navigation={navigation}
            />
          )}

          {activeNav === 'cart' && (
            <CustomerCartScreen
              cart={cart}
              recommendedItems={recommendedItems}
              promoCode={promoCode}
              setPromoCode={setPromoCode}
              discount={discount}
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              setSelectedAddressId={setSelectedAddressId}
              subtotal={subtotal}
              cartTotal={cartTotal}
              placingOrder={placingOrder}
              handleRemoveItem={handleRemoveItem}
              handleUpdateQty={handleUpdateQty}
              handleAddToCart={handleAddToCart}
              handleApplyPromo={handleApplyPromo}
              handleCheckout={handleCheckout}
              setAddressModalVisible={setAddressModalVisible}
              fetchCouponsForUser={fetchCouponsForUser}
              setCouponsModalVisible={setCouponsModalVisible}
              setActiveNav={setActiveNav}
            />
          )}

          {activeNav === 'profile' && (
            <CustomerProfileScreen
              currentUser={currentUser}
              addresses={addresses}
              setAddressModalVisible={setAddressModalVisible}
              fetchCouponsForUser={fetchCouponsForUser}
              setCouponsModalVisible={setCouponsModalVisible}
              handleLogout={handleLogout}
              navigation={navigation}
            />
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={s.bottomNav}>
          {NAV_ITEMS.map(nav => {
            const isActive = activeNav === nav.id;
            const iconColor = isActive ? '#f49851' : '#1A1A1A';

            let iconComponent = null;
            if (nav.id === 'home') {
              iconComponent = <Feather name="home" size={22} color={iconColor} />;
            } else if (nav.id === 'fav') {
              iconComponent = <Feather name="list" size={22} color={iconColor} />;
            } else if (nav.id === 'cart') {
              iconComponent = <Feather name="shopping-cart" size={22} color={iconColor} />;
            } else if (nav.id === 'profile') {
              iconComponent = <Feather name="user" size={22} color={iconColor} />;
            }

            return (
              <TouchableOpacity
                key={nav.id}
                style={s.navItem}
                onPress={() => setActiveNav(nav.id as any)}
                activeOpacity={0.7}
              >
                <View style={{ position: 'relative' }}>
                  <View style={s.navIconWrap}>
                    {iconComponent}
                  </View>
                  {nav.showBadge && cartCount > 0 && (
                    <View style={s.navBadge}>
                      <Text style={s.navBadgeTxt}>{cartCount > 99 ? '99+' : cartCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={[s.navLabel, isActive && s.navLabelActive]}>
                  {nav.label}
                </Text>
              </TouchableOpacity>
            );
          })}
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
          <View style={[s.modalContainer, { maxHeight: '75%', borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
            {/* Minimal orange accent line */}
            <View style={{
              width: 42,
              height: 4,
              borderRadius: 0,
              backgroundColor: '#F49851',
              alignSelf: 'center',
              marginTop: 10,
              marginBottom: 2,
            }} />

            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>🏷️ Available Coupons</Text>
              <TouchableOpacity onPress={() => setCouponsModalVisible(false)}>
                <Text style={s.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingCoupons ? (
              <Loader size="small" color="#F49851" />
            ) : (
              <ScrollView
                style={{ backgroundColor: '#FFFFFF' }}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              >
                {allCoupons.length === 0 ? (
                  <Text style={{ textAlign: 'center', color: '#F49851', marginVertical: 20 }}>No coupons available right now</Text>
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
                          Alert.alert('🎉 Promo Applied!', `You saved ₹${(coupon.discount_type === 'percentage'
                            ? (subtotal * parseFloat(coupon.discount_value)) / 100
                            : Math.min(parseFloat(coupon.discount_value), subtotal)
                          ).toFixed(2)
                            } with code ${coupon.code}!`);
                        }}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: 0,
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          marginBottom: 10,
                          borderWidth: 1,
                          borderColor: isEligible ? '#F49851' : 'rgba(244, 152, 81, 0.25)',
                          position: 'relative',
                          overflow: 'hidden',
                          opacity: isEligible ? 1 : 0.8,
                          ...Platform.select({
                            ios: {
                              shadowColor: isEligible ? '#F49851' : '#000',
                              shadowOpacity: isEligible ? 0.08 : 0.04,
                              shadowRadius: 8,
                              shadowOffset: { width: 0, height: 4 },
                            },
                            android: {
                              elevation: isEligible ? 4 : 2,
                            },
                          }),
                        }}
                      >
                        {/* Vertical Status Indicator Banner */}
                        <View style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 4,
                          backgroundColor: isEligible ? '#F49851' : 'rgba(244, 152, 81, 0.25)',
                        }} />

                        {/* Highly compact row containing all details */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 6 }}>
                          {/* Left side: Discount amount & info */}
                          <View style={{ flex: 1, marginRight: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={{ fontSize: 20, fontWeight: '900', color: isEligible ? '#1E1209' : 'rgba(244, 152, 81, 0.6)' }}>
                                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                              </Text>
                              <View style={{
                                backgroundColor: isEligible ? '#FFF4F1' : 'rgba(244, 152, 81, 0.05)',
                                borderWidth: 1,
                                borderColor: isEligible ? '#F49851' : 'rgba(244, 152, 81, 0.2)',
                                borderStyle: 'dashed',
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 0,
                              }}>
                                <Text style={{ fontSize: 12, fontWeight: '800', color: isEligible ? '#F49851' : 'rgba(244, 152, 81, 0.6)', letterSpacing: 0.5 }}>
                                  🎫 {coupon.code}
                                </Text>
                              </View>
                            </View>
                            <Text style={{ fontSize: 10.5, color: isEligible ? '#F49851' : 'rgba(244, 152, 81, 0.5)', fontWeight: '700', marginTop: 3 }}>
                              FLAT DISCOUNT • Valid on orders above ₹{parseFloat(coupon.min_order_value).toFixed(0)}
                            </Text>
                          </View>

                          {/* Right side: APPLY badge or LOCKED badge */}
                          {isEligible ? (
                            <View style={{
                              backgroundColor: '#F49851',
                              paddingHorizontal: 14,
                              paddingVertical: 7,
                              borderRadius: 0,
                            }}>
                              <Text style={{ fontSize: 11, color: '#fff', fontWeight: '900', letterSpacing: 0.5 }}>APPLY</Text>
                            </View>
                          ) : (
                            <View style={{
                              backgroundColor: 'rgba(244, 152, 81, 0.1)',
                              paddingHorizontal: 10,
                              paddingVertical: 7,
                              borderRadius: 0,
                              flexDirection: 'row',
                              alignItems: 'center',
                            }}>
                              <Text style={{ fontSize: 10, color: '#F49851', fontWeight: '800', letterSpacing: 0.5 }}>🔒 LOCKED</Text>
                            </View>
                          )}
                        </View>

                        {/* Ineligibility Warning Box */}
                        {!isEligible && (
                          <View style={{
                            backgroundColor: '#FFFBF9',
                            borderWidth: 1,
                            borderColor: 'rgba(244, 152, 81, 0.15)',
                            borderRadius: 0,
                            paddingVertical: 5,
                            paddingHorizontal: 8,
                            marginTop: 8,
                            marginLeft: 6,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                          }}>
                            <Text style={{ fontSize: 12 }}>💡</Text>
                            <Text style={{ fontSize: 10, color: '#F49851', fontWeight: '600', flex: 1 }}>
                              Add <Text style={{ fontWeight: '800' }}>₹{(parseFloat(coupon.min_order_value) - subtotal).toFixed(0)}</Text> more to unlock this coupon!
                            </Text>
                          </View>
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
          <View style={[s.modalContainer, { maxHeight: '80%', borderTopLeftRadius: 0, borderTopRightRadius: 0, backgroundColor: '#FFFFFF' }]}>
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              {/* Success Badge */}
              <View style={{ alignItems: 'center', marginBottom: 28, marginTop: 10 }}>
                <View style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: '#FFF4EE',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16
                }}>
                  <Feather name="check" size={30} color="#E8956D" />
                </View>
                <Text style={{
                  fontSize: 22,
                  fontWeight: '800',
                  color: '#1E1209',
                  textAlign: 'center',
                  fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
                  letterSpacing: -0.3
                }}>
                  Order Placed Successfully!
                </Text>
                <Text style={{ fontSize: 13, color: '#7A6A57', fontWeight: '500', marginTop: 6 }}>
                  Estimated preparation time: 25-35 mins
                </Text>
              </View>

              {placedOrder ? (
                <>
                  {/* Order ID & Status */}
                  <View style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#F0EAE2',
                    padding: 16,
                    marginBottom: 18,
                    borderRadius: 0
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#7A6A57' }}>Order Code:</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#1E1209', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) }}>
                        #{placedOrder.id?.slice(-6).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#7A6A57' }}>Payment Status:</Text>
                      <View style={{ backgroundColor: '#FFF4EE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 0 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#E8956D', letterSpacing: 0.5 }}>CASH ON DELIVERY</Text>
                      </View>
                    </View>
                  </View>

                  {/* Items list */}
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '800',
                      color: '#1E1209',
                      marginBottom: 10,
                      letterSpacing: 0.8,
                      fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
                      textTransform: 'uppercase'
                    }}>
                      Ordered Items:
                    </Text>
                    {JSON.parse(typeof placedOrder.items === 'string' ? placedOrder.items : JSON.stringify(placedOrder.items || '[]')).map((item: any, idx: number) => (
                      <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
                        <Text style={{
                          fontSize: 14,
                          color: '#1E1209',
                          fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
                          flex: 1
                        }} numberOfLines={1}>
                          {item.name} <Text style={{ color: '#7A6A57', fontWeight: '700', fontSize: 13 }}>×{item.quantity}</Text>
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1209' }}>
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Delivery Location Summary */}
                  {selectedAddressObj && (
                    <View style={{
                      marginBottom: 20,
                      borderTopWidth: 1,
                      borderBottomWidth: 1,
                      borderColor: '#F0EAE2',
                      paddingVertical: 14
                    }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '800',
                        color: '#1E1209',
                        marginBottom: 8,
                        letterSpacing: 0.8,
                        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
                        textTransform: 'uppercase'
                      }}>
                        Delivering To:
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1209', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) }}>
                        📍 {selectedAddressObj.receiver_name}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#7A6A57', marginTop: 4, fontWeight: '500' }}>
                        {selectedAddressObj.address_line1}, {selectedAddressObj.city}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#7A6A57', marginTop: 2, fontWeight: '500' }}>
                        📞 {selectedAddressObj.phone_number}
                      </Text>
                    </View>
                  )}

                  {/* Bill Details Summary */}
                  <View style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#F0EAE2',
                    padding: 16,
                    marginBottom: 26,
                    borderRadius: 0
                  }}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '800',
                      color: '#1E1209',
                      marginBottom: 12,
                      letterSpacing: 0.8,
                      fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
                      textTransform: 'uppercase'
                    }}>
                      Final Bill Summary:
                    </Text>

                    {placedOrder.discount_amount > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
                        <Text style={{ fontSize: 13, color: '#7A6A57', fontWeight: '500' }}>Applied Promo:</Text>
                        <Text style={{ fontSize: 13, color: '#E8956D', fontWeight: '700' }}>
                          {placedOrder.promo_code}
                        </Text>
                      </View>
                    )}

                    {placedOrder.discount_amount > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
                        <Text style={{ fontSize: 13, color: '#7A6A57', fontWeight: '500' }}>Discount Savings:</Text>
                        <Text style={{ fontSize: 13, color: '#E8956D', fontWeight: '700' }}>
                          - ₹{parseFloat(placedOrder.discount_amount).toFixed(2)}
                        </Text>
                      </View>
                    )}

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
                      <Text style={{ fontSize: 13, color: '#7A6A57', fontWeight: '500' }}>Delivery Fee:</Text>
                      <Text style={{ fontSize: 13, color: '#E8956D', fontWeight: '700' }}>FREE</Text>
                    </View>

                    <View style={{ height: 1, backgroundColor: '#F0EAE2', marginVertical: 10 }} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{
                        fontSize: 15,
                        fontWeight: '800',
                        color: '#1E1209',
                        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' })
                      }}>
                        Total Bill Amount:
                      </Text>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: '#E8956D', letterSpacing: -0.5 }}>
                        ₹{parseFloat(placedOrder.total).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </>
              ) : null}

              {/* Action Buttons */}
              <View style={{ gap: 12, marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    setConfirmationModalVisible(false);
                    navigation.navigate('OrdersHistory', { userId: currentUser?.id });
                  }}
                  style={{
                    backgroundColor: '#E8956D',
                    height: 54,
                    borderRadius: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                    Track Active Orders
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setConfirmationModalVisible(false);
                    setActiveNav('home');
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: '#F0EAE2',
                    height: 54,
                    borderRadius: 0,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#7A6A57', fontWeight: '700', fontSize: 14 }}>
                    Go Back to Home
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* View All Orders Modal */}
      <Modal
        visible={myOrdersModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMyOrdersModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalContainer, { height: '85%' }]}>
            <View style={s.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 20 }}>📋</Text>
                <Text style={s.modalTitle}>All My Orders</Text>
              </View>
              <TouchableOpacity onPress={() => setMyOrdersModalVisible(false)}>
                <Text style={s.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
              {orders.length === 0 ? (
                <View style={{ alignItems: 'center', marginVertical: 40 }}>
                  <Text style={{ fontSize: 60, marginBottom: 12 }}>📋</Text>
                  <Text style={{ color: T.sub, fontSize: 16, fontWeight: '600' }}>No orders found.</Text>
                </View>
              ) : (
                [...orders]
                  .sort((a, b) => new Date(b.created_at || b.id).getTime() - new Date(a.created_at || a.id).getTime())
                  .map((order) => {
                    const parsedItems = JSON.parse(
                      typeof order.items === 'string' ? order.items : JSON.stringify(order.items || '[]')
                    );
                    const formattedDate = order.created_at
                      ? new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      : 'Recently placed';

                    return (
                      <View key={order.id} style={s.myOrdersFullCard}>
                        <View style={s.myOrdersFullHeader}>
                          <View>
                            <Text style={s.myOrdersFullCode}>
                              ORDER #{order.id?.slice(-6).toUpperCase()}
                            </Text>
                            <Text style={s.myOrdersFullDate}>{formattedDate}</Text>
                          </View>
                          <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[order.status] || '#555' }]}>
                            <Text style={s.statusBadgeText}>{order.status?.toUpperCase()}</Text>
                          </View>
                        </View>

                        <View style={s.myOrdersFullDivider} />

                        {/* Items list */}
                        <View style={{ marginVertical: 8 }}>
                          {parsedItems.map((item: any, idx: number) => (
                            <View key={idx} style={s.myOrdersFullItemRow}>
                              <Text style={s.myOrdersFullItemName}>
                                • {item.name} <Text style={{ color: T.sub, fontWeight: '700' }}>x{item.quantity}</Text>
                              </Text>
                              <Text style={s.myOrdersFullItemPrice}>
                                ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                              </Text>
                            </View>
                          ))}
                        </View>

                        <View style={s.myOrdersFullDivider} />

                        {/* Pricing details */}
                        <View style={{ gap: 4, marginTop: 4 }}>
                          {parseFloat(order.discount_amount) > 0 && (
                            <View style={s.myOrdersFullPriceRow}>
                              <Text style={{ fontSize: 12, color: T.green, fontWeight: '600' }}>Promo Code ({order.promo_code}):</Text>
                              <Text style={{ fontSize: 12, color: T.green, fontWeight: '700' }}>
                                - ₹{parseFloat(order.discount_amount).toFixed(2)}
                              </Text>
                            </View>
                          )}
                          <View style={s.myOrdersFullPriceRow}>
                            <Text style={{ fontSize: 13, color: T.text, fontWeight: '700' }}>Total Paid:</Text>
                            <Text style={{ fontSize: 14, color: T.accent, fontWeight: '900' }}>
                              ₹{parseFloat(order.total).toFixed(2)}
                            </Text>
                          </View>
                        </View>

                        {/* Quick actions e.g. cancel order */}
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <TouchableOpacity
                            style={s.myOrdersFullCancelBtn}
                            onPress={() => handleCancelOrder(order.id)}
                            activeOpacity={0.8}
                          >
                            <Text style={s.myOrdersFullCancelBtnTxt}>Cancel Order</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Premium Automated Soft Toast Notification */}
      {toastMessage && (
        <Animated.View style={[s.toastContainer, { opacity: toastOpacity }]}>
          <Text style={s.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
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
  cancelOrderBtnTxt: { color: T.accent, fontWeight: '800', fontSize: 11 },

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
  checkoutAddrName: { color: T.text, fontWeight: '800', fontSize: 13, marginBottom: 4 },
  checkoutAddrText: { color: T.sub, fontSize: 11 },

  billingCard: { backgroundColor: T.surface, borderRadius: 18, padding: 16, marginTop: 16, ...shadow(3) },
  billingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billingLabel: { color: T.sub, fontSize: 13 },
  billingVal: { color: T.text, fontWeight: '700', fontSize: 13 },
  billingTotalLabel: { color: T.text, fontSize: 15, fontWeight: '800' },
  billingTotalVal: { color: T.accent, fontWeight: '900', fontSize: 16 },

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
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  navIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  navIconActive: {},
  navIconImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 4,
    fontFamily: 'Poppins_500Medium',
  },
  navLabelActive: {
    color: '#f49851', // Orange active color matching screenshot
    fontWeight: '600',
  },
  navBadge: {
    position: 'absolute', top: -4, right: -10,
    minWidth: 16, height: 16, borderRadius: 8,
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
  addBtnCard: {
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
  profileViewAllBtn: {
    backgroundColor: T.accentBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  profileViewAllBtnText: {
    color: T.accent,
    fontWeight: '800',
    fontSize: 11,
  },
  profileLatestOrderCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  profileLatestOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileLatestOrderId: {
    fontWeight: '800',
    fontSize: 13,
    color: T.text,
  },
  profileLatestOrderItems: {
    fontSize: 12,
    color: T.sub,
    marginBottom: 8,
  },
  profileLatestOrderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileLatestOrderTotal: {
    fontWeight: '800',
    fontSize: 13,
    color: T.accent,
  },
  profileLatestOrderTap: {
    fontSize: 11,
    color: T.sub,
    fontWeight: '600',
  },
  myOrdersFullCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    ...shadow(3),
  },
  myOrdersFullHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  myOrdersFullCode: {
    fontWeight: '800',
    fontSize: 13,
    color: T.text,
  },
  myOrdersFullDate: {
    fontSize: 11,
    color: T.sub,
    marginTop: 2,
  },
  myOrdersFullDivider: {
    height: 1,
    backgroundColor: '#F0F0F5',
    marginVertical: 10,
  },
  myOrdersFullItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  myOrdersFullItemName: {
    fontSize: 12.5,
    color: T.text,
    flex: 1,
    marginRight: 8,
  },
  myOrdersFullItemPrice: {
    fontSize: 12.5,
    fontWeight: '700',
    color: T.text,
  },
  myOrdersFullPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  myOrdersFullCancelBtn: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  myOrdersFullCancelBtnTxt: {
    color: '#E11D48',
    fontWeight: '800',
    fontSize: 12,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#fef3ea',
    borderRadius: 0, // Sharp corners!
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5A30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 99999,
  },
  toastText: {
    color: '#f49851',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});