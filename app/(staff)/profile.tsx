import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { colors } from '../../src/theme/colors';

export default function StaffProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Sign out of Faculty account?', [
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
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 32, color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' }}>{user?.firstName?.[0]}</Text>
        </View>
        <Text style={{ fontSize: 20, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={{ fontSize: 14, color: colors.text.muted, marginTop: 4 }}>{user?.email}</Text>
        <View style={{ backgroundColor: colors.primary + '22', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginTop: 10, borderWidth: 1, borderColor: colors.primary + '55' }}>
          <Text style={{ color: colors.primary, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }}>
            FACULTY INSTRUCTOR
          </Text>
        </View>
      </View>

      <View style={{ margin: 24, backgroundColor: colors.surface.secondary, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
        <TouchableOpacity
          onPress={() => router.push('/(staff)/dashboard')}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} style={{ marginRight: 14 }} />
          <Text style={{ flex: 1, fontSize: 15, color: colors.text.primary, fontFamily: 'PlusJakartaSans_500Medium' }}>Teaching Schedule</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(staff)/courses')}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
        >
          <Ionicons name="book-outline" size={20} color={colors.text.secondary} style={{ marginRight: 14 }} />
          <Text style={{ flex: 1, fontSize: 15, color: colors.text.primary, fontFamily: 'PlusJakartaSans_500Medium' }}>Batch Rosters</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(staff)/content')}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
        >
          <Ionicons name="cloud-upload-outline" size={20} color={colors.text.secondary} style={{ marginRight: 14 }} />
          <Text style={{ flex: 1, fontSize: 15, color: colors.text.primary, fontFamily: 'PlusJakartaSans_500Medium' }}>Course Content Repository</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        style={{ marginHorizontal: 24, backgroundColor: colors.error + '18', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.error + '33' }}
      >
        <Text style={{ color: colors.error, fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
