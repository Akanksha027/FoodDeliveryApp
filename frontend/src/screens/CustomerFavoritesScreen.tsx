// src/screens/CustomerFavoritesScreen.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';

const T = {
  bg: '#F5F6FA',
  surface: '#FFFFFF',
  accent: '#FF6B35', // Brand Orange
  accentBg: '#FFF4F1',
  dark: '#1C1C2E',
  text: '#111111',
  sub: '#9CA3AF',
  border: '#F0F0F5',
};

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
  if (n.includes('pizza') || n.includes('pasta') || n.includes('arrabiata')) return require('../../assets/pizza.jpg');
  if (n.includes('fries') || n.includes('french')) return require('../../assets/fries.png');
  if (n.includes('coffee') || n.includes('drink') || n.includes('tea') || n.includes('shake') || n.includes('smoothie')) return require('../../assets/drinks.png');
  return require('../../assets/burger.png'); // default fallback
};

export const CustomerFavoritesScreen = ({
  menuItems,
  liked,
  toggleLike,
  handleAddToCart,
  navigation,
}: any) => {
  const favoriteItems = menuItems.filter((f: any) => liked[f.id]);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />

      {/* Header Container */}
      <View style={s.header}>
        <View>
          <Text style={s.tabTitle}>My Favorites</Text>
          <Text style={s.tabSub}>Loved food collections</Text>
        </View>
        <View style={s.countBadge}>
          <Text style={s.countText}>
            {favoriteItems.length} {favoriteItems.length === 1 ? 'Item' : 'Items'}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <View style={s.foodGrid}>
          {favoriteItems.map((item: any) => (
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
                  <View style={s.heartIconWrap}>
                    <Ionicons name="heart" size={18} color="#EF4444" />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={s.fcardBody}>
                <Text style={s.fcardName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={s.fcardFoot}>
                  <Text style={s.fcardPrice}>₹{item.price}</Text>
                  <TouchableOpacity
                    style={s.addBtn}
                    onPress={() => handleAddToCart(item)}
                    activeOpacity={0.8}
                  >
                    <Feather name="plus" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {favoriteItems.length === 0 && (
          <View style={s.emptyContainer}>
            <View style={s.emptyIconCircle}>
              <Ionicons name="heart-outline" size={48} color="#FF6B35" />
            </View>
            <Text style={s.emptyTitle}>Liked items will appear here ❤️</Text>
            <Text style={s.emptySubtitle}>
              Tap the heart icon on any food item to save your absolute favorites here for easy access!
            </Text>
            <TouchableOpacity
              style={s.exploreBtn}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.8}
            >
              <Text style={s.exploreBtnText}>Browse Delicious Food</Text>
              <Feather name="arrow-right" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#F5F6FA',
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1C1C2E',
    letterSpacing: -0.5,
  },
  tabSub: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: '#FFF4F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE0D6',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B35',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  fcard: {
    backgroundColor: T.surface,
    borderRadius: 24,
    overflow: 'hidden',
    ...shadow(4),
    padding: 8,
    borderWidth: 1,
    borderColor: '#F0F0F5',
  },
  fcardImg: {
    width: '100%',
    aspectRatio: 1.15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FB',
    borderRadius: 18,
    position: 'relative',
  },
  fcardImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  likeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  heartIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(2),
  },
  fcardBody: {
    paddingTop: 10,
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  fcardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C2E',
    marginBottom: 6,
  },
  fcardFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fcardPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C2E',
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(2),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFE0D6',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C2E',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    ...shadow(3),
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
