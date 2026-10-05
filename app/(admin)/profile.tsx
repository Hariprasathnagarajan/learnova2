import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { colors } from '../../src/theme/colors';

export default function AdminProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Sign out of Administrator console?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => { void logout(); },
      },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ backgroundColor: colors.surface.primary, padding: 24, paddingTop: 60, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Ionicons name="shield-checkmark" size={38} color="#080B14" />
        </View>
        <Text style={{ fontSize: 20, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={{ fontSize: 14, color: colors.text.muted, marginTop: 4 }}>{user?.email}</Text>
        <View style={{ backgroundColor: colors.accent + '22', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginTop: 10, borderWidth: 1, borderColor: colors.accent + '55' }}>
          <Text style={{ color: colors.accent, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }}>
            SUPER ADMIN
          </Text>
        </View>
      </View>

      <View style={{ margin: 24, backgroundColor: colors.surface.secondary, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
        <TouchableOpacity
          onPress={() => router.push('/(admin)/dashboard')}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
        >
          <Ionicons name="speedometer-outline" size={20} color={colors.text.secondary} style={{ marginRight: 14 }} />
          <Text style={{ flex: 1, fontSize: 15, color: colors.text.primary, fontFamily: 'PlusJakartaSans_500Medium' }}>Platform Health & Analytics</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(admin)/courses')}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
        >
          <Ionicons name="school-outline" size={20} color={colors.text.secondary} style={{ marginRight: 14 }} />
          <Text style={{ flex: 1, fontSize: 15, color: colors.text.primary, fontFamily: 'PlusJakartaSans_500Medium' }}>Course Catalog</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(admin)/users')}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
        >
          <Ionicons name="people-outline" size={20} color={colors.text.secondary} style={{ marginRight: 14 }} />
          <Text style={{ flex: 1, fontSize: 15, color: colors.text.primary, fontFamily: 'PlusJakartaSans_500Medium' }}>User Directory</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        style={{ marginHorizontal: 24, backgroundColor: colors.error + '18', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.error + '33' }}
      >
        <Text style={{ color: colors.error, fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Exit Admin Session</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
