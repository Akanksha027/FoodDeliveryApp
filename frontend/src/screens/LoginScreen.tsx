// src/screens/LoginScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  Platform,
  StatusBar,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useFonts, Poppins_900Black } from '@expo-google-fonts/poppins';
import { supabase } from '../lib/supabase';
import { storeSession } from '../utils/session';

WebBrowser.maybeCompleteAuthSession();

const ADMIN_EMAIL = 'akankshasingh0085@gmail.com';

const { width: SW } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const LAYOUT_MAX_W = 600;
const ACTUAL_LAYOUT_W = isWeb ? Math.min(SW, LAYOUT_MAX_W) : SW;

export const LoginScreen = ({ navigation }: any) => {
  const navigated = useRef(false); // prevent double navigation on re-render

  const [fontsLoaded] = useFonts({
    Poppins_900Black,
  });

  const handleUserRouting = async (user: any, accessToken: string) => {
    if (navigated.current) return; // guard against calling twice
    navigated.current = true;

    const role = user.email === ADMIN_EMAIL ? 'owner' : 'customer';
    await storeSession({ access_token: accessToken, role });
    navigation.replace(role === 'owner' ? 'OwnerDashboard' : 'CustomerDashboard');
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          await handleUserRouting(session.user, session.access_token);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    try {
      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
      } else {
        // Create an Expo deep link back to this screen
        const redirectUrl = Linking.createURL('login');
        console.log('[Auth] Generated native redirect URL:', redirectUrl);

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
          },
        });
        if (error) throw error;

        if (data?.url) {
          console.log('[Auth] Opening Supabase OAuth URL:', data.url);
          // Open the browser with the OAuth session
          const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
          console.log('[Auth] WebBrowser session result:', result);

          if (result.type === 'success' && result.url) {
            console.log('[Auth] Browser redirect captured URL:', result.url);

            // Extract the session details from the redirect URL (hash or query)
            let token = '';
            let refresh = '';

            // 1. Check hash fragment (standard Supabase redirect behavior)
            const hashIndex = result.url.indexOf('#');
            if (hashIndex !== -1) {
              const hash = result.url.substring(hashIndex + 1);
              const params = hash.split('&').reduce((acc: any, param) => {
                const [key, val] = param.split('=');
                if (key && val) {
                  acc[key] = decodeURIComponent(val);
                }
                return acc;
              }, {});
              token = params.access_token || '';
              refresh = params.refresh_token || '';
            }

            // 2. Check query params as fallback
            if (!token || !refresh) {
              const queryIndex = result.url.indexOf('?');
              if (queryIndex !== -1) {
                const query = result.url.substring(queryIndex + 1);
                const params = query.split('&').reduce((acc: any, param) => {
                  const [key, val] = param.split('=');
                  if (key && val) {
                    acc[key] = decodeURIComponent(val);
                  }
                  return acc;
                }, {});
                token = token || params.access_token || '';
                refresh = refresh || params.refresh_token || '';
              }
            }

            // 3. Fallback to standard Linking parse
            if (!token || !refresh) {
              const parsedUrl = Linking.parse(result.url);
              token = (parsedUrl.queryParams as any)?.access_token || '';
              refresh = (parsedUrl.queryParams as any)?.refresh_token || '';
            }

            if (token && refresh) {
              console.log('[Auth] Tokens resolved. Synchronizing Supabase session...');
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: token,
                refresh_token: refresh,
              });
              if (sessionError) throw sessionError;
              console.log('[Auth] Session successfully established on mobile.');
            } else {
              Alert.alert('Login Error', 'Failed to resolve login token from authentication provider.');
            }
          }
        }
      }
    } catch (e: any) {
      Alert.alert('Login error', e.message);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FF3D16', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#FF3D16" />
      <View style={[styles.container, isWeb && styles.webWrapper]}>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.welcomeTitle}>Welcome to</Text>
          <Text style={styles.welcomeTitleAccent}>Food Zone</Text>
        </View>

        {/* Big Burger Asset Image */}
        <View style={styles.burgerContainer}>
          <Image source={require('../../assets/homeBurger.png')} style={styles.burgerImage} />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.creamButton}
            onPress={handleGoogleLogin}
            activeOpacity={0.9}
          >
            <Ionicons name="logo-google" size={20} color="#1C1C2E" style={{ marginRight: 10 }} />
            <Text style={styles.creamButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineButton}
            onPress={handleGoogleLogin}
            activeOpacity={0.8}
          >
            <Feather name="truck" size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
            <Text style={styles.outlineButtonText}>Order Delivery</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Disclaimer */}
        <Text style={styles.disclaimer}>
          By tapping Continue with Google or Order Delivery, you agree to our{' '}
          <Text style={{ fontWeight: 'bold', textDecorationLine: 'underline' }}>Terms & Conditions</Text>{' '}
          and{' '}
          <Text style={{ fontWeight: 'bold', textDecorationLine: 'underline' }}>Privacy Policy</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FF3D16', // Bright red-orange background
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    backgroundColor: '#FF3D16',
  },
  webWrapper: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    height: '100%',
  },
  promoBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 8,
    transform: [{ rotate: '-1.5deg' }],
    borderTopLeftRadius: 14,
    borderBottomRightRadius: 16,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 14,
    alignSelf: 'center',
    marginTop: Platform.OS === 'ios' ? 10 : 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  promoBadgeText: {
    color: '#FF3D16',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 65,
  },
  welcomeTitle: {
    fontFamily: 'Poppins_900Black',
    fontSize: 42,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1.8,
    lineHeight: 48,
  },
  welcomeTitleAccent: {
    fontFamily: 'Poppins_900Black',
    fontSize: 44,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1.8,
    lineHeight: 48,
  },
  burgerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 14,
  },
  burgerImage: {
    width: ACTUAL_LAYOUT_W * 0.99,
    height: ACTUAL_LAYOUT_W * 0.99,
    resizeMode: 'contain',
  },
  actionContainer: {
    width: '100%',
    paddingHorizontal: 4,
  },
  creamButton: {
    backgroundColor: '#FFEAE3', // Cream / Light Pink
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 14,
  },
  creamButtonText: {
    color: '#1C1C2E',
    fontSize: 16,
    fontWeight: '800',
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  outlineButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  disclaimer: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
    marginBottom: Platform.OS === 'ios' ? 10 : 15,
  },
});