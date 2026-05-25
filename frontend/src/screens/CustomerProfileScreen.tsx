// src/screens/CustomerProfileScreen.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';

export const CustomerProfileScreen = ({
  currentUser,
  addresses,
  setAddressModalVisible,
  fetchCouponsForUser,
  setCouponsModalVisible,
  handleLogout,
  navigation,
}: any) => {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      {/* Premium Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 }}>
          <Text style={{ fontSize: 18 }}>👤</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111' }}>Profile</Text>
        <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 }}>
          <Text style={{ fontSize: 18 }}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* User Profile Card */}
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
          {/* Avatar */}
          <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: '#FFF4F1', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFE4DE' }}>
            <Text style={{ fontSize: 32 }}>👩‍💻</Text>
          </View>
          {/* Name and Default Address */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#111' }} numberOfLines={1}>
              {addresses.find((a: any) => a.is_default)?.receiver_name || currentUser?.email?.split('@')[0] || 'Customer User'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
              <Text style={{ fontSize: 12, color: '#9CA3AF' }}>📍</Text>
              <Text style={{ fontSize: 12, color: '#9CA3AF', flex: 1 }} numberOfLines={1}>
                {(() => {
                  const defAddr = addresses.find((a: any) => a.is_default) || addresses[0];
                  return defAddr 
                    ? `${defAddr.address_line1}, ${defAddr.city}` 
                    : 'No address added yet';
                })()}
              </Text>
            </View>
          </View>
        </View>
        {/* Pencil Edit Icon */}
        <TouchableOpacity 
          onPress={() => setAddressModalVisible(true)}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ fontSize: 16 }}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* Settings Section 1 */}
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 18, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Settings</Text>
        
        {/* Rewards */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F9FAFB' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFBEB', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 16 }}>🏆</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111' }}>Rewards</Text>
          </View>
          <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '500' }}>0 points</Text>
        </View>

        {/* Your orders */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('OrdersHistory', { userId: currentUser?.id })}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F9FAFB' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2F6', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 16 }}>📋</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111' }}>Your orders</Text>
          </View>
          <Text style={{ fontSize: 16, color: '#9CA3AF', fontWeight: '700' }}>›</Text>
        </TouchableOpacity>

        {/* Cravk pay */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F9FAFB' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 16 }}>💳</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111' }}>Cravk pay</Text>
          </View>
          <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '500' }}>₹0.00</Text>
        </View>

        {/* Vouchers */}
        <TouchableOpacity
          onPress={() => { fetchCouponsForUser(); setCouponsModalVisible(true); }}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F9FAFB' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF1F2', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 16 }}>🏷️</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111' }}>Vouchers</Text>
          </View>
          <Text style={{ fontSize: 16, color: '#9CA3AF', fontWeight: '700' }}>›</Text>
        </TouchableOpacity>

        {/* Cravk pro */}
        <TouchableOpacity
          onPress={() => Alert.alert('⚡ Cravk Pro', 'Cravk Pro subscription is coming soon! Enjoy free deliveries.')}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 16 }}>👑</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111' }}>Cravk pro</Text>
          </View>
          <Text style={{ fontSize: 16, color: '#9CA3AF', fontWeight: '700' }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Settings Section 2 */}
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 18, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Settings</Text>
        
        {/* Get help */}
        <TouchableOpacity
          onPress={() => Alert.alert('💬 Support', 'Need help? Contact support at support@cravk.com')}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F9FAFB' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 16 }}>❓</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111' }}>Get help</Text>
          </View>
          <Text style={{ fontSize: 16, color: '#9CA3AF', fontWeight: '700' }}>›</Text>
        </TouchableOpacity>

        {/* About app */}
        <TouchableOpacity
          onPress={() => Alert.alert('ℹ️ About App', 'Cravk Food Delivery App v1.0.0\nBuilt with ❤️ using React Native & Supabase.')}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 16 }}>ℹ</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111' }}>About app</Text>
          </View>
          <Text style={{ fontSize: 16, color: '#9CA3AF', fontWeight: '700' }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Delivery Addresses manage row (Integrated address manage feature) */}
      <TouchableOpacity
        onPress={() => {
          Alert.alert(
            'Addresses Manage',
            `You have ${addresses.length} addresses. Click to add a new address.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Add New', onPress: () => setAddressModalVisible(true) }
            ]
          );
        }}
        activeOpacity={0.8}
        style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16 }}>🏠</Text>
          </View>
          <View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111' }}>Delivery Addresses</Text>
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{addresses.length} addresses configured</Text>
          </View>
        </View>
        <Text style={{ fontSize: 16, color: '#9CA3AF', fontWeight: '700' }}>›</Text>
      </TouchableOpacity>

      {/* Log out */}
      <TouchableOpacity
        onPress={handleLogout}
        activeOpacity={0.8}
        style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 }}
      >
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16 }}>🚪</Text>
        </View>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#EF4444' }}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
};
