import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService, type AdminDashboardStats } from '../../src/services/adminService';
import { colors } from '../../src/theme/colors';
import { formatINR } from '../../src/utils/currencyUtils';
import { formatDate } from '../../src/utils/dateUtils';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await adminService.getDashboardStats();
      setStats(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Admin Header */}
      <View style={{ padding: 24, paddingTop: 60, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <View>
            <Text style={{ fontSize: 24, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
              Admin Operations
            </Text>
            <Text style={{ fontSize: 13, color: colors.text.muted }}>
              Platform Overview & Performance
            </Text>
          </View>
          <View style={{ backgroundColor: colors.accent + '22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: colors.accent, fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold' }}>LIVE DATA</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: 40 }} />
      ) : (
        <View style={{ padding: 20 }}>
          {/* Key Metric Tiles */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.surface.secondary, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.text.muted, fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium' }}>Total Revenue</Text>
              <Text style={{ fontSize: 22, color: colors.accent, fontFamily: 'PlusJakartaSans_700Bold', marginVertical: 4 }}>
                {formatINR(stats?.totalRevenueInr || 0)}
              </Text>
              <Text style={{ color: colors.success, fontSize: 11 }}>+{stats?.monthlyGrowthPercent}% this month</Text>
            </View>

            <View style={{ flex: 1, backgroundColor: colors.surface.secondary, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.text.muted, fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium' }}>Active Students</Text>
              <Text style={{ fontSize: 22, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginVertical: 4 }}>
                {stats?.totalStudents.toLocaleString()}
              </Text>
              <Text style={{ color: colors.text.muted, fontSize: 11 }}>{stats?.activeEnrollments} enrolled</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <Text style={{ fontSize: 16, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginTop: 12, marginBottom: 14 }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <TouchableOpacity
              onPress={() => router.push('/(admin)/courses/create')}
              style={{
                flex: 1,
                backgroundColor: colors.surface.secondary,
                borderRadius: 14,
                padding: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primary + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              </View>
              <Text style={{ color: colors.text.primary, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', textAlign: 'center' }}>
                New Course
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(admin)/users/create-staff')}
              style={{
                flex: 1,
                backgroundColor: colors.surface.secondary,
                borderRadius: 14,
                padding: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accent + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Ionicons name="person-add-outline" size={24} color={colors.accent} />
              </View>
              <Text style={{ color: colors.text.primary, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', textAlign: 'center' }}>
                Add Staff
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(admin)/payments')}
              style={{
                flex: 1,
                backgroundColor: colors.surface.secondary,
                borderRadius: 14,
                padding: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.success + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Ionicons name="receipt-outline" size={24} color={colors.success} />
              </View>
              <Text style={{ color: colors.text.primary, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', textAlign: 'center' }}>
                All Orders
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recent Platform Payments */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontSize: 16, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
              Recent Transactions
            </Text>
            <TouchableOpacity onPress={() => router.push('/(admin)/payments')}>
              <Text style={{ color: colors.accent, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>See all</Text>
            </TouchableOpacity>
          </View>

          {stats?.recentPayments.slice(0, 3).map((item) => (
            <View
              key={item.id}
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
              <View>
                <Text style={{ fontSize: 14, color: colors.text.primary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                  {item.userId}
                </Text>
                <Text style={{ fontSize: 12, color: colors.text.muted, marginTop: 2 }}>
                  {formatDate(item.createdAt)} • {item.gateway}
                </Text>
              </View>
              <Text style={{ fontSize: 16, color: colors.success, fontFamily: 'PlusJakartaSans_700Bold' }}>
                +{formatINR(item.amountInr)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
