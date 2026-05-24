// App.tsx
import 'react-native-gesture-handler';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from './src/screens/LoginScreen';
import { OwnerDashboard } from './src/screens/OwnerDashboard';
import { CustomerDashboard } from './src/screens/CustomerDashboard';
import { ItemDetailScreen } from './src/screens/ItemDetailScreen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';

export type RootStackParamList = {
  Login: undefined;
  OwnerDashboard: undefined;
  CustomerDashboard: undefined;
  ItemDetail: { itemId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} />
        <Stack.Screen name="CustomerDashboard" component={CustomerDashboard} />
        <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({});
