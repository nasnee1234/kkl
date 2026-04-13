import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import FoodMenu from './screens/FoodMenu';
import QueueRequest from './screens/QueueRequest';
import MyProfile from './screens/MyProfile';
import AdminLogin from './backend/admin/AdminLogin';
import MenuManagement from './backend/admin/MenuManagement';
import SalesSummary from './backend/admin/SalesSummary';
import QueueManagement from './backend/admin/QueueManagement';
import { QueueProvider } from './contexts/QueueContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            'เมนู': focused ? 'restaurant' : 'restaurant-outline',
            'รับคิว': focused ? 'time' : 'time-outline',
            'โปรไฟล์': focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#b45309',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#f3f4f6', height: 60 },
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#1f2937',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="เมนู" component={FoodMenu} />
      <Tab.Screen name="รับคิว" component={QueueRequest} />
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

export default function App() {
  return (
    <QueueProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
          <Stack.Screen name="AdminLogin" component={AdminLogin} options={{ headerShown: true, title: 'เข้าสู่ระบบผู้ดูแล', headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#1f2937' }} />
          <Stack.Screen name="AdminTabs" component={AdminTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueueProvider>
  );
}
