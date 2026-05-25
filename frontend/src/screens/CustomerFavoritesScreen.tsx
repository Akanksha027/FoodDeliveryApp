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
} from 'react-native';

const T = {
  bg: '#F5F6FA',
  surface: '#FFFFFF',
  accent: '#FF5A30',
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
    <View style={s.tabWrapper}>
      <Text style={s.tabTitle}>My Favorites</Text>
      <Text style={s.tabSub}>Loved food collections</Text>

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
        {favoriteItems.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyTxt}>Liked items will appear here ❤️</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  tabWrapper: { paddingHorizontal: 16, paddingTop: 12 },
  tabTitle: { fontSize: 22, fontWeight: '900', color: T.text },
  tabSub: { fontSize: 13, color: T.sub, marginTop: 3, marginBottom: 16 },
  foodGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 14,
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
  fcardBody: { paddingTop: 10, paddingHorizontal: 4 },
  fcardName: { fontSize: 14, fontWeight: '700', color: '#1C1C2E', marginBottom: 4 },
  fcardFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fcardPrice: { fontSize: 16, fontWeight: '800', color: '#1C1C2E' },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#CCFF00',
    alignItems: 'center', justifyContent: 'center',
    ...shadow(2),
  },
  addBtnTxt: { fontSize: 18, fontWeight: '700', color: '#111111', lineHeight: 22 },
  empty: { flex: 1, paddingVertical: 80, alignItems: 'center', width: '100%', justifyContent: 'center' },
  emptyTxt: { color: T.sub, fontSize: 14, fontWeight: '600' },
});
