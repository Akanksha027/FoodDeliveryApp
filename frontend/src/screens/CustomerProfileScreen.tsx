// src/screens/CustomerProfileScreen.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';

export const CustomerProfileScreen = ({
  currentUser,
  addresses,
  setAddressModalVisible,
  fetchCouponsForUser,
  setCouponsModalVisible,
  handleLogout,
  navigation,
}: any) => {

  const defaultAddress = addresses.find((a: any) => a.is_default) || addresses[0];
  const displayName =
    defaultAddress?.receiver_name ||
    currentUser?.email?.split('@')[0] ||
    'User';
  const displayAddress = defaultAddress
    ? `${defaultAddress.address_line1}, ${defaultAddress.city}`
    : 'No address added yet';

  const RowItem = ({
    icon,
    label,
    right,
    onPress,
    isLast = false,
  }: {
    icon: React.ReactNode;
    label: string;
    right?: React.ReactNode;
    onPress?: () => void;
    isLast?: boolean;
  }) => {
    const Wrapper: any = onPress ? TouchableOpacity : View;
    return (
      <Wrapper
        onPress={onPress}
        activeOpacity={0.6}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 14,
          borderBottomWidth: isLast ? 0 : 1,
          borderColor: '#F0F0F0',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: '#F4F4F4',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {icon}
          </View>
          <Text style={{ fontSize: 15, fontWeight: '500', color: '#1A1A1A', letterSpacing: 0.1 }}>
            {label}
          </Text>
        </View>
        {right ?? <Feather name="chevron-right" size={18} color="#BBBBBB" />}
      </Wrapper>
    );
  };

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{
      backgroundColor: '#FFFFFF',
      marginHorizontal: 16,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 4,
      marginBottom: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    }}>
      <Text style={{
        fontSize: 11,
        fontWeight: '700',
        color: '#AAAAAA',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
      }}>
        {title}
      </Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F6F6' }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F6" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 16,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={() => navigation?.navigate?.('CustomerDashboard', { tab: 'home' })}
              style={{ marginRight: 12, paddingVertical: 4 }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back-outline" size={24} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.3 }}>
              Profile
            </Text>
          </View>
          <TouchableOpacity style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#FFFFFF',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <Feather name="bell" size={18} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={{
          backgroundColor: '#FFFFFF',
          marginHorizontal: 16,
          borderRadius: 16,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            {/* Avatar */}
            <View style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              backgroundColor: '#EFEFEF',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Feather name="user" size={24} color="#555555" />
            </View>
            {/* Info */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.2 }} numberOfLines={1}>
                {displayName}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Feather name="map-pin" size={11} color="#AAAAAA" />
                <Text style={{ fontSize: 12, color: '#AAAAAA', flex: 1 }} numberOfLines={1}>
                  {displayAddress}
                </Text>
              </View>
            </View>
          </View>
          {/* Edit */}
          <TouchableOpacity
            onPress={() => setAddressModalVisible(true)}
            style={{ padding: 6 }}
          >
            <Feather name="edit-2" size={16} color="#AAAAAA" />
          </TouchableOpacity>
        </View>

        {/* Section 1 — Account */}
        <SectionCard title="Account">
          <RowItem
            icon={<Ionicons name="ribbon-outline" size={18} color="#333" />}
            label="Rewards"
            right={<Text style={{ fontSize: 13, color: '#AAAAAA', fontWeight: '500' }}>0 points</Text>}
          />
          <RowItem
            icon={<Feather name="package" size={18} color="#333" />}
            label="Your orders"
            onPress={() => navigation.navigate('OrdersHistory', { userId: currentUser?.id })}
          />
          <RowItem
            icon={<Feather name="credit-card" size={18} color="#333" />}
            label="Sandwiches pay"
            right={<Text style={{ fontSize: 13, color: '#AAAAAA', fontWeight: '500' }}>₹0.00</Text>}
          />
          <RowItem
            icon={<Feather name="tag" size={18} color="#333" />}
            label="Vouchers"
            onPress={() => { fetchCouponsForUser(); setCouponsModalVisible(true); }}
          />
          <RowItem
            icon={<Feather name="star" size={18} color="#333" />}
            label="Sandwiches pro"
            onPress={() => Alert.alert('Sandwiches Pro', 'Sandwiches Pro subscription is coming soon! Enjoy free deliveries.')}
            isLast
          />
        </SectionCard>

        {/* Section 2 — Support */}
        <SectionCard title="Support">
          <RowItem
            icon={<Feather name="help-circle" size={18} color="#333" />}
            label="Get help"
            onPress={() => Alert.alert('Support', 'Need help? Contact support at support@sandwiches.com')}
          />
          <RowItem
            icon={<Feather name="info" size={18} color="#333" />}
            label="About app"
            onPress={() => Alert.alert('About App', 'Sandwiches App v1.0.0\nBuilt with ❤️ using React Native & Supabase.')}
            isLast
          />
        </SectionCard>

        {/* Delivery Addresses */}
        <TouchableOpacity
          onPress={() => setAddressModalVisible(true)}
          activeOpacity={0.7}
          style={{
            backgroundColor: '#FFFFFF',
            marginHorizontal: 16,
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F4F4F4', justifyContent: 'center', alignItems: 'center' }}>
              <Feather name="home" size={18} color="#333" />
            </View>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#1A1A1A' }}>Delivery Addresses</Text>
              <Text style={{ fontSize: 12, color: '#AAAAAA', marginTop: 2 }}>
                {addresses.length} address{addresses.length !== 1 ? 'es' : ''} configured
              </Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color="#BBBBBB" />
        </TouchableOpacity>

        {/* Log out */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.7}
          style={{
            backgroundColor: '#FFFFFF',
            marginHorizontal: 16,
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' }}>
            <Feather name="log-out" size={18} color="#EF4444" />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#EF4444' }}>Log out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};