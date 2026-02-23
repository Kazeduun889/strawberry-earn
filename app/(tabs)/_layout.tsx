import { Tabs } from 'expo-router';
import { Home, Wallet, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#007AFF',
      headerShown: false,
      tabBarStyle: { position: 'absolute', bottom: 0, left: 0, right: 0, elevation: 0, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e0e0e0' }
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Заработок',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Кошелек',
          tabBarIcon: ({ color }) => <Wallet size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
