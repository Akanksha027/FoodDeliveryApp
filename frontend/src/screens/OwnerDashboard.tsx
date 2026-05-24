// src/screens/OwnerDashboard.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { supabase } from '../lib/supabase';
import { clearSession } from '../utils/session';

// Direct localhost since EXPO_PUBLIC vars are not available on Expo Web bundle
const BACKEND = 'http://localhost:3000';

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
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '' });
  const [addingItem, setAddingItem] = useState(false);

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
    } catch (e) {
      console.error('Failed to fetch menu', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchOrders(), fetchMenu()]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchOrders(), fetchMenu()]);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);

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
    if (!newItem.name || !newItem.price) {
      Alert.alert('Error', 'Name and price are required');
      return;
    }
    setAddingItem(true);
    try {
      const res = await fetch(`${BACKEND}/api/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({
          name: newItem.name,
          description: newItem.description,
          price: parseFloat(newItem.price),
        }),
      });
      if (res.ok) {
        setNewItem({ name: '', description: '', price: '' });
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await clearSession();
    navigation.replace('Login');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👑 Admin Dashboard</Text>
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
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
            Orders ({orders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'menu' && styles.activeTab]}
          onPress={() => setActiveTab('menu')}
        >
          <Text style={[styles.tabText, activeTab === 'menu' && styles.activeTabText]}>
            Menu ({menuItems.length})
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
        ) : (
          <>
            {/* Add New Item Form */}
            <View style={styles.addItemCard}>
              <Text style={styles.sectionTitle}>+ Add Menu Item</Text>
              <TextInput
                style={styles.input}
                placeholder="Item Name *"
                value={newItem.name}
                onChangeText={v => setNewItem(p => ({ ...p, name: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={newItem.description}
                onChangeText={v => setNewItem(p => ({ ...p, description: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Price (₹) *"
                value={newItem.price}
                onChangeText={v => setNewItem(p => ({ ...p, price: v }))}
                keyboardType="numeric"
              />
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
                <View key={item.id} style={styles.menuCard}>
                  <View style={styles.menuCardContent}>
                    <Text style={styles.menuItemName}>{item.name}</Text>
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
              ))
            )}
          </>
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
