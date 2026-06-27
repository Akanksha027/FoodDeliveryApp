import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl, Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { clearSession } from '../utils/session';
import { Loader } from '../components/Loader';

// Direct Vercel URL since EXPO_PUBLIC vars are not available on Expo Web bundle
const BACKEND = 'https://backend-akanksha-singhs-projects-40f191a2.vercel.app';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  preparing: '#3B82F6',
  ready: '#8B5CF6',
  delivered: '#10B981',
  cancelled: '#EF4444',
};
const NEXT_STATUS: Record<string, string> = {
  pending: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
};

export const OwnerDashboard = ({ navigation }: any) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'promos' | 'settings'>('orders');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ name: '', category: '', description: '', price: '', recommendations: [] as string[] });
  const [addingItem, setAddingItem] = useState(false);
  const [expandedRecId, setExpandedRecId] = useState<string | null>(null);

  // Store settings coordinates
  const [kitchenAddress, setKitchenAddress] = useState('');
  const [kitchenLocation, setKitchenLocation] = useState<any>(null);
  const [updatingLocation, setUpdatingLocation] = useState(false);

  // Promo Code Management States
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [newPromo, setNewPromo] = useState({
    code: '',
    discount_type: 'percentage', // percentage | fixed
    discount_value: '',
    min_order_value: '',
    active: true
  });
  const [addingPromo, setAddingPromo] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/orders`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch orders', e);
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/menu`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const data = await res.json();
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error('Failed to fetch menu', e);
      Alert.alert('Network Error', `Could not reach backend: ${e.message}\nURL: ${BACKEND}`);
    }
  };

  const fetchKitchenLocation = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/kitchen`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const data = await res.json();
      setKitchenLocation(data);
      setKitchenAddress(data.address || '');
    } catch (e) {
      console.error('Failed to fetch kitchen location', e);
    }
  };

  const fetchPromoCodes = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/promocodes`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const data = await res.json();
      setPromoCodes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch promo codes', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchOrders(), fetchMenu(), fetchKitchenLocation(), fetchPromoCodes()]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchOrders(), fetchMenu(), fetchKitchenLocation(), fetchPromoCodes()]);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);

  // Set up message listener for the embedded Leaflet Map Picker iframe
  useEffect(() => {
    const handleMapMessage = async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.type === 'LOCATION_SELECTED') {
          console.log('[Map] Received coordinates from map picker:', data.address, data.latitude, data.longitude);

          setUpdatingLocation(true);
          const res = await fetch(`${BACKEND}/api/kitchen`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
            body: JSON.stringify({
              address: data.address,
              latitude: data.latitude,
              longitude: data.longitude,
            }),
          });

          if (res.ok) {
            await fetchKitchenLocation();
            Alert.alert('Success', `Kitchen location updated to: ${data.address}`);
          } else {
            Alert.alert('Error', 'Failed to save location in database');
          }
          setUpdatingLocation(false);
        }
      } catch (e) {
        // Ignore non-JSON messages
      }
    };

    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('message', handleMapMessage);
      return () => window.removeEventListener('message', handleMapMessage);
    }
  }, []);

  const updateStoreLocation = async () => {
    if (!kitchenAddress.trim()) {
      Alert.alert('Error', 'Please enter a kitchen address.');
      return;
    }
    setUpdatingLocation(true);
    try {
      const result = await Location.geocodeAsync(kitchenAddress);
      if (result && result.length > 0) {
        const { latitude, longitude } = result[0];

        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        let addressString = kitchenAddress;
        if (geocode && geocode[0]) {
          const item = geocode[0];
          const parts = [
            item.name || item.street || '',
            item.district || item.subregion || item.city || ''
          ].filter(Boolean);
          addressString = parts.length > 0 ? parts.join(', ') : kitchenAddress;
        }

        const res = await fetch(`${BACKEND}/api/kitchen`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
          body: JSON.stringify({
            address: addressString,
            latitude,
            longitude,
          }),
        });

        if (res.ok) {
          await fetchKitchenLocation();
          Alert.alert('Success', `Store location updated to: ${addressString}`);
        } else {
          Alert.alert('Error', 'Failed to save location in database');
        }
      } else {
        Alert.alert('Error', 'We could not geocode this address. Please try a more specific address.');
      }
    } catch (e) {
      console.error('Update kitchen location failed:', e);
      Alert.alert('Error', 'An error occurred during location update.');
    }
    setUpdatingLocation(false);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await fetch(`${BACKEND}/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ status }),
      });
      await fetchOrders();
    } catch (e) {
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const addMenuItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category) {
      Alert.alert('Error', 'Name, category, and price are required');
      return;
    }
    setAddingItem(true);
    try {
      const res = await fetch(`${BACKEND}/api/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({
          name: newItem.name,
          category: newItem.category,
          description: newItem.description,
          price: parseFloat(newItem.price),
          recommendations: newItem.recommendations || [],
        }),
      });
      if (res.ok) {
        setNewItem({ name: '', category: '', description: '', price: '', recommendations: [] });
        await fetchMenu();
        Alert.alert('Success', 'Menu item added!');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to add menu item');
    }
    setAddingItem(false);
  };

  const deleteMenuItem = async (id: string) => {
    Alert.alert('Delete Item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await fetch(`${BACKEND}/api/menu/${id}`, {
            method: 'DELETE',
            headers: { 'ngrok-skip-browser-warning': 'true' }
          });
          await fetchMenu();
        }
      }
    ]);
  };

  const addPromoCode = async () => {
    if (!newPromo.code || !newPromo.discount_value) {
      Alert.alert('Error', 'Promo Code and Discount Value are required');
      return;
    }
    setAddingPromo(true);
    try {
      const res = await fetch(`${BACKEND}/api/promocodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({
          code: newPromo.code,
          discount_type: newPromo.discount_type,
          discount_value: parseFloat(newPromo.discount_value),
          min_order_value: newPromo.min_order_value ? parseFloat(newPromo.min_order_value) : 0,
          active: newPromo.active,
        }),
      });
      if (res.ok) {
        setNewPromo({
          code: '',
          discount_type: 'percentage',
          discount_value: '',
          min_order_value: '',
          active: true
        });
        await fetchPromoCodes();
        Alert.alert('Success', 'Promo code created successfully!');
      } else {
        const data = await res.json();
        Alert.alert('Error', data.error || 'Failed to create promo code');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to add promo code');
    }
    setAddingPromo(false);
  };

  const togglePromoActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`${BACKEND}/api/promocodes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ active }),
      });
      if (res.ok) {
        await fetchPromoCodes();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update promo code status');
    }
  };

  const deletePromo = async (id: string) => {
    Alert.alert('Delete Promo Code', 'Are you sure you want to delete this promo code permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${BACKEND}/api/promocodes/${id}`, {
              method: 'DELETE',
              headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            if (res.ok) {
              await fetchPromoCodes();
              Alert.alert('Deleted', 'Promo code deleted permanently.');
            }
          } catch (e) {
            Alert.alert('Error', 'Failed to delete promo code');
          }
        }
      }
    ]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await clearSession();
    navigation.replace('Login');
  };

  if (loading) {
    return (
      <Loader
        fullScreen={true}
        text="Loading owner panel..."
        color="#6366F1"
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={handleLogout}
            style={{ marginRight: 12, paddingVertical: 4 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>👑 Admin Dashboard</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText, { fontSize: 13 }]}>
            Orders ({orders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'menu' && styles.activeTab]}
          onPress={() => setActiveTab('menu')}
        >
          <Text style={[styles.tabText, activeTab === 'menu' && styles.activeTabText, { fontSize: 13 }]}>
            Menu ({menuItems.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'promos' && styles.activeTab]}
          onPress={() => setActiveTab('promos')}
        >
          <Text style={[styles.tabText, activeTab === 'promos' && styles.activeTabText, { fontSize: 13 }]}>
            Promos ({promoCodes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText, { fontSize: 13 }]}>
            Settings ⚙️
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'orders' ? (
          <>
            {orders.length === 0 ? (
              <Text style={styles.emptyText}>No orders yet</Text>
            ) : (
              orders.map(order => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>Order #{order.id?.slice(-6)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status] || '#888' }]}>
                      <Text style={styles.statusText}>{order.status?.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.customerText}>📧 {order.customer_email || 'Unknown'}</Text>
                  <Text style={styles.totalText}>💰 Total: ₹{order.total}</Text>
                  {order.items && (
                    <Text style={styles.itemsText}>
                      🛍 {JSON.parse(typeof order.items === 'string' ? order.items : JSON.stringify(order.items))
                        .map((i: any) => `${i.name} x${i.quantity}`).join(', ')}
                    </Text>
                  )}
                  <Text style={styles.timeText}>
                    🕐 {new Date(order.created_at).toLocaleString()}
                  </Text>
                  {NEXT_STATUS[order.status] && (
                    <TouchableOpacity
                      style={styles.updateBtn}
                      onPress={() => updateOrderStatus(order.id, NEXT_STATUS[order.status])}
                    >
                      <Text style={styles.updateBtnText}>
                        Mark as {NEXT_STATUS[order.status].toUpperCase()} →
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </>
        ) : activeTab === 'menu' ? (
          <>
            {/* Add New Item Form */}
            <View style={styles.addItemCard}>
              <Text style={styles.sectionTitle}>+ Add Menu Item</Text>
              <TextInput
                style={styles.input}
                placeholder="Item Name *"
                placeholderTextColor="#888888"
                value={newItem.name}
                onChangeText={v => setNewItem(p => ({ ...p, name: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Category (e.g. Burger, Pizza, Fries, Drink) *"
                placeholderTextColor="#888888"
                value={newItem.category}
                onChangeText={v => setNewItem(p => ({ ...p, category: v }))}
              />

              {/* Existing Categories Quick Select */}
              {menuItems.length > 0 && (
                <View style={{ marginBottom: 12, marginTop: -4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 6 }}>
                    🏷️ Quick Select / Existing Categories:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6, paddingVertical: 4 }}>
                    {Array.from(new Set(
                      menuItems.map((m: any) => {
                        const c = m.category?.trim();
                        return c ? c.charAt(0).toUpperCase() + c.slice(1).toLowerCase() : '';
                      }).filter(Boolean)
                    )).map((cat: string) => {
                      const isSelected = newItem.category?.toLowerCase() === cat.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => setNewItem(p => ({ ...p, category: cat }))}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 12,
                            borderWidth: 1.5,
                            borderColor: isSelected ? '#4F46E5' : '#E5E7EB',
                            backgroundColor: isSelected ? '#EEF2F6' : '#FFFFFF',
                            marginRight: 6,
                            flexDirection: 'row',
                            alignItems: 'center'
                          }}
                        >
                          <Text style={{ fontSize: 11, color: isSelected ? '#4F46E5' : '#4B5563', fontWeight: isSelected ? '700' : '600' }}>
                            {cat}
                          </Text>
                          {isSelected && <Text style={{ fontSize: 9, color: '#4F46E5', marginLeft: 4 }}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
              <TextInput
                style={styles.input}
                placeholder="Description"
                placeholderTextColor="#888888"
                value={newItem.description}
                onChangeText={v => setNewItem(p => ({ ...p, description: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Price (₹) *"
                placeholderTextColor="#888888"
                value={newItem.price}
                onChangeText={v => setNewItem(p => ({ ...p, price: v }))}
                keyboardType="numeric"
              />

              {/* Recommendations Selection */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>
                  💡 Recommends with this item (Add to Order suggestions):
                </Text>
                {menuItems.length === 0 ? (
                  <Text style={{ fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
                    No other menu items available to recommend.
                  </Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                    {menuItems.map((m: any) => {
                      const isSelected = (newItem.recommendations || []).includes(m.id);
                      return (
                        <TouchableOpacity
                          key={m.id}
                          onPress={() => {
                            const list = newItem.recommendations || [];
                            const updated = isSelected
                              ? list.filter(id => id !== m.id)
                              : [...list, m.id];
                            setNewItem(p => ({ ...p, recommendations: updated }));
                          }}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 20,
                            borderWidth: 1.5,
                            borderColor: isSelected ? '#4F46E5' : '#E5E7EB',
                            backgroundColor: isSelected ? '#EEF2F6' : '#FFFFFF',
                            marginRight: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Text style={{ fontSize: 12, color: isSelected ? '#4F46E5' : '#374151', fontWeight: '600' }}>
                            {m.name}
                          </Text>
                          {isSelected && <Text style={{ fontSize: 10, color: '#4F46E5' }}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              <TouchableOpacity
                style={[styles.addBtn, addingItem && styles.disabledBtn]}
                onPress={addMenuItem}
                disabled={addingItem}
              >
                <Text style={styles.addBtnText}>{addingItem ? 'Adding...' : 'Add Item'}</Text>
              </TouchableOpacity>
            </View>

            {/* Menu Items List */}
            {menuItems.length === 0 ? (
              <Text style={styles.emptyText}>No menu items yet</Text>
            ) : (
              menuItems.map(item => (
                <View key={item.id} style={{
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 10,
                  elevation: 1,
                }}>
                  {/* Top Row: Details & Delete */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={styles.menuItemName}>
                        {item.name} <Text style={{ fontSize: 13, fontWeight: 'normal', color: '#6B7280' }}>({item.category || 'Uncategorized'})</Text>
                      </Text>
                      {item.description ? (
                        <Text style={styles.menuItemDesc}>{item.description}</Text>
                      ) : null}
                      <Text style={styles.menuItemPrice}>₹{item.price}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => deleteMenuItem(item.id)}
                    >
                      <Text style={styles.deleteBtnText}>🗑</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Recommendation row listing */}
                  <View style={{
                    marginTop: 10,
                    borderTopWidth: 1,
                    borderColor: '#F3F4F6',
                    paddingTop: 8,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                        🍽️ Recommends:
                      </Text>
                      <Text style={{ fontSize: 12, color: '#374151', marginTop: 2, fontWeight: '600' }} numberOfLines={1}>
                        {(() => {
                          const recs = item.recommendations || [];
                          if (recs.length === 0) return 'No items recommended yet';
                          return recs.map((id: string) => {
                            const found = menuItems.find(m => m.id === id);
                            return found ? found.name : '';
                          }).filter(Boolean).join(', ');
                        })()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setExpandedRecId(expandedRecId === item.id ? null : item.id)}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 4,
                        backgroundColor: '#F3F4F6',
                        borderWidth: 1,
                        borderColor: '#E5E7EB'
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#4F46E5' }}>
                        {expandedRecId === item.id ? 'Close' : 'Manage'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Collapsible Selectors */}
                  {expandedRecId === item.id && (
                    <View style={{ marginTop: 12, backgroundColor: '#FAFAFA', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#F0F0F0' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#374151', marginBottom: 6 }}>
                        Select items to offer to customers with {item.name}:
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                        {menuItems.filter((m: any) => m.id !== item.id).map((m: any) => {
                          const currentRecs = item.recommendations || [];
                          const isSelected = currentRecs.includes(m.id);
                          return (
                            <TouchableOpacity
                              key={m.id}
                              onPress={async () => {
                                const list = item.recommendations || [];
                                const updated = isSelected
                                  ? list.filter((id: string) => id !== m.id)
                                  : [...list, m.id];

                                // Optimistically update state
                                setMenuItems(prev => prev.map(mi => mi.id === item.id ? { ...mi, recommendations: updated } : mi));

                                try {
                                  const res = await fetch(`${BACKEND}/api/menu/${item.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                                    body: JSON.stringify({ recommendations: updated }),
                                  });
                                  if (!res.ok) {
                                    const errData = await res.json().catch(() => ({}));
                                    throw new Error(errData.error || `HTTP ${res.status}`);
                                  }
                                } catch (e: any) {
                                  Alert.alert('Error', e.message || 'Failed to update recommendations in database');
                                  await fetchMenu(); // Revert optimistic update by pulling fresh from db
                                }
                              }}
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 14,
                                borderWidth: 1.5,
                                borderColor: isSelected ? '#4F46E5' : '#E5E7EB',
                                backgroundColor: isSelected ? '#EEF2F6' : '#FFFFFF',
                                marginRight: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <Text style={{ fontSize: 11, color: isSelected ? '#4F46E5' : '#475569', fontWeight: '600' }}>
                                {m.name}
                              </Text>
                              {isSelected && <Text style={{ fontSize: 9, color: '#4F46E5' }}>✓</Text>}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </View>
              ))
            )}
          </>
        ) : activeTab === 'promos' ? (
          <>
            {/* Add Promo Code Form */}
            <View style={styles.addItemCard}>
              <Text style={styles.sectionTitle}>🎫 Add New Promo Code</Text>

              <TextInput
                style={styles.input}
                placeholder="PROMO CODE (e.g. SAVE15) *"
                placeholderTextColor="#888888"
                value={newPromo.code}
                onChangeText={v => setNewPromo(p => ({ ...p, code: v.toUpperCase().trim() }))}
                autoCapitalize="characters"
              />

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: newPromo.discount_type === 'percentage' ? '#4F46E5' : '#E5E7EB',
                    backgroundColor: newPromo.discount_type === 'percentage' ? '#EEF2F6' : '#fff',
                    alignItems: 'center'
                  }}
                  onPress={() => setNewPromo(p => ({ ...p, discount_type: 'percentage' }))}
                >
                  <Text style={{ fontWeight: 'bold', color: newPromo.discount_type === 'percentage' ? '#4F46E5' : '#4B5563' }}>
                    Percentage (%)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: newPromo.discount_type === 'fixed' ? '#4F46E5' : '#E5E7EB',
                    backgroundColor: newPromo.discount_type === 'fixed' ? '#EEF2F6' : '#fff',
                    alignItems: 'center'
                  }}
                  onPress={() => setNewPromo(p => ({ ...p, discount_type: 'fixed' }))}
                >
                  <Text style={{ fontWeight: 'bold', color: newPromo.discount_type === 'fixed' ? '#4F46E5' : '#4B5563' }}>
                    Fixed ₹ Off
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder={newPromo.discount_type === 'percentage' ? "Discount Percentage (e.g. 15) *" : "Discount Value in ₹ (e.g. 100) *"}
                placeholderTextColor="#888888"
                value={newPromo.discount_value}
                onChangeText={v => setNewPromo(p => ({ ...p, discount_value: v }))}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Minimum Order Value in ₹ (e.g. 400)"
                placeholderTextColor="#888888"
                value={newPromo.min_order_value}
                onChangeText={v => setNewPromo(p => ({ ...p, min_order_value: v }))}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[styles.addBtn, addingPromo && styles.disabledBtn]}
                onPress={addPromoCode}
                disabled={addingPromo}
              >
                <Text style={styles.addBtnText}>{addingPromo ? 'Creating...' : 'Create Promo Code'}</Text>
              </TouchableOpacity>
            </View>

            {/* Promo Codes List */}
            {promoCodes.length === 0 ? (
              <Text style={styles.emptyText}>No promo codes yet</Text>
            ) : (
              promoCodes.map(promo => (
                <View key={promo.id} style={styles.menuCard}>
                  <View style={styles.menuCardContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[styles.menuItemName, { fontSize: 16, color: '#111827', letterSpacing: 0.5 }]}>
                        🎫 {promo.code}
                      </Text>
                      <View style={{
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 12,
                        backgroundColor: promo.active ? '#DEF7EC' : '#FDE8E8',
                      }}>
                        <Text style={{
                          fontSize: 10,
                          fontWeight: 'bold',
                          color: promo.active ? '#03543F' : '#9B1C1C'
                        }}>
                          {promo.active ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 13, color: '#4B5563', marginTop: 4, fontWeight: '600' }}>
                      🎁 {promo.discount_type === 'percentage' ? `${promo.discount_value}% Off` : `₹${promo.discount_value} Off`}
                    </Text>

                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      🛒 Min. Order: ₹{promo.min_order_value || 0}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => togglePromoActive(promo.id, !promo.active)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 6,
                        backgroundColor: '#F3F4F6',
                        borderWidth: 1,
                        borderColor: '#E5E7EB'
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>
                        {promo.active ? 'Deactivate' : 'Activate'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => deletePromo(promo.id)}
                    >
                      <Text style={styles.deleteBtnText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          <View style={styles.addItemCard}>
            <Text style={styles.sectionTitle}>⚙️ Store Kitchen Settings</Text>

            {kitchenLocation ? (
              <View style={{ backgroundColor: '#EEF2F6', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <Text style={{ fontWeight: 'bold', color: '#1E293B', fontSize: 14 }}>Active Kitchen Location:</Text>
                <Text style={{ color: '#475569', fontSize: 13, marginTop: 4 }}>📍 {kitchenLocation.address}</Text>
                <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>GPS: {kitchenLocation.latitude}, {kitchenLocation.longitude}</Text>
              </View>
            ) : (
              <Loader size="small" color="#4F46E5" />
            )}

            <Text style={{ fontSize: 14, color: '#111827', marginBottom: 12, fontWeight: '700' }}>
              🗺️ Drag Pin or Search on Map to Set Location:
            </Text>

            {/* Render the interactive Leaflet Map Picker on web natively */}
            {Platform.OS === 'web' ? (
              <iframe
                src="https://backend-akanksha-singhs-projects-40f191a2.vercel.app/map-picker.html"
                style={{
                  width: '100%',
                  height: 520,
                  borderRadius: 12,
                  border: '1px solid #E5E7EB',
                  marginBottom: 16,
                }}
              />
            ) : (
              <View style={{ width: '100%', height: 420, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 }}>
                <WebView
                  source={{ uri: 'https://backend-akanksha-singhs-projects-40f191a2.vercel.app/map-picker.html' }}
                  style={{ flex: 1 }}
                  onMessage={async (event) => {
                    try {
                      const data = JSON.parse(event.nativeEvent.data);
                      if (data && data.type === 'LOCATION_SELECTED') {
                        console.log('[Map WebView] Received coordinates:', data.address, data.latitude, data.longitude);
                        setUpdatingLocation(true);
                        const res = await fetch(`${BACKEND}/api/kitchen`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                          body: JSON.stringify({
                            address: data.address,
                            latitude: data.latitude,
                            longitude: data.longitude,
                          }),
                        });

                        if (res.ok) {
                          await fetchKitchenLocation();
                          Alert.alert('Success', `Kitchen location updated to: ${data.address}`);
                        } else {
                          Alert.alert('Error', 'Failed to save location in database');
                        }
                        setUpdatingLocation(false);
                      }
                    } catch (e) {
                      // Ignore
                    }
                  }}
                />
              </View>
            )}

            <Text style={{ fontSize: 13, color: '#475569', marginBottom: 8, fontWeight: '600' }}>
              Fallback - Type Kitchen Address:
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Raj Nagar, Ghaziabad"
              placeholderTextColor="#888888"
              value={kitchenAddress}
              onChangeText={setKitchenAddress}
            />

            <TouchableOpacity
              style={[styles.addBtn, updatingLocation && styles.disabledBtn]}
              onPress={updateStoreLocation}
              disabled={updatingLocation}
            >
              <Text style={styles.addBtnText}>
                {updatingLocation ? 'Saving Location...' : 'Update Store Location'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 16 },
  header: {
    backgroundColor: '#4F46E5', paddingTop: 50, paddingBottom: 16,
    paddingHorizontal: 20, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  logoutText: { color: '#fff', fontSize: 14 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', elevation: 2 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#4F46E5' },
  tabText: { color: '#9CA3AF', fontWeight: '600', fontSize: 15 },
  activeTabText: { color: '#4F46E5' },
  content: { flex: 1, padding: 16 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 16 },
  orderCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 12, elevation: 2,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { fontWeight: 'bold', fontSize: 16, color: '#111827' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  customerText: { color: '#6B7280', fontSize: 13, marginBottom: 4 },
  totalText: { color: '#111827', fontWeight: '600', fontSize: 15, marginBottom: 4 },
  itemsText: { color: '#6B7280', fontSize: 13, marginBottom: 4 },
  timeText: { color: '#9CA3AF', fontSize: 12, marginBottom: 10 },
  updateBtn: { backgroundColor: '#4F46E5', borderRadius: 8, padding: 10, alignItems: 'center' },
  updateBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  addItemCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
    padding: 12, marginBottom: 10, fontSize: 15, backgroundColor: '#F9FAFB',
  },
  addBtn: { backgroundColor: '#4F46E5', borderRadius: 8, padding: 12, alignItems: 'center' },
  disabledBtn: { backgroundColor: '#9CA3AF' },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  menuCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 10, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', elevation: 1,
  },
  menuCardContent: { flex: 1 },
  menuItemName: { fontWeight: 'bold', fontSize: 15, color: '#111827' },
  menuItemDesc: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  menuItemPrice: { color: '#4F46E5', fontWeight: '600', marginTop: 4, fontSize: 15 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 20 },
});
