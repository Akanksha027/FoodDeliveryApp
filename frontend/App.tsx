// App.tsx
import 'react-native-gesture-handler';

import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from './src/screens/LoginScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { OwnerDashboard } from './src/screens/OwnerDashboard';
import { CustomerDashboard } from './src/screens/CustomerDashboard';
import { ItemDetailScreen } from './src/screens/ItemDetailScreen';
import { OrdersHistoryScreen } from './src/screens/OrdersHistoryScreen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import {
  useFonts,
  Poppins_100Thin,
  Poppins_200ExtraLight,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';
import {
  Lora_400Regular,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
} from '@expo-google-fonts/lora';
import { bootstrapFonts } from './src/utils/bootstrapFonts';
import { Loader } from './src/components/Loader';

// Execute the font monkeypatching immediately on startup
bootstrapFonts();

export type RootStackParamList = {
  Login: undefined;
  Onboarding: undefined;
  OwnerDashboard: undefined;
  CustomerDashboard: undefined;
  ItemDetail: { itemId: string };
  OrdersHistory: { userId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_100Thin,
    Poppins_200ExtraLight,
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <Loader
        fullScreen={true}
        text="Loading delicious sandwiches..."
        backgroundColor="#FF3D16"
        color="#FFFFFF"
      />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} />
        <Stack.Screen name="CustomerDashboard" component={CustomerDashboard} />
        <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
        <Stack.Screen name="OrdersHistory" component={OrdersHistoryScreen} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FF3D16', // Matches brand color
    justifyContent: 'center',
    alignItems: 'center',
  },
});
