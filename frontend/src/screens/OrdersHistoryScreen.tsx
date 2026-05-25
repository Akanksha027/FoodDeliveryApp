// src/screens/OrdersHistoryScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMyOrders, cancelOrder } from '../lib/api';

const T = {
  bg: '#F5F6FA',
  surface: '#FFFFFF',
  accent: '#FF5A30',
  accentBg: '#FFF4F1',
  dark: '#1C1C2E',
  text: '#111111',
  sub: '#9CA3AF',
  border: '#F0F0F5',
  green: '#16A34A',
  greenBg: '#F0FDF4',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#FBBF24',
  preparing: '#3B82F6',
  ready: '#8B5CF6',
  delivered: '#16A34A',
  cancelled: '#EF4444',
};

export const OrdersHistoryScreen = ({ route, navigation }: any) => {
  const { userId } = route.params;
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  const fetchOrders = async () => {
    try {
      const data = await getMyOrders(userId);
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[OrdersHistory] Failed to fetch orders:', e);
      Alert.alert('Error', 'Failed to retrieve order history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
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
              Alert.alert('Order Cancelled', 'Your order was successfully cancelled.');
              fetchOrders();
            } catch (e: any) {
              Alert.alert('Cancellation Failed', e.message || 'Could not cancel order.');
            }
          },
        },
      ]
    );
  };

  const activeOrders = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  );
  
  const pastOrders = orders.filter(
    (o) => o.status === 'delivered' || o.status === 'cancelled'
  );

  const displayedOrders = activeTab === 'active' ? activeOrders : pastOrders;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs Row */}
      <View style={s.tabContainer}>
        <TouchableOpacity
          style={[s.tabButton, activeTab === 'active' && s.tabButtonActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[s.tabButtonText, activeTab === 'active' && s.tabButtonTextActive]}>
            Active ({activeOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabButton, activeTab === 'past' && s.tabButtonActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[s.tabButtonText, activeTab === 'past' && s.tabButtonTextActive]}>
            Past Orders ({pastOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={T.accent} />
          <Text style={s.loadingText}>Fetching your orders...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[T.accent]} />}
        >
          {displayedOrders.length === 0 ? (
            <View style={s.emptyContainer}>
              <Text style={s.emptyEmoji}>🛍️</Text>
              <Text style={s.emptyText}>
                {activeTab === 'active' ? 'No active orders right now!' : 'No order history found.'}
              </Text>
              {activeTab === 'active' && (
                <TouchableOpacity style={s.shopBtn} onPress={() => navigation.goBack()}>
                  <Text style={s.shopBtnText}>Browse Menu</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            displayedOrders
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
                  <View key={order.id} style={s.orderCard}>
                    <View style={s.orderHeader}>
                      <View>
                        <Text style={s.orderId}>ORDER #{order.id?.slice(-6).toUpperCase()}</Text>
                        <Text style={s.orderDate}>{formattedDate}</Text>
                      </View>
                      <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[order.status] || '#555' }]}>
                        <Text style={s.statusBadgeText}>{order.status?.toUpperCase()}</Text>
                      </View>
                    </View>

                    <View style={s.divider} />

                    {/* Items */}
                    <View style={s.itemsContainer}>
                      {parsedItems.map((item: any, idx: number) => (
                        <View key={idx} style={s.itemRow}>
                          <Text style={s.itemName}>
                            • {item.name} <Text style={s.itemQty}>x{item.quantity}</Text>
                          </Text>
                          <Text style={s.itemPrice}>
                            ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <View style={s.divider} />

                    {/* Total Summary */}
                    <View style={s.priceRow}>
                      <Text style={s.priceLabel}>Paid Amount:</Text>
                      <Text style={s.priceValue}>₹{parseFloat(order.total).toFixed(2)}</Text>
                    </View>

                    {/* Address details */}
                    {order.addresses && (
                      <View style={s.addrContainer}>
                        <Text style={s.addrText}>
                          📍 Delivery to: <Text style={{ fontWeight: '600' }}>{order.addresses.receiver_name}</Text>
                        </Text>
                        <Text style={s.addrSubText}>
                          {order.addresses.address_line1}, {order.addresses.city}
                        </Text>
                      </View>
                    )}

                    {/* Actions */}
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <TouchableOpacity
                        style={s.cancelBtn}
                        onPress={() => handleCancelOrder(order.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={s.cancelBtnText}>Cancel Order</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F6FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 26,
    color: '#111',
    fontWeight: '300',
    marginTop: -3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C2E',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#FF5A30',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#FF5A30',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
  },
  loadingText: {
    marginTop: 10,
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#F5F6FA',
    minHeight: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
    textAlign: 'center',
  },
  shopBtn: {
    marginTop: 20,
    backgroundColor: '#FF5A30',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  shopBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontWeight: '800',
    fontSize: 14,
    color: '#1C1C2E',
  },
  orderDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F5',
    marginVertical: 12,
  },
  itemsContainer: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 13,
    color: '#111111',
    flex: 1,
    marginRight: 8,
  },
  itemQty: {
    color: '#9CA3AF',
    fontWeight: '700',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FF5A30',
  },
  addrContainer: {
    marginTop: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
  },
  addrText: {
    fontSize: 12,
    color: '#111111',
  },
  addrSubText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  cancelBtn: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  cancelBtnText: {
    color: '#E11D48',
    fontWeight: '800',
    fontSize: 13,
  },
});
