// src/screens/LoginScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, Button, StyleSheet, Text, Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { storeSession } from '../utils/session';

WebBrowser.maybeCompleteAuthSession();

const ADMIN_EMAIL = 'admin_override@gmail.com'; // Changed so your real email acts as a Customer!

export const LoginScreen = ({ navigation }: any) => {
  const navigated = useRef(false); // prevent double navigation on re-render

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
          // Open the browser with the OAuth session
          const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍔 Food Delivery</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      <View style={styles.buttonContainer}>
        <Button title="   Sign in with Google   " onPress={handleGoogleLogin} color="#4285F4" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 50 },
  buttonContainer: { width: '80%', maxWidth: 300 },
});