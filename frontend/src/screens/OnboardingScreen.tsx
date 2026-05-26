import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
  SafeAreaView,
  FlatList,
  Animated,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const ORANGE = '#ffd7ba';
const WHITE = '#ffffff';
const DARK_BG = '#F49851';

const slides = [
  {
    id: '1',
    image: require('../../assets/homeBurger.png'),
    title: 'Order great food\nnear you with Foodly !',
    subtitle: 'Fast, fresh meals delivered to you',
    buttonText: 'Get Started',
  },
  {
    id: '2',
    image: require('../../assets/CHEF.png'),
    title: 'Choose from hundreds\nof delicious meals !',
    subtitle: 'Browse menus from top local restaurants',
    buttonText: 'Next',
  },
  {
    id: '3',
    image: require('../../assets/fries.png'),
    title: 'Fast delivery right\nto your door !',
    subtitle: 'Track your order in real time, every step',
    buttonText: "Let's Go",
  },
];

export const OnboardingScreen = ({ navigation }: any) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const animateProgress = (index: number) => {
    Animated.timing(progressAnim, {
      toValue: (index + 1) / slides.length,
      duration: 350,
      useNativeDriver: false,
    }).start();
  };

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      const next = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
      animateProgress(next);
    } else {
      navigation?.replace?.('CustomerDashboard');
    }
  };

  const handleSkip = () => {
    navigation?.replace?.('CustomerDashboard');
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const renderSlide = ({ item }: any) => (
    <View style={styles.slide}>
      {/* Centered smaller dish image */}
      <Image
        source={item.image}
        style={styles.heroImage}
        resizeMode="contain"
      />

      {/* Dark gradient overlay at bottom */}
      <View style={styles.overlay} />

      {/* Bottom content */}
      <View style={styles.bottomContent}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>

        <TouchableOpacity style={styles.button} onPress={goToNext} activeOpacity={0.85}>
          <Text style={styles.buttonText}>{item.buttonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} translucent />

      {/* Top bar: progress + skip */}
      <SafeAreaView style={styles.topBar}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 20,
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ORANGE,
    borderRadius: 2,
  },
  skipBtn: {
    paddingVertical: 4,
    paddingLeft: 8,
  },
  skipText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // Slide
  slide: {
    width,
    height,
  },
  heroImage: {
    width: width * 0.99,
    height: width * 0.99,
    alignSelf: 'center',
    marginTop: height * 0.16,
  },

  // Dark overlay — fades from transparent (top) to dark (bottom)
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.14,
    backgroundColor: 'transparent',
  },

  // Bottom text + button
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: 48,
    backgroundColor: DARK_BG,
    paddingTop: 32,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: WHITE,
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    backgroundColor: ORANGE,
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default OnboardingScreen;
