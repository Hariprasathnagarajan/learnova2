import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { colors } from '../../src/theme/colors';
import { useEnrollments } from '../../src/queries/useEnrollments';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { data: enrollments } = useEnrollments();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { void logout(); } },
    ]);
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', onPress: () => {} },
    { icon: 'receipt-outline', label: 'Payment History', onPress: () => router.push('/(student)/course/pay-history') },
    { icon: 'notifications-outline', label: 'Notification Settings', onPress: () => {} },
    { icon: 'shield-outline', label: 'Privacy & Security', onPress: () => {} },
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => {} },
    { icon: 'information-circle-outline', label: 'About Learnova', onPress: () => {} },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.surface.primary, padding: 24, paddingTop: 60, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 32, color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' }}>{user?.firstName?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={{ fontSize: 20, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>{user?.firstName} {user?.lastName}</Text>
        <Text style={{ fontSize: 14, color: colors.text.muted, marginTop: 4 }}>{user?.email}</Text>
        <View style={{ backgroundColor: colors.primary + '22', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginTop: 10, borderWidth: 1, borderColor: colors.primary + '44' }}>
          <Text style={{ color: colors.primary, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', textTransform: 'capitalize' }}>{user?.role}</Text>
        </View>
        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 24, marginTop: 24 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 22, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>{enrollments?.length ?? 0}</Text>
            <Text style={{ fontSize: 12, color: colors.text.muted }}>Courses</Text>
          </View>
          <View style={{ width: 1, backgroundColor: colors.border }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 22, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
              {enrollments?.reduce((acc, e) => acc + e.progressPercent, 0) ?? 0}%
            </Text>
            <Text style={{ fontSize: 12, color: colors.text.muted }}>Total Progress</Text>
          </View>
        </View>
      </View>

      {/* Menu */}
      <View style={{ margin: 24, backgroundColor: colors.surface.secondary, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={item.label} onPress={item.onPress}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: index < menuItems.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface.elevated, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Ionicons name={item.icon as any} size={18} color={colors.text.secondary} />
            </View>
            <Text style={{ flex: 1, fontSize: 15, color: colors.text.primary, fontFamily: 'PlusJakartaSans_500Medium' }}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={handleLogout} style={{ marginHorizontal: 24, backgroundColor: colors.error + '18', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.error + '33' }}>
        <Text style={{ color: colors.error, fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
