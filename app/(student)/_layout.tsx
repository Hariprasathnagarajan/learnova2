import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { colors } from '../../src/theme/colors';
import { useNotifications } from '../../src/queries/useNotifications';
import { useEffect } from 'react';
import { useNotificationStore } from '../../src/store/notificationStore';

export default function StudentLayout() {
  const { data: notifications } = useNotifications();
  const { unreadCount, setUnreadCount } = useNotificationStore();

  useEffect(() => {
    if (notifications) {
      setUnreadCount(notifications.filter(n => !n.isRead).length);
    }
  }, [notifications, setUnreadCount]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface.primary, borderTopColor: colors.border, borderTopWidth: 1, height: 80, paddingBottom: 16 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="my-courses" options={{ title: 'My Courses', tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="notifications" options={{
        title: 'Alerts',
        tabBarIcon: ({ color, size }) => (
          <View>
            <Ionicons name="notifications-outline" size={size} color={color} />
            {unreadCount > 0 && (
              <View style={{ position: 'absolute', top: -4, right: -6, backgroundColor: colors.error, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                <Text style={{ color: '#fff', fontSize: 9, fontFamily: 'PlusJakartaSans_700Bold' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </View>
        ),
      }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="course" options={{ href: null }} />
      <Tabs.Screen name="checkout" options={{ href: null }} />
    </Tabs>
  );
}
