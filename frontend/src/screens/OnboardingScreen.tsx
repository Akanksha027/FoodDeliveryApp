import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
  StatusBar,
  SafeAreaView,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const ORANGE = '#f49851';
const WHITE = '#ffffff';
const LIGHT_BG = '#fafaf8';
const DARK_TEXT = '#1a1a1a';
const GRAY_TEXT = '#888888';

// SVG-style illustrations using View components
const IllustrationOne = () => (
  <View style={styles.illustrationContainer}>
    {/* Plate / tray */}
    <View style={[styles.tray, { bottom: 30, left: width * 0.08 }]} />

    {/* Coffee cup */}
    <View style={styles.cupWrapper}>
      {/* Cup body */}
      <View style={styles.cupBody}>
        <View style={styles.cupBand} />
        {/* Cup lid */}
        <View style={styles.cupLid} />
      </View>
    </View>

    {/* Bowl with berries */}
    <View style={styles.bowlWrapper}>
      <View style={styles.bowl} />
      <View style={[styles.berry, { top: -6, left: 8 }]} />
      <View style={[styles.berry, { top: -10, left: 20 }]} />
      <View style={[styles.berry, { top: -6, left: 32 }]} />
    </View>

    {/* Cake slice */}
    <View style={styles.cakeSliceWrapper}>
      <View style={styles.cakeBase} />
      <View style={styles.cakeFrosting} />
    </View>
  </View>
);

const IllustrationTwo = () => (
  <View style={styles.illustrationContainer}>
    {/* Big center cup */}
    <View style={[styles.bigCupWrapper, { alignSelf: 'center', marginTop: 20 }]}>
      <View style={styles.bigCupLid} />
      <View style={styles.bigCupBody}>
        <View style={styles.bigCupBand} />
      </View>
    </View>

    {/* Milk bottle top-left */}
    <View style={[styles.milkBottle, { position: 'absolute', top: 10, left: width * 0.05 }]} />

    {/* Sugar cubes top-right */}
    <View style={[styles.sugarCube, { position: 'absolute', top: 20, right: width * 0.08 }]} />
    <View style={[styles.sugarCube, { position: 'absolute', top: 40, right: width * 0.14 }]} />

    {/* Cinnamon sticks bottom-left */}
    <View style={[styles.cinnamonStick, { position: 'absolute', bottom: 30, left: width * 0.06, transform: [{ rotate: '-30deg' }] }]} />
    <View style={[styles.cinnamonStick, { position: 'absolute', bottom: 38, left: width * 0.11, transform: [{ rotate: '-20deg' }] }]} />

    {/* Cream swirl bottom-right */}
    <View style={[styles.creamBlob, { position: 'absolute', bottom: 25, right: width * 0.08 }]} />
  </View>
);

const IllustrationThree = () => (
  <View style={styles.illustrationContainer}>
    {/* Paper bag */}
    <View style={styles.paperBagWrapper}>
      <View style={styles.paperBag} />
      <View style={styles.paperBagFold} />
    </View>

    {/* Cup beside bag */}
    <View style={[styles.smallCupWrapper, { position: 'absolute', right: width * 0.12, bottom: 20 }]}>
      <View style={styles.smallCupLid} />
      <View style={styles.smallCupBody}>
        <View style={styles.smallCupBand} />
      </View>
    </View>

    {/* Location pin */}
    <View style={styles.locationPinWrapper}>
      <View style={styles.locationPin} />
      <View style={styles.locationPinCircle} />
    </View>
  </View>
);

const slides = [
  {
    id: '1',
    title: 'A whole world of flavour.',
    description: "From coffee to cake, discover what's ",
    highlight: 'good nearby.',
    Illustration: IllustrationOne,
  },
  {
    id: '2',
    title: 'Make every order yours.',
    description: 'Size, milk, sweetness — pick exactly how ',
    highlight: 'you like it.',
    Illustration: IllustrationTwo,
  },
  {
    id: '3',
    title: 'Fresh, fast, tracked.',
    description: 'Average delivery in ',
    highlight: '10 minutes',
    descriptionEnd: ' — watch it on the way.',
    Illustration: IllustrationThree,
  },
];

export const OnboardingScreen = ({ navigation }: any) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      // Navigate to main customer dashboard and clear navigation history
      navigation?.replace?.('CustomerDashboard');
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1 });
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSkip = () => {
    navigation?.replace?.('CustomerDashboard');
  };

  const renderSlide = ({ item }: any) => {
    const { title, description, highlight, descriptionEnd, Illustration } = item;
    return (
      <View style={styles.slide}>
        {/* Illustration area */}
        <View style={styles.illustrationArea}>
          <Illustration />
        </View>

        {/* Text area */}
        <View style={styles.textArea}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>
            {description}
            <Text style={styles.highlight}>{highlight}</Text>
            {descriptionEnd || ''}
          </Text>
        </View>
      </View>
    );
  };

  // Dot indicators
  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === currentIndex ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={LIGHT_BG} />

      {/* Header */}
      <View style={styles.header}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoIcon} />
          <Text style={styles.logoText}>Crema</Text>
        </View>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item: any) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
      />

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        {/* Back arrow (hidden on first slide) */}
        <View style={styles.backContainer}>
          {currentIndex > 0 && (
            <TouchableOpacity onPress={goToPrev} style={styles.backButton}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dots */}
        {renderDots()}

        {/* Next button */}
        <TouchableOpacity onPress={goToNext} style={styles.nextButton}>
          <Text style={styles.nextText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: LIGHT_BG,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ORANGE,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK_TEXT,
    letterSpacing: 0.3,
  },
  skipText: {
    fontSize: 15,
    color: GRAY_TEXT,
    fontWeight: '400',
  },

  // Slide
  slide: {
    width,
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 10,
  },

  // Illustration
  illustrationArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationContainer: {
    width: width - 56,
    height: height * 0.38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // Text
  textArea: {
    paddingBottom: 10,
    paddingTop: 16,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: DARK_TEXT,
    lineHeight: 38,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: GRAY_TEXT,
    lineHeight: 24,
    fontWeight: '400',
  },
  highlight: {
    color: ORANGE,
    fontWeight: '600',
  },

  // Bottom nav
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  backContainer: {
    width: 44,
  },
  backButton: {
    padding: 4,
  },
  backArrow: {
    fontSize: 20,
    color: DARK_TEXT,
    fontWeight: '400',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    borderRadius: 4,
    height: 8,
  },
  dotActive: {
    width: 24,
    backgroundColor: ORANGE,
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#ddd',
  },
  nextButton: {
    backgroundColor: ORANGE,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 30,
  },
  nextText: {
    color: WHITE,
    fontWeight: '600',
    fontSize: 15,
  },

  // ---- Illustration components ----

  // Slide 1
  tray: {
    position: 'absolute',
    width: 200,
    height: 18,
    backgroundColor: '#e8e4de',
    borderRadius: 10,
    bottom: 24,
  },
  cupWrapper: {
    position: 'absolute',
    left: width * 0.04,
    bottom: 28,
    alignItems: 'center',
  },
  cupLid: {
    width: 68,
    height: 16,
    backgroundColor: '#f0ece6',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginBottom: -2,
    zIndex: 2,
  },
  cupBody: {
    width: 64,
    height: 90,
    backgroundColor: '#f0ece6',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
  },
  cupBand: {
    width: '100%',
    height: 28,
    backgroundColor: ORANGE,
    marginTop: 28,
  },
  bowlWrapper: {
    position: 'absolute',
    right: width * 0.04,
    bottom: 30,
    alignItems: 'center',
  },
  bowl: {
    width: 70,
    height: 38,
    backgroundColor: '#f0ece6',
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  berry: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#c0392b',
  },
  cakeSliceWrapper: {
    position: 'absolute',
    bottom: 28,
    left: '38%',
    alignItems: 'center',
  },
  cakeBase: {
    width: 60,
    height: 55,
    backgroundColor: '#6b3a2a',
    borderRadius: 6,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  cakeFrosting: {
    position: 'absolute',
    top: 0,
    width: 60,
    height: 14,
    backgroundColor: '#f0ece6',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  // Slide 2
  bigCupWrapper: {
    alignItems: 'center',
    marginTop: 30,
  },
  bigCupLid: {
    width: 90,
    height: 20,
    backgroundColor: '#f0ece6',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    zIndex: 2,
  },
  bigCupBody: {
    width: 85,
    height: 115,
    backgroundColor: '#f0ece6',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
  },
  bigCupBand: {
    width: '100%',
    height: 36,
    backgroundColor: ORANGE,
    marginTop: 34,
  },
  milkBottle: {
    width: 36,
    height: 70,
    backgroundColor: '#f0ece6',
    borderRadius: 18,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  sugarCube: {
    width: 22,
    height: 22,
    backgroundColor: '#f0ece6',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cinnamonStick: {
    width: 8,
    height: 55,
    backgroundColor: '#8b5e3c',
    borderRadius: 4,
  },
  creamBlob: {
    width: 48,
    height: 40,
    backgroundColor: '#f0ece6',
    borderRadius: 24,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },

  // Slide 3
  paperBagWrapper: {
    position: 'absolute',
    left: width * 0.1,
    bottom: 20,
    alignItems: 'center',
  },
  paperBag: {
    width: 85,
    height: 110,
    backgroundColor: '#c8b49a',
    borderRadius: 8,
  },
  paperBagFold: {
    position: 'absolute',
    top: 0,
    width: 85,
    height: 20,
    backgroundColor: '#b5a08a',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  smallCupWrapper: {
    alignItems: 'center',
  },
  smallCupLid: {
    width: 62,
    height: 15,
    backgroundColor: '#f0ece6',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  smallCupBody: {
    width: 58,
    height: 80,
    backgroundColor: '#f0ece6',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
  },
  smallCupBand: {
    width: '100%',
    height: 24,
    backgroundColor: ORANGE,
    marginTop: 24,
  },
  locationPinWrapper: {
    position: 'absolute',
    top: 0,
    right: width * 0.14,
    alignItems: 'center',
  },
  locationPin: {
    width: 28,
    height: 36,
    backgroundColor: ORANGE,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 0,
    transform: [{ rotate: '45deg' }, { translateY: 4 }],
  },
  locationPinCircle: {
    position: 'absolute',
    top: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: WHITE,
  },
});
