import { ScrollView, View, Text, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useCourses } from '../../src/queries/useCourses';
import { useEnrollments } from '../../src/queries/useEnrollments';
import { useAuthStore } from '../../src/store/authStore';
import { colors } from '../../src/theme/colors';
import { formatINR } from '../../src/utils/currencyUtils';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: courses, isLoading: loadingCourses, refetch } = useCourses();
  const { data: enrollments } = useEnrollments();

  const enrolledCourseIds = new Set(enrollments?.map(e => e.courseId) ?? []);
  const featuredCourses = courses?.filter(c => c.status === 'published').slice(0, 3) ?? [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={<RefreshControl refreshing={loadingCourses} onRefresh={refetch} tintColor={colors.primary} />}
      contentContainerStyle={{ paddingBottom: 24 }}>

      {/* Header */}
      <View style={{ padding: 24, paddingTop: 60, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: 22, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
          Hi, {user?.firstName} 👋
        </Text>
        <Text style={{ fontSize: 14, color: colors.text.muted, marginTop: 4, fontFamily: 'PlusJakartaSans_400Regular' }}>
          Ready to learn something new today?
        </Text>
        {/* Stats */}
        <View style={{ flexDirection: 'row', marginTop: 20, gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: colors.surface.elevated, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 24, color: colors.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>{enrollments?.length ?? 0}</Text>
            <Text style={{ fontSize: 12, color: colors.text.muted, fontFamily: 'PlusJakartaSans_400Regular' }}>Enrolled</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface.elevated, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 24, color: colors.accent, fontFamily: 'PlusJakartaSans_700Bold' }}>
              {enrollments?.[0]?.progressPercent ?? 0}%
            </Text>
            <Text style={{ fontSize: 12, color: colors.text.muted, fontFamily: 'PlusJakartaSans_400Regular' }}>Avg Progress</Text>
          </View>
        </View>
      </View>

      {/* Continue Learning */}
      {enrollments && enrollments.length > 0 && (
        <View style={{ padding: 24 }}>
          <Text style={{ fontSize: 18, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 16 }}>Continue Learning</Text>
          {enrollments.slice(0, 2).map(enr => {
            const course = courses?.find(c => c.id === enr.courseId);
            if (!course) return null;
            return (
              <TouchableOpacity key={enr.id} onPress={() => router.push(`/(student)/course/${course.id}/dashboard`)}
                style={{ backgroundColor: colors.surface.secondary, borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                <Image source={{ uri: course.thumbnail }} style={{ width: '100%', height: 120 }} resizeMode="cover" />
                <View style={{ padding: 16 }}>
                  <Text style={{ fontSize: 14, color: colors.text.primary, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 8 }} numberOfLines={2}>{course.title}</Text>
                  <View style={{ height: 4, backgroundColor: colors.surface.elevated, borderRadius: 2 }}>
                    <View style={{ height: 4, backgroundColor: colors.primary, borderRadius: 2, width: `${enr.progressPercent}%` }} />
                  </View>
                  <Text style={{ fontSize: 12, color: colors.text.muted, marginTop: 6 }}>{enr.progressPercent}% complete</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Featured Courses */}
      <View style={{ paddingHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 18, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>Featured Courses</Text>
          <TouchableOpacity onPress={() => router.push('/(student)/explore')}>
            <Text style={{ color: colors.primary, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>See all</Text>
          </TouchableOpacity>
        </View>
        {loadingCourses ? <ActivityIndicator color={colors.primary} /> : featuredCourses.map(course => (
          <TouchableOpacity key={course.id} onPress={() => router.push(`/(student)/course/${course.id}`)}
            style={{ backgroundColor: colors.surface.secondary, borderRadius: 16, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
            <Image source={{ uri: course.thumbnail }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
            <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: enrolledCourseIds.has(course.id) ? colors.success : colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{enrolledCourseIds.has(course.id) ? 'Enrolled' : 'New'}</Text>
            </View>
            <View style={{ padding: 16 }}>
              <Text style={{ fontSize: 13, color: colors.accent, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 4 }}>{course.category}</Text>
              <Text style={{ fontSize: 16, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 8 }} numberOfLines={2}>{course.title}</Text>
              <Text style={{ fontSize: 13, color: colors.text.muted, marginBottom: 12 }} numberOfLines={2}>{course.shortDescription}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, color: colors.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {formatINR(Math.min(...course.paymentPlans.map(p => p.priceInr)))}
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Text style={{ fontSize: 12, color: colors.text.muted }}>⭐ {course.rating}</Text>
                  <Text style={{ fontSize: 12, color: colors.text.muted }}>{course.enrolledCount.toLocaleString()} students</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
