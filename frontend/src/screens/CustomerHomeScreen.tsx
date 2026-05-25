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
} from 'react-native';

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
  { id: 'burger', label: 'Burger', image: require('../../assets/burger.png') },
  { id: 'pizza', label: 'Pizza', image: require('../../assets/pizza.jpg') },
  { id: 'fries', label: 'Fries', image: require('../../assets/fries.png') },
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
  return require('../../assets/burger.png'); // default fallback
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
  return (
    <View style={{ flex: 1 }}>
      {/* ── Header ── */}
      <View style={s.foodHomeHeader}>
        <TouchableOpacity
          style={s.locationRow}
          activeOpacity={0.7}
          onPress={() => setLocationState('requesting')}
        >
          <Image source={require('../../assets/navigation.png')} style={s.locationIconImg} resizeMode="contain" />
          <Text style={[s.locationText, { maxWidth: ACTUAL_LAYOUT_W - 120 }]} numberOfLines={1}>
            {detectedLocation?.address || 'Set Location'}
          </Text>
          <Text style={{ fontSize: 12, marginLeft: 4, color: T.accent }}>▼</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.heartCircle} activeOpacity={0.75} onPress={() => setActiveNav('cart')}>
          <Image source={require('../../assets/tabs/cart.png')} style={s.heartCircleIconImg} resizeMode="contain" />
          {cartCount > 0 && <View style={s.notifPip} />}
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={s.searchBar}>
        <Image source={require('../../assets/search.png')} style={s.searchIconImg} resizeMode="contain" />
        <TextInput
          style={s.searchInput}
          placeholder="Type to search"
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* ── Categories ── */}
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
          <View style={s.foodHomeSectionHeader}>
            <Text style={s.foodHomeSectionTitle}>Popular Food</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={s.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal cards */}
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
            snapToInterval={ACTUAL_LAYOUT_W * 0.62 + 16}
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

      {/* Near You restaurants list (Only visible when not searching or filtering) */}
      {!searchQuery && !activeCategory && (
        <>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Near you</Text>
            <Text style={s.seeAll}>Online Kitchens</Text>
          </View>

          <FlatList
            data={RESTAURANTS}
            keyExtractor={i => i.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.restList}
            renderItem={({ item }) => (
              <View style={s.rcard}>
                <View style={s.rcardThumb}>
                  <Text style={s.rcardEmoji}>{item.emoji}</Text>
                </View>
                <View style={s.rcardInfo}>
                  <Text style={s.rcardName} numberOfLines={1}>{item.name}</Text>
                  <Text style={s.rcardType}>{item.type}</Text>
                  <View style={s.rcardMeta}>
                    <Text style={s.rcardStar}>★ {item.rating}</Text>
                    <View style={s.rcardDot} />
                    <Text style={s.rcardTime}>{item.time}</Text>
                    {item.freeDelivery && (
                      <View style={s.freeBadge}>
                        <Text style={s.freeTxt}>Free</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
};

const s = StyleSheet.create({
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
  heartCircleIconImg: {
    width: 26,
    height: 26,
  },
  notifPip: {
    position: 'absolute', top: 7, right: 7,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: T.accent,
    borderWidth: 1.5, borderColor: '#FFFFFF',
  },
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
  cardList: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    position: 'relative',
    height: 220,
    ...shadow(4),
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: T.text },
  seeAll: { fontSize: 13, fontWeight: '600', color: T.accent },
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
});
