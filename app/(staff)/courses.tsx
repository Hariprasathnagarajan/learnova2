import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useCourses } from '../../src/queries/useCourses';
import { colors } from '../../src/theme/colors';

export default function StaffCoursesScreen() {
  const router = useRouter();
  const { data: courses, isLoading } = useCourses();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: 22, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
          My Assigned Courses
        </Text>
        <Text style={{ fontSize: 13, color: colors.text.muted, marginTop: 4 }}>
          Batches and cohorts under your instruction
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          courses?.map((course) => (
            <View
              key={course.id}
              style={{
                backgroundColor: colors.surface.secondary,
                borderRadius: 16,
                padding: 16,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <Image source={{ uri: course.thumbnail }} style={{ width: 72, height: 72, borderRadius: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }} numberOfLines={2}>
                    {course.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.accent, marginTop: 4 }}>
                    {course.category} • {course.enrolledCount} Students Enrolled
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.text.muted, marginTop: 2 }}>
                    {course.totalSessions} Total Sessions Planned
                  </Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => router.push(`/(student)/course/${course.id}/dashboard`)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface.elevated,
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.text.primary, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                    View Student View
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/(staff)/content')}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }}>
                    Post Resources
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
