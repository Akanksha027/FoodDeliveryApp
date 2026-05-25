// src/screens/CustomerHomeScreen.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const T = {
  bg: '#F5F6FA',
  surface: '#FFFFFF',
  accent: '#FF5A30',
  accentBg: '#FFF4F1',
  dark: '#1C1C2E',
  text: '#111111',
  sub: '#9CA3AF',
  star: '#FBBF24',
  green: '#16A34A',
  greenBg: '#F0FDF4',
};

const CATEGORIES = [
  { id: 'burger', label: 'Food', image: require('../../assets/burger.png') },
  { id: 'pizza', label: 'Groceries', image: require('../../assets/pizza.jpg') },
  { id: 'fries', label: 'Stores', image: require('../../assets/fries.png') },
  { id: 'drink', label: 'Drink', image: require('../../assets/drinks.png') },
];

const RESTAURANTS = [
  { id: '1', name: 'Burger Palace', type: 'Burgers & Snacks', rating: '4.9', time: '15–20 min', emoji: '🍔', freeDelivery: true },
  { id: '2', name: 'Pizzeria Roma', type: 'Pizza & Pasta', rating: '4.8', time: '20–30 min', emoji: '🍕', freeDelivery: false },
  { id: '3', name: 'Tokyo Garden', type: 'Japanese Cuisine', rating: '4.9', time: '25–35 min', emoji: '🍣', freeDelivery: true },
  { id: '4', name: 'Fresh Squeeze', type: 'Drinks & Bowls', rating: '4.7', time: '10–15 min', emoji: '🥤', freeDelivery: false },
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
  if (n.includes('pizza') || n.includes('pasta') || n.includes('arrabiata')) return require('../../assets/pizza.jpg');
  if (n.includes('fries') || n.includes('french')) return require('../../assets/fries.png');
  if (n.includes('coffee') || n.includes('drink') || n.includes('tea') || n.includes('shake') || n.includes('smoothie')) return require('../../assets/drinks.png');
  return require('../../assets/burger.png');
};

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
  const cardWidth = ACTUAL_LAYOUT_W * 0.65;

  return (
    <View style={[s.card, { width: cardWidth }]}>
      {/* Card background - dark left section */}
      <View style={s.cardLeft}>



        {/* Name and price */}
        <View style={s.cardContent}>
          <Text style={s.cardName}>{item.name}</Text>
          <Text style={s.cardPrice}>₹{item.price}</Text>
          <View style={s.specialOffer}>
            <Text style={s.specialOfferIcon}>⚡</Text>
            <Text style={s.specialOfferText}>Special offers</Text>
          </View>
          <Text style={s.discountText}>25% Off Prices</Text>
        </View>

        {/* Cart button */}
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
          <TouchableOpacity style={s.cartCircleBtn} activeOpacity={0.85} onPress={() => onAddToCart(item)}>
            <Text style={s.cartCircleBtnText}>🛒</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Food image - overlapping right side */}
      <View style={s.cardImageContainer}>
        <Image source={getDishImage(item.name)} style={s.cardImage} />

        {/* Heart button */}
        <TouchableOpacity
          style={[s.heartBtn, isLiked && s.heartBtnActive]}
          onPress={() => onToggleLike(item.id)}
          activeOpacity={0.8}
        >
          <Text style={s.heartIcon}>{isLiked ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      {/* Rating top right */}

    </View>
  );
};

export const CustomerHomeScreen = ({
  menuItems,
  cart,
  liked,
  detectedLocation,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  filteredFoods,
  getCartQty,
  handleAddToCart,
  handleUpdateQty,
  toggleLike,
  setLocationState,
  setActiveNav,
  cartCount,
  navigation,
}: any) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* ── Header ── */}
        <View style={s.foodHomeHeader}>
          <TouchableOpacity
            style={s.locationRow}
            activeOpacity={0.7}
            onPress={() => setLocationState('requesting')}
          >
            <Image source={require('../../assets/navigation.png')} style={s.locationIconImg} resizeMode="contain" />
            <View>
              <Text style={s.deliverToLabel}>Deliver to</Text>
              <View style={s.locationAddressRow}>
                <Text style={s.locationText} numberOfLines={1}>
                  {detectedLocation?.address || 'Set Location'}
                </Text>
                <Text style={s.chevron}>▾</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={s.headerRight}>
            <TouchableOpacity style={s.iconBtn} activeOpacity={0.75}>
              <Text style={s.iconBtnEmoji}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} activeOpacity={0.75} onPress={() => setActiveNav('cart')}>
              <Image source={require('../../assets/tabs/cart.png')} style={s.heartCircleIconImg} resizeMode="contain" />
              {cartCount > 0 && <View style={s.notifPip} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Headline ── */}
        <View style={s.headlineContainer}>
          <Text style={s.headline}>
            <Text style={s.headlineLight}>What's </Text>
            <Text style={s.headlineBold}>Your Craving</Text>
            {'\n'}
            <Text style={s.headlineLight}>Today?</Text>
            <Text style={s.headlineEmoji}> 🎯</Text>
          </Text>
        </View>

        {/* ── Search ── */}
        <View style={s.searchRow}>
          <View style={s.searchBar}>
            <Image source={require('../../assets/search.png')} style={s.searchIconImg} resizeMode="contain" />
            <TextInput
              style={s.searchInput}
              placeholder="Search for food or restaurants..."
              placeholderTextColor="#aaa"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={s.filterBtn} activeOpacity={0.8}>
            <Text style={s.filterBtnText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* ── Categories ── */}
        <View style={s.categoryHeader}>
          <Text style={s.categoryTitle}>Category</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={s.seeAllText}>See all ›</Text>
          </TouchableOpacity>
        </View>

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
              onPress={() => setActiveCategory((prev: any) => prev === cat.id ? '' : cat.id)}
            />
          ))}
        </ScrollView>

        {/* ── Popular Food (Only visible when not searching or filtering) ── */}
        {!searchQuery && !activeCategory && (
          <>
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
              snapToInterval={ACTUAL_LAYOUT_W * 0.65 + 16}
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
          {filteredFoods.map((item: any) => (
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
                            const cartItem = cart.find((c: any) => c.id === item.id);
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

        {/* Near You / Big brands restaurant list */}


        {/* Bottom padding for nav bar */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },

  // ── Header ──
  foodHomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: T.bg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationIconImg: {
    width: 20,
    height: 20,
    tintColor: T.accent,
  },
  deliverToLabel: {
    fontSize: 11,
    color: T.sub,
    fontWeight: '500',
  },
  locationAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '700',
    color: T.text,
    maxWidth: 180,
  },
  chevron: {
    fontSize: 12,
    color: T.text,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: T.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.07,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 3 },
    }),
  },
  iconBtnEmoji: {
    fontSize: 18,
  },
  heartCircleIconImg: {
    width: 22,
    height: 22,
  },
  notifPip: {
    position: 'absolute', top: 7, right: 7,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: T.accent,
    borderWidth: 1.5, borderColor: T.surface,
  },

  // ── Headline ──
  headlineContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
  },
  headline: {
    lineHeight: 38,
  },
  headlineLight: {
    fontSize: 28,
    fontWeight: '400',
    color: T.text,
  },
  headlineBold: {
    fontSize: 28,
    fontWeight: '800',
    color: T.text,
  },
  headlineEmoji: {
    fontSize: 24,
  },

  // ── Search ──
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 22,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECECEC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 10,
  },
  searchIconImg: {
    width: 17,
    height: 17,
    tintColor: '#aaa',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: T.text,
    padding: 0,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: T.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtnText: {
    fontSize: 18,
  },

  // ── Category ──
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: T.text,
  },
  seeAllText: {
    fontSize: 13,
    color: T.sub,
    fontWeight: '500',
  },
  categoryRow: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    borderRadius: 50,
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  pillSelected: {
    backgroundColor: T.accent,
  },
  pillImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  pillTextSelected: {
    color: '#fff',
  },

  // ── Popular Food Cards (new design) ──
  cardList: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 8,
    paddingBottom: 16,
  },
  card: {
    borderRadius: 22,
    backgroundColor: T.dark,
    flexDirection: 'row',
    overflow: 'visible',
    height: 180,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 8 },
    }),
  },
  cardLeft: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-start',
    zIndex: 2,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 6,
    gap: 4,
  },
  timeBadgeIcon: {
    fontSize: 11,
  },
  timeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
    gap: 4,
  },
  deliveryBadgeIcon: {
    fontSize: 11,
  },
  deliveryBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  cardContent: {
    flex: 1,
  },
  cardName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
    lineHeight: 20,
  },
  cardPrice: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  specialOffer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  specialOfferIcon: {
    fontSize: 10,
  },
  specialOfferText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '500',
  },
  discountText: {
    color: T.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  cartCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.accent,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  cartCircleBtnText: {
    fontSize: 16,
  },
  cardImageContainer: {
    width: 150,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
    marginTop: -30,
    marginRight: -10,
    zIndex: 3,
  },
  cardImage: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
  },
  weightBadge: {
    position: 'absolute',
    top: 20,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  weightText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  heartBtn: {
    position: 'absolute',
    bottom: 20,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: T.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 4 },
    }),
  },
  heartBtnActive: {
    backgroundColor: T.surface,
  },
  heartIcon: {
    fontSize: 15,
  },
  ratingBadgeCard: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#3D3D4E',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 4,
  },
  ratingBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  popularQtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.accent,
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 10,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  popularSmallBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popularSmallBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    marginTop: -2,
  },
  popularQtyText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Menu Grid ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: T.text },
  seeAll: { fontSize: 13, fontWeight: '600', color: T.sub },
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
  empty: { flex: 1, paddingVertical: 32, alignItems: 'center', width: '100%' },
  emptyTxt: { color: T.sub, fontSize: 14 },

  // ── Restaurants ──
  restList: { paddingHorizontal: 16, gap: 12, paddingBottom: 8 },
  rcard: {
    backgroundColor: T.surface,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: 260,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.07,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 3 },
    }),
  },
  rcardThumb: {
    width: 60, height: 60, borderRadius: 14,
    backgroundColor: T.accentBg,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  rcardEmoji: { fontSize: 28 },
  rcardInfo: { flex: 1 },
  rcardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  freshnessTag: {
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  freshnessText: {
    fontSize: 9,
    color: T.green,
    fontWeight: '600',
  },
  rcardStarBadge: {
    backgroundColor: '#FFF9EB',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rcardStarBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  rcardName: { fontSize: 14, fontWeight: '700', color: T.text, marginBottom: 2 },
  rcardType: { fontSize: 11, color: T.sub, fontWeight: '400', marginBottom: 6 },
  rcardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rcardDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#D1D5DB' },
  rcardTime: { fontSize: 11, color: T.sub, fontWeight: '500' },
  freeBadge: { backgroundColor: T.greenBg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  freeTxt: { fontSize: 10, fontWeight: '700', color: T.green },
});