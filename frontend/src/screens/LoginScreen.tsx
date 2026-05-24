// src/screens/LoginScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, Button, StyleSheet, Text, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { storeSession } from '../utils/session';

const ADMIN_EMAIL = 'akankshasingh0085@gmail.com';

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
    // onAuthStateChange handles both:
    // - INITIAL_SESSION: when Google redirects back and there's a token in the URL hash
    // - SIGNED_IN: when a fresh sign-in happens
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
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
