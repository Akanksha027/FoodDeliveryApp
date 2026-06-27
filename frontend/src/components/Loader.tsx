import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Easing,
  Platform,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

interface LoaderProps {
  size?: 'large' | 'small';
  fullScreen?: boolean;
  text?: string;
  color?: string;
  backgroundColor?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'large',
  fullScreen = false,
  text,
  color = '#FF3D16', // Default brand color
  backgroundColor = '#FFFFFF',
}) => {
  const bounceVal = useRef(new Animated.Value(0)).current;
  const spinVal = useRef(new Animated.Value(0)).current;
  const slideVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (size === 'small') return;

    // 1. Truck bounce animation (motion) - loops every 1s
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceVal, {
          toValue: 3,
          duration: 500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(bounceVal, {
          toValue: 0,
          duration: 500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 2. Tire spin animation - infinite rotation
    Animated.loop(
      Animated.timing(spinVal, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 3. Road dashes and lamp post translation (moves from right to left)
    Animated.loop(
      Animated.timing(slideVal, {
        toValue: -350,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [size]);

  // If small, fallback to a standard clean ActivityIndicator (ideal for inside buttons/inline text)
  if (size === 'small') {
    return <ActivityIndicator size="small" color={color} />;
  }

  // Tire rotation interpolation
  const spinRotation = spinVal.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderTruckAnimation = () => {
    return (
      <View style={styles.truckWrapper}>
        {/* Lamp Post - Translates from right to left */}
        <Animated.View
          style={[
            styles.lampPostContainer,
            {
              transform: [{ translateX: slideVal }],
            },
          ]}
        >
          <Svg viewBox="0 0 453.459 453.459" fill="#282828" style={styles.lampPostSvg}>
            <Path d="M252.882,0c-37.781,0-68.686,29.953-70.245,67.358h-6.917v8.954c-26.109,2.163-45.463,10.011-45.463,19.366h9.993c-1.65,5.146-2.507,10.54-2.507,16.017c0,28.956,23.558,52.514,52.514,52.514c28.956,0,52.514-23.558,52.514-52.514c0-5.478-0.856-10.872-2.506-16.017h9.992c0-9.354-19.352-17.204-45.463-19.366v-8.954h-6.149C200.189,38.779,223.924,16,252.882,16c29.952,0,54.32,24.368,54.32,54.32c0,28.774-11.078,37.009-25.105,47.437c-17.444,12.968-37.216,27.667-37.216,78.884v113.914h-0.797c-5.068,0-9.174,4.108-9.174,9.177c0,2.844,1.293,5.383,3.321,7.066c-3.432,27.933-26.851,95.744-8.226,115.459v11.202h45.75v-11.202c18.625-19.715-4.794-87.527-8.227-115.459c2.029-1.683,3.322-4.223,3.322-7.066c0-5.068-4.107-9.177-9.176-9.177h-0.795V196.641c0-43.174,14.942-54.283,30.762-66.043c14.793-10.997,31.559-23.461,31.559-60.277C323.202,31.545,291.656,0,252.882,0z M232.77,111.694c0,23.442-19.071,42.514-42.514,42.514c-23.442,0-42.514-19.072-42.514-42.514c0-5.531,1.078-10.957,3.141-16.017h78.747C231.693,100.736,232.77,106.162,232.77,111.694z" />
          </Svg>
        </Animated.View>

        {/* Truck Upper Body & Wheels Container - Bounces up and down */}
        <Animated.View
          style={[
            styles.truckContainer,
            {
              transform: [{ translateY: bounceVal }],
            },
          ]}
        >
          {/* Main Truck Body SVG */}
          <Svg viewBox="0 0 198 93" style={styles.truckBodySvg}>
            {/* Cabin Body */}
            <Path
              strokeWidth={3}
              stroke="#282828"
              fill={color}
              d="M135 22.5H177.264C178.295 22.5 179.22 23.133 179.594 24.0939L192.33 56.8443C192.442 57.1332 192.5 57.4404 192.5 57.7504V89C192.5 90.3807 191.381 91.5 190 91.5H135C133.619 91.5 132.5 90.3807 132.5 89V25C132.5 23.6193 133.619 22.5 135 22.5Z"
            />
            {/* Cabin Window */}
            <Path
              strokeWidth={3}
              stroke="#282828"
              fill="#7D7C7C"
              d="M146 33.5H181.741C182.779 33.5 183.709 34.1415 184.078 35.112L190.538 52.112C191.16 53.748 189.951 55.5 188.201 55.5H146C144.619 55.5 143.5 54.3807 143.5 53V36C143.5 34.6193 144.619 33.5 146 33.5Z"
            />
            {/* Door Handle */}
            <Path
              strokeWidth={2}
              stroke="#282828"
              fill="#282828"
              d="M150 65C150 65.39 149.763 65.8656 149.127 66.2893C148.499 66.7083 147.573 67 146.5 67C145.427 67 144.501 66.7083 143.873 66.2893C143.237 65.8656 143 65.39 143 65C143 64.61 143.237 64.1344 143.873 63.7107C144.501 63.2917 145.427 63 146.5 63C147.573 63 148.499 63.2917 149.127 63.7107C149.763 64.1344 150 64.61 150 65Z"
            />
            {/* Front Headlight (Yellow) */}
            <Rect
              strokeWidth={2}
              stroke="#282828"
              fill="#FFFCAB"
              rx={1}
              height={7}
              width={5}
              y={63}
              x={187}
            />
            {/* Front Bumper */}
            <Rect
              strokeWidth={2}
              stroke="#282828"
              fill="#282828"
              rx={1}
              height={11}
              width={4}
              y={81}
              x={193}
            />
            {/* Cargo Box */}
            <Rect
              strokeWidth={3}
              stroke="#282828"
              fill="#DFDFDF"
              rx="2.5"
              height={90}
              width={121}
              y="1.5"
              x="6.5"
            />
            {/* Tail Light */}
            <Rect
              strokeWidth={2}
              stroke="#282828"
              fill="#282828"
              rx={2}
              height={4}
              width={6}
              y={84}
              x={1}
            />
          </Svg>

          {/* Absolute wheels inside the truck bounce container */}
          {/* Left Tire */}
          <Animated.View
            style={[
              styles.tireContainer,
              { left: 32, transform: [{ rotate: spinRotation }] },
            ]}
          >
            <Svg viewBox="0 0 30 30" style={styles.tireSvg}>
              <Circle strokeWidth={3} stroke="#282828" fill="#282828" r="13.5" cy={15} cx={15} />
              <Circle fill="#DFDFDF" r={7} cy={15} cx={15} />
            </Svg>
          </Animated.View>

          {/* Right Tire */}
          <Animated.View
            style={[
              styles.tireContainer,
              { left: 137, transform: [{ rotate: spinRotation }] },
            ]}
          >
            <Svg viewBox="0 0 30 30" style={styles.tireSvg}>
              <Circle strokeWidth={3} stroke="#282828" fill="#282828" r="13.5" cy={15} cx={15} />
              <Circle fill="#DFDFDF" r={7} cy={15} cx={15} />
            </Svg>
          </Animated.View>
        </Animated.View>

        {/* Static Base Road Line */}
        <View style={styles.road} />

        {/* Animated Road Dashes - Translates from right to left */}
        <Animated.View
          style={[
            styles.roadDashesContainer,
            {
              transform: [{ translateX: slideVal }],
            },
          ]}
        >
          {/* Dash 1 */}
          <View style={[styles.roadDash, { width: 25, left: 300 }]} />
          {/* Dash 2 */}
          <View style={[styles.roadDash, { width: 15, left: 450 }]} />
          {/* Dash 3 */}
          <View style={[styles.roadDash, { width: 35, left: 600 }]} />
        </Animated.View>
      </View>
    );
  };

  const content = (
    <View style={styles.container}>
      {renderTruckAnimation()}
      {text ? (
        <Text style={[styles.text, { fontFamily: 'Poppins_500Medium' }]}>
          {text}
        </Text>
      ) : null}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor }]}>
        {content}
      </View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  truckWrapper: {
    width: 200,
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  truckContainer: {
    width: 175,
    height: 85,
    position: 'absolute',
    bottom: 6,
    zIndex: 2,
  },
  truckBodySvg: {
    width: 175,
    height: 82,
  },
  tireContainer: {
    position: 'absolute',
    bottom: -4,
    width: 23,
    height: 23,
    zIndex: 3,
  },
  tireSvg: {
    width: 23,
    height: 23,
  },
  road: {
    width: '100%',
    height: 2,
    backgroundColor: '#282828',
    position: 'absolute',
    bottom: 6,
    borderRadius: 1,
    zIndex: 1,
  },
  roadDashesContainer: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    width: 700, // Long width to support loop transitions
    height: 2,
    zIndex: 1,
  },
  roadDash: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#282828',
    borderRadius: 1,
  },
  lampPostContainer: {
    position: 'absolute',
    bottom: 6,
    left: 200, // Starts offscreen
    width: 30,
    height: 75,
    zIndex: 0,
  },
  lampPostSvg: {
    width: 30,
    height: 75,
    opacity: 0.35,
  },
  text: {
    marginTop: 18,
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },
});
