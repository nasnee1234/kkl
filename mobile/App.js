import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Caprasimo_400Regular } from '@expo-google-fonts/caprasimo';
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
  Figtree_900Black,
} from '@expo-google-fonts/figtree';

SplashScreen.preventAutoHideAsync().catch(() => {});

import Home from './src/screens/Home';
import FoodMenu from './src/screens/FoodMenu';
import QueueRequest from './src/screens/QueueRequest';
import Notifications from './src/screens/Notifications';
import MyProfile from './src/screens/MyProfile';
import AdminLogin from './src/screens/admin/AdminLogin';
import MenuManagement from './src/screens/admin/MenuManagement';
import SalesSummary from './src/screens/admin/SalesSummary';
import QueueManagement from './src/screens/admin/QueueManagement';
import ConfirmDialog from './src/components/ConfirmDialog';
import { QueueProvider, useQueue } from './src/contexts/QueueContext';
import { auth } from './src/config/firebase';
import { colors, adminTheme, APP_MAX_WIDTH } from './src/theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CustomerTabs() {
  const { notifications } = useQueue();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            'หน้าแรก': focused ? 'home' : 'home-outline',
            'เมนู': focused ? 'fast-food' : 'fast-food-outline',
            'คิวของฉัน': focused ? 'sync-circle' : 'sync-circle-outline',
            'แจ้งเตือน': focused ? 'notifications' : 'notifications-outline',
            'ฉัน': focused ? 'person-circle' : 'person-circle-outline',
          };
          return (
            <View
              style={{
                width: 42,
                height: 30,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? colors.creamSoft : 'transparent',
              }}
            >
              <Ionicons name={icons[route.name]} size={22} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          lineHeight: 14,
          marginTop: 2,
          fontWeight: '700',
        },
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 10,
          height: 72,
          paddingTop: 7,
          paddingBottom: 9,
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          borderRadius: 20,
          elevation: 16,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
        },
      })}
    >
      <Tab.Screen name="หน้าแรก" component={Home} />
      <Tab.Screen name="เมนู" component={FoodMenu} />
      <Tab.Screen name="คิวของฉัน" component={QueueRequest} />
      <Tab.Screen
        name="แจ้งเตือน"
        component={Notifications}
        options={{ tabBarBadge: unreadCount > 0 ? unreadCount : undefined }}
      />
      <Tab.Screen name="ฉัน" component={MyProfile} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  return (
    <>
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
          tabBarActiveTintColor: adminTheme.cta,
          tabBarInactiveTintColor: adminTheme.textMuted,
          tabBarStyle: { backgroundColor: adminTheme.surface, borderTopColor: adminTheme.border, height: 60 },
          headerStyle: { backgroundColor: adminTheme.bg },
          headerTintColor: adminTheme.text,
          headerTitleStyle: { fontWeight: 'bold' },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setLogoutConfirmVisible(true)}
              style={{ marginRight: 16 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="log-out-outline" size={24} color={adminTheme.text} />
            </TouchableOpacity>
          ),
        })}
      >
        <Tab.Screen name="เมนูอาหาร" component={MenuManagement} options={{ title: 'จัดการเมนู' }} />
        <Tab.Screen name="ยอดขาย" component={SalesSummary} options={{ title: 'สรุปยอดขาย' }} />
        <Tab.Screen name="จัดการคิว" component={QueueManagement} options={{ title: 'ระบบคิว' }} />
      </Tab.Navigator>

      <ConfirmDialog
        visible={logoutConfirmVisible}
        icon="log-out-outline"
        title="ออกจากระบบ?"
        message="คุณต้องการออกจากระบบผู้ดูแลใช่หรือไม่"
        confirmLabel="ออกจากระบบ"
        onCancel={() => setLogoutConfirmVisible(false)}
        onConfirm={() => {
          setLogoutConfirmVisible(false);
          signOut(auth);
        }}
      />
    </>
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: adminTheme.bg }}>
        <ActivityIndicator size="large" color={adminTheme.accent} />
      </View>
    );
  }

  return allowed ? <AdminTabs /> : null;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Caprasimo_400Regular,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
    Figtree_900Black,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.appOuter} onLayout={onLayoutRootView}>
      <View style={styles.appFrame}>
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
                  headerStyle: { backgroundColor: adminTheme.bg },
                  headerTintColor: adminTheme.text,
                }}
              />
              <Stack.Screen name="AdminTabs" component={AdminGuard} />
            </Stack.Navigator>
          </NavigationContainer>
        </QueueProvider>
      </View>
    </View>
  );
}

const styles = {
  // จอกว้างเกิน APP_MAX_WIDTH (คอม/แท็บเล็ต) จะเห็นแอปเป็นคอลัมน์กลางจอแทนยืดเต็มความกว้าง
  appOuter: {
    flex: 1,
    ...Platform.select({
      web: { backgroundColor: '#e7e0d4', alignItems: 'center' },
      default: {},
    }),
  },
  appFrame: {
    flex: 1,
    width: '100%',
    ...Platform.select({
      web: { maxWidth: APP_MAX_WIDTH, position: 'relative', overflow: 'hidden' },
      default: {},
    }),
  },
};
