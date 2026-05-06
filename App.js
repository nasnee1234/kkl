import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';

import FoodMenu from './screens/FoodMenu';
import QueueRequest from './screens/QueueRequest';
import MyProfile from './screens/MyProfile';
import AdminLogin from './backend/admin/AdminLogin';
import MenuManagement from './backend/admin/MenuManagement';
import SalesSummary from './backend/admin/SalesSummary';
import QueueManagement from './backend/admin/QueueManagement';
import { QueueProvider } from './contexts/QueueContext';
import { auth } from './firebase';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            'รายการ': focused ? 'document-text' : 'document-text-outline',
            'คิว': focused ? 'sync-circle' : 'sync-circle-outline',
            'โปรไฟล์': focused ? 'person-circle' : 'person-circle-outline',
          };
          return <Ionicons name={icons[route.name]} size={26} color={color} />;
        },
        tabBarActiveTintColor: '#111111',
        tabBarInactiveTintColor: '#7d7d7d',
        tabBarLabelStyle: {
          fontSize: 12,
          lineHeight: 16,
          marginTop: 0,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 10,
          right: 10,
          bottom: 0,
          height: 76,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          elevation: 16,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
      })}
    >
      <Tab.Screen name="รายการ" component={FoodMenu} />
      <Tab.Screen name="คิว" component={QueueRequest} />
      <Tab.Screen name="โปรไฟล์" component={MyProfile} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            'เมนูอาหาร': focused ? 'fast-food' : 'fast-food-outline',
            'ยอดขาย': focused ? 'bar-chart' : 'bar-chart-outline',
            'จัดการคิว': focused ? 'list' : 'list-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1d4ed8',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#f3f4f6', height: 60 },
        headerStyle: { backgroundColor: '#1d4ed8' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="เมนูอาหาร" component={MenuManagement} options={{ title: 'จัดการเมนู' }} />
      <Tab.Screen name="ยอดขาย" component={SalesSummary} options={{ title: 'สรุปยอดขาย' }} />
      <Tab.Screen name="จัดการคิว" component={QueueManagement} options={{ title: 'ระบบคิว' }} />
    </Tab.Navigator>
  );
}

function AdminGuard({ navigation }) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const isSignedIn = Boolean(user);
      setAllowed(isSignedIn);
      setChecking(false);

      if (!isSignedIn) {
        navigation.replace('AdminLogin');
      }
    });

    return unsub;
  }, [navigation]);

  if (checking) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8faff' }}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return allowed ? <AdminTabs /> : null;
}

export default function App() {
  return (
    <QueueProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
          <Stack.Screen
            name="AdminLogin"
            component={AdminLogin}
            options={{
              headerShown: true,
              title: 'เข้าสู่ระบบผู้ดูแล',
              headerStyle: { backgroundColor: '#fff' },
              headerTintColor: '#1f2937',
            }}
          />
          <Stack.Screen name="AdminTabs" component={AdminGuard} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueueProvider>
  );
}
