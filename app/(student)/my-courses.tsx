import { ScrollView, View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useCourses } from '../../src/queries/useCourses';
import { useEnrollments } from '../../src/queries/useEnrollments';
import { colors } from '../../src/theme/colors';

export default function MyCoursesScreen() {
  const router = useRouter();
  const { data: courses, isLoading } = useCourses();
  const { data: enrollments, isLoading: loadingEnrollments } = useEnrollments();

  const enrolledCourses = enrollments?.map(enr => ({
    enrollment: enr,
    course: courses?.find(c => c.id === enr.courseId),
  })).filter(item => item.course) ?? [];

  if (isLoading || loadingEnrollments) return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={{ padding: 24, paddingTop: 60 }}>
        <Text style={{ fontSize: 22, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 4 }}>My Courses</Text>
        <Text style={{ fontSize: 14, color: colors.text.muted }}>{enrolledCourses.length} enrolled</Text>
      </View>

      {enrolledCourses.length === 0 ? (
        <View style={{ alignItems: 'center', padding: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📚</Text>
          <Text style={{ fontSize: 18, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 8 }}>No courses yet</Text>
          <Text style={{ fontSize: 14, color: colors.text.muted, textAlign: 'center', marginBottom: 24 }}>Explore our catalog and enroll in your first course</Text>
          <TouchableOpacity onPress={() => router.push('/(student)/explore')} style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 }}>
            <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' }}>Explore Courses</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 24 }}>
          {enrolledCourses.map(({ enrollment, course }) => course && (
            <TouchableOpacity key={enrollment.id} onPress={() => router.push(`/(student)/course/${course.id}/dashboard`)}
              style={{ backgroundColor: colors.surface.secondary, borderRadius: 16, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
              <Image source={{ uri: course.thumbnail }} style={{ width: '100%', height: 130 }} resizeMode="cover" />
              <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: enrollment.status === 'active' ? colors.success : colors.warning, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', textTransform: 'capitalize' }}>{enrollment.status}</Text>
              </View>
              <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 15, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 12 }} numberOfLines={2}>{course.title}</Text>
                <View style={{ height: 6, backgroundColor: colors.surface.elevated, borderRadius: 3, marginBottom: 8 }}>
                  <View style={{ height: 6, backgroundColor: colors.primary, borderRadius: 3, width: `${enrollment.progressPercent}%` }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: colors.text.muted }}>{enrollment.progressPercent}% complete</Text>
                  <Text style={{ fontSize: 12, color: colors.primary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Continue →</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
