import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Responsive spacing helper
const BASE = SCREEN_WIDTH / 390; // Design base is 390px wide (iPhone 14 Pro)
const r = (size: number) => Math.round(size * BASE);

// ─── Color palette from the design ────────────────────────────────────────────
const COLORS = {
  bg: '#FFFFFF',            // white background
  card: '#FFFFFF',
  orange: '#f49851',        // primary orange
  orangeLight: '#F4A56A',
  red: '#D94F38',
  green: '#4CAF50',
  star: '#F5A623',
  text: '#1A1A1A',
  subText: '#888888',
  specialBg: '#fef3ea',     // warm beige for specials card
  cookieBg: '#fef3ea',      // warm brown for cookies
  drinksBg: '#C8D8E8',      // light blue for drinks
  dessertBg: '#C4956A',     // caramel brown
  pizzaBg: '#fef3ea',       // terracotta
  saladBg: '#2D4A3A',       // dark green
  burgerBg: '#DCA080',      // warm peachy tan
  friesBg: '#E2CFA5',       // golden sand
  mainBg: '#708C82',        // premium dark sage green
  navBg: '#FFFFFF',
  placeholderBorder: '#E0D0C0',
  placeBg1: '#D4C4B0',      // restaurant 1 placeholder
  placeBg2: '#8CA0B0',      // restaurant 2 placeholder
  bestPrice1: '#F0D0D8',    // pink
  bestPrice2: '#F0E8D0',    // cream
  bestPrice3: '#E8D0C0',    // peach
};

const getDishImage = (name?: string) => {
  if (!name) {
    return require('../../assets/burger.png');
  }
  const n = name.toLowerCase();
  if (n.includes('burger')) return require('../../assets/burger.png');
  if (n.includes('pizza') || n.includes('pasta') || n.includes('arrabiata')) return require('../../assets/pizza.png');
  if (n.includes('fries') || n.includes('french')) return require('../../assets/fries.png');
  if (n.includes('coffee') || n.includes('drink') || n.includes('tea') || n.includes('shake') || n.includes('smoothie') || n.includes('beverage')) return require('../../assets/drinks.png');
  if (n.includes('cookie') || n.includes('sweet') || n.includes('dessert') || n.includes('cake') || n.includes('brownie')) return require('../../assets/fries.png');
  if (n.includes('sandwich') || n.includes('bread') || n.includes('toast') || n.includes('panini')) return require('../../assets/burger.png');
  return require('../../assets/burger.png');
};

const getCatImage = (id?: string) => {
  if (!id) {
    return require('../../assets/burger.png');
  }
  const lowId = id.toLowerCase();
  if (lowId === 'specials') return require('../../assets/burger.png');
  if (lowId.includes('burger')) return require('../../assets/homeBurger.png');
  if (lowId.includes('pizza')) return require('../../assets/pizza.png');
  if (lowId.includes('fries') || lowId.includes('side') || lowId.includes('snack')) return require('../../assets/fries.png');
  if (lowId.includes('drink') || lowId.includes('beverage') || lowId.includes('coffee') || lowId.includes('tea') || lowId.includes('shake')) return require('../../assets/drinks.png');
  if (lowId.includes('cookie') || lowId.includes('sweet') || lowId.includes('dessert') || lowId.includes('cake') || lowId.includes('bakery')) return require('../../assets/fries.png');
  if (lowId.includes('sandwich') || lowId.includes('bread') || lowId.includes('toast') || lowId.includes('panini')) return require('../../assets/homeBurger.png');
  return require('../../assets/burger.png');
};

// ─── Sub-Components with explicit TS typing ────────────────────────────────────

const SpecialBadge = ({ label, color }: { label: string; color: string }) => (
  <View style={[styles.badge, { backgroundColor: color }]}>
    <Text style={styles.badgeText}>{label}</Text>
  </View>
);

const CategoryCard = ({
  item,
  size,
  selected,
  onPress,
}: {
  item: any;
  size: number;
  selected: boolean;
  onPress: () => void;
}) => {
  const cardSize = size || r(114);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.categoryCard,
        {
          backgroundColor: item.bg,
          width: cardSize,
          height: r(90),
        },
        item.special && styles.specialCard,
        selected && styles.categoryCardSelected,
      ]}
    >
      {item.special ? (
        <>
          <Text style={[styles.categoryLabel, { color: '#5C3A1E', fontSize: r(11), lineHeight: r(15) }]}>
            {item.label}
          </Text>
          <View style={styles.badgesRow}>
            {item.accentColors.map((color: string, i: number) => (
              <SpecialBadge key={i} label={item.accentLabels[i]} color={color} />
            ))}
          </View>
        </>
      ) : (
        <>
          <Image source={getCatImage(item.id)} style={styles.categoryImage} />
          <Text style={[styles.categoryLabel, item.lightText && { color: '#FFFFFF' }]}>
            {item.label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const PlaceCard = ({ item }: { item: any }) => (
  <TouchableOpacity activeOpacity={0.85} style={styles.placeCard}>
    <View style={styles.placeImageContainer}>
      <Image source={getDishImage(item.cuisine)} style={styles.placeImage} />
    </View>
    <View style={styles.placeInfo}>
      <View style={styles.placeRow}>
        <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
        {item.rating && (
          <View style={styles.ratingRow}>
            <Text style={styles.ratingStar}>★</Text>
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        )}
      </View>
      <Text style={styles.placeSub}>{item.cuisine} • {item.time}</Text>
    </View>
  </TouchableOpacity>
);

const FoodGridCard = ({
  item,
  cartQty,
  cartItem,
  onAddToCart,
  onUpdateQty,
  isLiked,
  onToggleLike,
  onPress,
  width,
}: any) => (
  <TouchableOpacity
    style={[styles.fcard, { width }]}
    activeOpacity={0.95}
    onPress={onPress}
  >
    <View style={styles.fcardImgBox}>
      <Image source={getDishImage(item.name)} style={styles.fcardImg} />

      {/* Dynamic Top-Right Add/Quantity Control */}
      <View style={styles.topRightControl}>
        {cartQty > 0 ? (
          <View style={styles.premiumQtyPill}>
            <TouchableOpacity
              onPress={() => {
                if (cartItem) onUpdateQty(cartItem.cart_item_id, cartItem.quantity, false);
              }}
              style={styles.pillQtyBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.pillQtyText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.pillQtyNum}>{cartQty}</Text>
            <TouchableOpacity
              onPress={() => onAddToCart(item)}
              style={styles.pillQtyBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.pillQtyText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addBtnTopRight}
            onPress={() => onAddToCart(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnTxt}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Favorite / Like Heart Button */}
      <TouchableOpacity
        style={styles.likeBtn}
        onPress={() => onToggleLike(item.id)}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isLiked ? "heart" : "heart-outline"}
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

// ─── Main HomeScreen Component (Named Export) ──────────────────────────────────
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
  recommendedPlaces,
}: any) => {
  const insets = useSafeAreaInsets();

  const dynamicCategories = React.useMemo(() => {
    const list: any[] = [
      {
        id: 'specials',
        label: 'Specials\nof the week',
        bg: '#fff2e0',
        special: true,
        accentColors: ['#F5A623', '#f49851', '#D94F38'],
        accentLabels: ['-50%', '-75%', '-39%'],
      }
    ];

    const uniqueFromDb = new Set<string>();
    if (Array.isArray(menuItems)) {
      menuItems.forEach((item: any) => {
        if (item.category) {
          const cat = item.category.trim();
          if (cat) {
            uniqueFromDb.add(cat.toLowerCase());
          }
        }
      });
    }

    const knownCategories = [
      { id: 'burger', label: 'Burgers', bg: '#fef3ea' },
      { id: 'pizza', label: 'Pizza', bg: '#fef3ea' },
      { id: 'fries', label: 'Fries', bg: '#fef3ea' },
      { id: 'drink', label: 'Drinks', bg: '#fef3ea' },
      { id: 'cookies', label: 'Cookies', bg: '#fef3ea' },
      { id: 'desserts', label: 'Desserts', bg: '#fef3ea' },
      { id: 'sandwich', label: 'Sandwiches', bg: '#fef3ea' },
      { id: 'salad', label: 'Salads', bg: '#fef3ea' },
    ];

    uniqueFromDb.forEach(catId => {
      const known = knownCategories.find(k => k.id === catId || k.id + 's' === catId || k.id === catId + 's');
      if (known) {
        if (!list.some(x => x.id === known.id)) {
          list.push(known);
        }
      } else {
        const label = catId.charAt(0).toUpperCase() + catId.slice(1);
        list.push({
          id: catId,
          label: label,
          bg: '#fef3ea'
        });
      }
    });

    if (list.length === 1) {
      list.push(
        { id: 'cookies', label: 'Cookies', bg: '#fef3ea' },
        { id: 'burger', label: 'Burgers', bg: '#fef3ea' },
        { id: 'drink', label: 'Drinks', bg: '#fef3ea' },
        { id: 'desserts', label: 'Desserts', bg: '#fef3ea' },
        { id: 'fries', label: 'Fries', bg: '#fef3ea' }
      );
    }

    return list;
  }, [menuItems]);

  const places = recommendedPlaces ?? [
    {
      id: 1,
      name: 'Sundown café',
      cuisine: 'Italian food',
      time: '60 min',
      rating: '4.9',
      bg: COLORS.placeBg1,
    },
    {
      id: 2,
      name: 'The cozy cup',
      cuisine: 'Breakfast, coffee',
      time: '35 min',
      rating: '4.7',
      bg: COLORS.placeBg2,
    },
    {
      id: 3,
      name: 'Burger Palace',
      cuisine: 'Burgers & Snacks',
      time: '20 min',
      rating: '4.8',
      bg: COLORS.placeBg1,
    },
  ];

  // Compute card width: 3 categories per row with padding and gaps
  const horizontalPadding = r(16) * 2;
  const categoryGaps = r(10) * 2;
  const categoryCardWidth = Math.floor((SCREEN_WIDTH - horizontalPadding - categoryGaps) / 3) - 2;

  // Compute food card width: 2 cards per row
  const foodGaps = r(12);
  const foodCardWidth = (SCREEN_WIDTH - horizontalPadding - foodGaps) / 2;

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: insets.bottom + r(40) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.locationRow}
            activeOpacity={0.8}
            onPress={() => setLocationState('requesting')}
          >
            <View style={styles.locAddrRow}>
              <Text style={styles.locationText} numberOfLines={1}>
                {detectedLocation?.address ?? 'Set Location'}
              </Text>
              <Text style={styles.locationChevron}>∨</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Category Grid – 3 per row (Shown only when not searching) ── */}
        {!searchQuery && (
          <>

            <View style={styles.categoryGrid}>
              {dynamicCategories.map((item) => (
                <CategoryCard
                  key={item.id}
                  item={item}
                  size={categoryCardWidth}
                  selected={activeCategory === item.id}
                  onPress={() => setActiveCategory((prev: any) => (prev === item.id ? '' : item.id))}
                />
              ))}
            </View>
          </>
        )}

        {/* ── Places Section (Shown only when not searching/filtering) ── */}
        {!searchQuery && !activeCategory && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Food</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.placesRow}
            >
              {places.map((place: any) => (
                <PlaceCard key={place.id} item={place} />
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Main Menu / Search Results Section ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery || activeCategory ? 'Search Results' : 'Main Menu'}
          </Text>
        </View>

        {/* Dynamic Vertical Grid – 1 row 2 column format displaying all items */}
        <View style={styles.foodGrid}>
          {filteredFoods.map((item: any) => (
            <FoodGridCard
              key={item.id}
              item={item}
              width={foodCardWidth}
              cartQty={getCartQty(item.id)}
              cartItem={cart.find((c: any) => c.id === item.id)}
              onAddToCart={handleAddToCart}
              onUpdateQty={handleUpdateQty}
              isLiked={liked[item.id]}
              onToggleLike={toggleLike}
              onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
            />
          ))}

          {filteredFoods.length === 0 && (
            <View style={styles.empty}>
              <Text style={[styles.emptyTxt, { fontFamily: 'Poppins_500Medium' }]}>
                {searchQuery || activeCategory ? 'No dishes match your search 🍽' : 'No dishes available 🍽'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingBottom: r(10),
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: r(16),
    paddingTop: r(4),
    paddingBottom: r(28),
    width: '100%',
  },
  locationRow: {
    flex: 1,
  },
  locAddrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  locationText: {
    fontSize: r(24),
    fontFamily: 'Lora_400Regular',
    color: '#1A1A1A',
    letterSpacing: -0.5,
    maxWidth: r(300),
  },
  locationChevron: {
    fontSize: r(20),
    color: '#1A1A1A',
    fontWeight: '400',
  },


  // Category Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: r(24),
    gap: r(2),
    marginBottom: r(8),
  },
  categoryCard: {
    borderRadius: r(4),
    overflow: 'hidden',
    padding: r(8),
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    borderColor: COLORS.orange,
  },
  specialCard: {
    justifyContent: 'space-between',
  },
  categoryImage: {
    position: 'absolute',
    bottom: -r(10),
    right: -r(10),
    width: r(85),
    height: r(85),
    resizeMode: 'contain',
  },
  categoryLabel: {
    fontSize: r(11),
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: r(15),
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: r(3),
    marginTop: r(4),
  },
  badge: {
    borderRadius: r(10),
    paddingHorizontal: r(5),
    paddingVertical: r(2),
  },
  badgeText: {
    fontSize: r(9),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: r(16),
    paddingTop: r(20),
    paddingBottom: r(12),
    gap: r(8),
  },
  sectionTitle: {
    fontSize: r(20),
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  bestPriceBadge: {
    backgroundColor: COLORS.green,
    borderRadius: r(12),
    width: r(20),
    height: r(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  bestPriceBadgeText: {
    color: '#FFFFFF',
    fontSize: r(11),
    fontWeight: '700',
  },

  // Places
  placesRow: {
    paddingLeft: r(16),
    paddingRight: r(8),
    gap: r(12),
  },
  placeCard: {
    width: r(160),
    backgroundColor: COLORS.card,
    borderRadius: r(16),
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#EFE6DC',
  },
  placeImageContainer: {
    width: '100%',
    height: r(100),
    backgroundColor: '#EEE',
  },
  placeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeInfo: {
    padding: r(8),
  },
  placeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: r(2),
  },
  placeName: {
    fontSize: r(13),
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: r(4),
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: r(2),
  },
  ratingStar: {
    fontSize: r(11),
    color: COLORS.star,
  },
  ratingText: {
    fontSize: r(11),
    fontWeight: '700',
    color: COLORS.text,
  },
  placeSub: {
    fontSize: r(10),
    color: COLORS.subText,
  },

  // Food Grid
  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: r(16),
    gap: r(12),
    marginBottom: r(8),
  },
  fcard: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
    marginBottom: r(12),
  },
  fcardImgBox: {
    width: '100%',
    aspectRatio: 1.05,
    backgroundColor: '#FFF4EE', // Warm elegant peachy cream matching user image
    borderRadius: r(16), // Rounded image container
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
  likeTxt: {
    fontSize: r(15),
  },
  fcardBody: {
    paddingTop: r(4),
    paddingHorizontal: 0,
  },
  fcardName: {
    fontSize: r(15),
    fontFamily: 'Lora_700Bold', // Premium serif font matching user image
    color: '#1A1A1A',
    marginTop: r(6),
    marginBottom: r(2),
  },
  fcardPrice: {
    fontSize: r(13),
    color: '#888888', // Muted gray color matching user image
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

  // Best Prices Horizontal Scroll Styles
  bestPricesContainer: {
    width: '100%',
    marginBottom: r(16),
  },
  bestPricesRow: {
    paddingLeft: r(16),
    paddingRight: r(8),
    gap: r(14),
  },
  bestPriceCardContainer: {
    width: r(140),
  },
  bestPriceCard: {
    width: r(140),
    height: r(140),
    borderRadius: r(16),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
    }),
  },
  bestPriceCardImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  bestPriceAddBtn: {
    position: 'absolute',
    top: r(8),
    right: r(8),
    width: r(28),
    height: r(28),
    borderRadius: r(14),
    backgroundColor: '#f49851', // Primary Orange
    justifyContent: 'center',
    alignItems: 'center',
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
  bestPriceAddBtnTxt: {
    color: '#FFFFFF',
    fontSize: r(18),
    fontWeight: '700',
    marginTop: -r(2),
  },
  bestPriceCardBody: {
    paddingTop: r(8),
    paddingHorizontal: r(2),
  },
  bestPriceCardName: {
    fontSize: r(14),
    fontFamily: 'Lora_700Bold',
    color: '#1A1A1A',
    marginBottom: r(2),
  },
  bestPriceCardPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: r(6),
  },
  bestPriceSlashedPrice: {
    fontSize: r(11),
    color: '#A0A0A0',
    textDecorationLine: 'line-through',
  },
  bestPriceOriginalPrice: {
    fontSize: r(14),
    fontWeight: '700',
    color: '#1A1A1A',
  },

  // Empty state
  empty: {
    flex: 1,
    paddingVertical: r(32),
    alignItems: 'center',
    width: '100%',
  },
  emptyTxt: {
    color: COLORS.subText,
    fontSize: r(13),
  },
});