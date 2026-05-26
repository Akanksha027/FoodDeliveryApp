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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Responsive spacing helper matching Home screen
const BASE = SCREEN_WIDTH / 390; // Design base is 390px wide (iPhone 14 Pro)
const r = (size: number) => Math.round(size * BASE);

const COLORS = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  orange: '#f49851',
  orangeLight: '#F4A56A',
  text: '#1A1A1A',
  subText: '#888888',
};

const getDishImage = (name: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('burger')) return require('../../assets/burger.png');
  if (n.includes('pizza') || n.includes('pasta') || n.includes('arrabiata')) return require('../../assets/pizza.png');
  if (n.includes('fries') || n.includes('french')) return require('../../assets/fries.png');
  if (n.includes('coffee') || n.includes('drink') || n.includes('tea') || n.includes('shake') || n.includes('smoothie')) return require('../../assets/drinks.png');
  return require('../../assets/burger.png');
};

export const CustomerFavoritesScreen = ({
  menuItems = [],
  cart = [],
  liked = {},
  toggleLike,
  handleAddToCart,
  handleUpdateQty,
  navigation,
}: any) => {
  const favoriteItems = menuItems.filter((f: any) => liked[f.id]);

  const getCartQty = (menuItemId: string) => {
    const found = cart.find((c: any) => c.id === menuItemId);
    return found ? found.quantity : 0;
  };

  // Compute card width exactly like CustomerHomeScreen: 2 cards per row with responsive padding & gaps
  const horizontalPadding = r(16) * 2;
  const foodGaps = r(12);
  const foodCardWidth = (SCREEN_WIDTH - horizontalPadding - foodGaps) / 2;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header Container */}
      <View style={styles.header}>
        <View>
          <Text style={styles.tabTitle}>My Favorites</Text>
          <Text style={styles.tabSub}>Your curated loved selections</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {favoriteItems.length} {favoriteItems.length === 1 ? 'Item' : 'Items'}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
      >
        <View style={styles.foodGrid}>
          {favoriteItems.map((item: any) => {
            const cartQty = getCartQty(item.id);
            const cartItem = cart.find((c: any) => c.id === item.id);

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.fcard, { width: foodCardWidth }]}
                activeOpacity={0.95}
                onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
              >
                <View style={styles.fcardImgBox}>
                  <Image source={getDishImage(item.name)} style={styles.fcardImg} />

                  {/* Dynamic Top-Right Add/Quantity Control */}
                  <View style={styles.topRightControl}>
                    {cartQty > 0 ? (
                      <View style={styles.premiumQtyPill}>
                        <TouchableOpacity
                          onPress={() => {
                            if (cartItem && handleUpdateQty) {
                              handleUpdateQty(cartItem.cart_item_id || cartItem.id, cartItem.quantity, false);
                            }
                          }}
                          style={styles.pillQtyBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.pillQtyText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.pillQtyNum}>{cartQty}</Text>
                        <TouchableOpacity
                          onPress={() => handleAddToCart && handleAddToCart(item)}
                          style={styles.pillQtyBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.pillQtyText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addBtnTopRight}
                        onPress={() => handleAddToCart && handleAddToCart(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.addBtnTxt}>+</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Favorite / Like Heart Button */}
                  <TouchableOpacity
                    style={styles.likeBtn}
                    onPress={() => toggleLike && toggleLike(item.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="heart"
                      size={20}
                      color={COLORS.orange}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.fcardBody}>
                  <Text style={styles.fcardName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.fcardPrice}>₹{item.price}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {favoriteItems.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="heart-outline" size={48} color={COLORS.orange} />
              </View>
              <Text style={styles.emptyTitle}>Liked items will appear here ❤️</Text>
              <Text style={styles.emptySubtitle}>
                Tap the heart icon on any food item to save your absolute favorites here for easy access!
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => navigation.navigate('Home')}
                activeOpacity={0.8}
              >
                <Text style={styles.exploreBtnText}>Browse Delicious Food</Text>
                <Feather name="arrow-right" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={{ height: r(40) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: r(16),
    paddingTop: r(16),
    paddingBottom: r(12),
    backgroundColor: '#FFFFFF',
  },
  tabTitle: {
    fontSize: r(24),
    fontFamily: 'Lora_700Bold',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  tabSub: {
    fontSize: r(13),
    color: '#FFFFFF',
    marginTop: r(2),
    fontFamily: 'Poppins_500Medium',
  },
  countBadge: {
    backgroundColor: '#FFF4EE',
    paddingHorizontal: r(12),
    paddingVertical: r(6),
    borderRadius: r(20),
    borderWidth: 1,
    borderColor: '#FEE5D4',
  },
  countText: {
    fontSize: r(12),
    fontWeight: '700',
    color: COLORS.orange,
    fontFamily: 'Poppins_500Medium',
  },
  scrollContent: {
    paddingHorizontal: r(16),
    paddingTop: r(8),
    paddingBottom: r(40),
  },
  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: r(12),
    justifyContent: 'space-between',
    width: '100%',
  },
  fcard: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
    marginBottom: r(12),
  },
  fcardImgBox: {
    width: '100%',
    aspectRatio: 1.05,
    backgroundColor: '#FFF4EE',
    borderRadius: r(16),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fcardImg: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  likeBtn: {
    position: 'absolute',
    top: r(8),
    left: r(8),
    width: r(26),
    height: r(26),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  fcardBody: {
    paddingTop: r(4),
    paddingHorizontal: 0,
  },
  fcardName: {
    fontSize: r(15),
    fontFamily: 'Lora_700Bold',
    color: '#1A1A1A',
    marginTop: r(6),
    marginBottom: r(2),
  },
  fcardPrice: {
    fontSize: r(13),
    color: '#888888',
    fontFamily: 'Poppins_500Medium',
  },
  topRightControl: {
    position: 'absolute',
    top: r(8),
    right: r(8),
    zIndex: 20,
  },
  addBtnTopRight: {
    width: r(28),
    height: r(28),
    borderRadius: r(14),
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 2 },
    }),
  },
  premiumQtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.orange,
    borderRadius: r(14),
    paddingHorizontal: r(6),
    height: r(28),
    gap: r(4),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 2 },
    }),
  },
  pillQtyBtn: {
    width: r(18),
    height: r(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillQtyText: {
    color: '#FFFFFF',
    fontSize: r(13),
    fontWeight: '700',
  },
  pillQtyNum: {
    color: '#FFFFFF',
    fontSize: r(11),
    fontWeight: '700',
    minWidth: r(14),
    textAlign: 'center',
  },
  addBtnTxt: {
    fontSize: r(18),
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: -r(2),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: r(60),
    paddingHorizontal: r(24),
    width: '100%',
  },
  emptyIconCircle: {
    width: r(100),
    height: r(100),
    borderRadius: r(50),
    backgroundColor: '#FFF4EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: r(20),
    borderWidth: 2,
    borderColor: '#FEE5D4',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: r(18),
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: r(8),
    fontFamily: 'Lora_700Bold',
  },
  emptySubtitle: {
    fontSize: r(13),
    color: '#888888',
    textAlign: 'center',
    lineHeight: r(18),
    marginBottom: r(24),
    fontFamily: 'Poppins_500Medium',
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.orange,
    paddingHorizontal: r(20),
    paddingVertical: r(12),
    borderRadius: r(24),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 2 },
    }),
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: r(14),
    fontFamily: 'Poppins_500Medium',
  },
});
