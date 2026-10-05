import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../../src/services/adminService';
import type { UserListItem } from '../../../src/types/user.types';
import { colors } from '../../../src/theme/colors';

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'staff' | 'admin'>('all');

  useEffect(() => {
    adminService.getUsers().then((data) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 22, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
            User Management
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(admin)/users/create-staff')}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Ionicons name="add" size={16} color="#080B14" />
            <Text style={{ color: '#080B14', fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }}>Add Staff</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface.secondary,
            borderRadius: 12,
            paddingHorizontal: 14,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="search-outline" size={18} color={colors.text.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or email..."
            placeholderTextColor={colors.text.muted}
            style={{ flex: 1, padding: 12, color: colors.text.primary, fontSize: 14 }}
          />
        </View>

        {/* Role Filters */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {(['all', 'student', 'staff', 'admin'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRoleFilter(r)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: roleFilter === r ? colors.accent : colors.surface.secondary,
                borderWidth: 1,
                borderColor: roleFilter === r ? colors.accent : colors.border,
              }}
            >
              <Text
                style={{
                  color: roleFilter === r ? '#080B14' : colors.text.muted,
                  fontSize: 11,
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  textTransform: 'capitalize',
                }}
              >
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          filtered.map((user) => (
            <TouchableOpacity
              key={user.id}
              onPress={() => router.push(`/(admin)/users/${user.id}`)}
              style={{
                backgroundColor: colors.surface.secondary,
                borderRadius: 14,
                padding: 16,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.surface.elevated,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: colors.text.primary, fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>
                    {user.firstName[0]}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, color: colors.text.primary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                    {user.firstName} {user.lastName}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.text.muted }}>{user.email}</Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View
                  style={{
                    backgroundColor:
                      user.role === 'admin'
                        ? colors.accent + '22'
                        : user.role === 'staff'
                        ? colors.primary + '22'
                        : colors.surface.elevated,
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <Text
                    style={{
                      color:
                        user.role === 'admin'
                          ? colors.accent
                          : user.role === 'staff'
                          ? colors.primary
                          : colors.text.muted,
                      fontSize: 11,
                      fontFamily: 'PlusJakartaSans_600SemiBold',
                      textTransform: 'capitalize',
                    }}
                  >
                    {user.role}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: user.isActive ? colors.success : colors.error }}>
                  {user.isActive ? 'Active' : 'Suspended'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
