import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../../src/services/adminService';
import type { UserListItem } from '../../../src/types/user.types';
import { colors } from '../../../src/theme/colors';
import { formatDate } from '../../../src/utils/dateUtils';

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(true);

  useEffect(() => {
    adminService.getUser(id).then((u) => {
      setUser(u);
      setActive(u.isActive);
      setLoading(false);
    });
  }, [id]);

  const toggleStatus = () => {
    const next = !active;
    setActive(next);
    Alert.alert('Status Updated', `User account has been ${next ? 'activated' : 'suspended'}.`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
          User Details
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : user ? (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {/* User Card */}
          <View style={{ backgroundColor: colors.surface.secondary, borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22, color: '#080B14', fontFamily: 'PlusJakartaSans_700Bold' }}>{user.firstName[0]}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 18, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={{ fontSize: 13, color: colors.text.muted }}>{user.email}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Text style={{ color: colors.text.muted, fontSize: 13 }}>Assigned Role</Text>
              <Text style={{ color: colors.accent, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, textTransform: 'capitalize' }}>{user.role}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Text style={{ color: colors.text.muted, fontSize: 13 }}>Joined On</Text>
              <Text style={{ color: colors.text.primary, fontSize: 13 }}>{formatDate(user.createdAt)}</Text>
            </View>
            {user.role === 'student' && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Text style={{ color: colors.text.muted, fontSize: 13 }}>Enrolled Courses</Text>
                <Text style={{ color: colors.primary, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 }}>{user.enrollmentCount || 0}</Text>
              </View>
            )}
          </View>

          {/* Account Status Control */}
          <View style={{ backgroundColor: colors.surface.secondary, borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 15, color: colors.text.primary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                  Account Active Status
                </Text>
                <Text style={{ fontSize: 12, color: colors.text.muted, marginTop: 2 }}>
                  Suspended users cannot access materials or join sessions
                </Text>
              </View>
              <Switch value={active} onValueChange={toggleStatus} trackColor={{ false: colors.border, true: colors.success }} thumbColor="#fff" />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => Alert.alert('Password Reset', `Temporary password link sent to ${user.email}`)}
            style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
          >
            <Text style={{ color: colors.text.primary, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>
              Send Password Reset Link
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : null}
    </View>
  );
}
