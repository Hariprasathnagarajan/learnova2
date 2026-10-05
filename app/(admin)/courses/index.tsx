import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCourses } from '../../../src/queries/useCourses';
import { colors } from '../../../src/theme/colors';
import { formatINR } from '../../../src/utils/currencyUtils';

export default function AdminCoursesScreen() {
  const router = useRouter();
  const { data: courses, isLoading } = useCourses();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 22, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
              Course Management
            </Text>
            <Text style={{ fontSize: 13, color: colors.text.muted }}>
              {courses?.length || 0} active courses in catalog
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(admin)/courses/create')}
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
            <Text style={{ color: '#080B14', fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }}>New Course</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
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
                <Image source={{ uri: course.thumbnail }} style={{ width: 80, height: 80, borderRadius: 10 }} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ backgroundColor: colors.success + '22', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ color: colors.success, fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', textTransform: 'uppercase' }}>
                        {course.status}
                      </Text>
                    </View>
                    <Text style={{ color: colors.text.muted, fontSize: 12 }}>{course.durationWeeks} weeks</Text>
                  </View>

                  <Text style={{ fontSize: 15, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginTop: 4 }} numberOfLines={1}>
                    {course.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.text.muted, marginTop: 2 }}>
                    Instructor: {course.instructor.name}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.accent, fontFamily: 'PlusJakartaSans_700Bold', marginTop: 6 }}>
                    {formatINR(Math.min(...course.paymentPlans.map((p) => p.priceInr)))}
                  </Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.text.muted, fontSize: 12 }}>
                  {course.enrolledCount} enrolled • {course.totalSessions} sessions
                </Text>
                <TouchableOpacity
                  onPress={() => router.push(`/(admin)/courses/${course.id}/edit`)}
                  style={{
                    backgroundColor: colors.surface.elevated,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.text.primary, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                    Edit Plan & Details
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
