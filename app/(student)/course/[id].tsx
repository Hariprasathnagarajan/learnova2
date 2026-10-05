import { ScrollView, View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCourse } from '../../../src/queries/useCourses';
import { useEnrollments } from '../../../src/queries/useEnrollments';
import { colors } from '../../../src/theme/colors';
import { formatINR } from '../../../src/utils/currencyUtils';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: course, isLoading } = useCourse(id);
  const { data: enrollments } = useEnrollments();

  const isEnrolled = enrollments?.some(e => e.courseId === id && e.status === 'active');

  if (isLoading) return <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (!course) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero Image */}
        <View style={{ position: 'relative' }}>
          <Image source={{ uri: course.thumbnail }} style={{ width: '100%', height: 240 }} resizeMode="cover" />
          <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', top: 54, left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ padding: 24 }}>
          {/* Tags */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <View style={{ backgroundColor: colors.primary + '22', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: colors.primary, fontSize: 12, textTransform: 'capitalize' }}>{course.level}</Text>
            </View>
            <View style={{ backgroundColor: colors.surface.elevated, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: colors.text.muted, fontSize: 12 }}>{course.durationWeeks} weeks</Text>
            </View>
            <View style={{ backgroundColor: colors.surface.elevated, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: colors.text.muted, fontSize: 12 }}>{course.totalSessions} sessions</Text>
            </View>
          </View>

          <Text style={{ fontSize: 22, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', lineHeight: 30, marginBottom: 12 }}>{course.title}</Text>
          <Text style={{ fontSize: 14, color: colors.text.secondary, lineHeight: 22, marginBottom: 20 }}>{course.description}</Text>

          {/* Stats */}
          <View style={{ flexDirection: 'row', backgroundColor: colors.surface.secondary, borderRadius: 14, padding: 16, marginBottom: 24, gap: 16, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, color: colors.warning, fontFamily: 'PlusJakartaSans_700Bold' }}>⭐ {course.rating}</Text>
              <Text style={{ fontSize: 11, color: colors.text.muted, marginTop: 2 }}>{course.ratingCount} reviews</Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, color: colors.accent, fontFamily: 'PlusJakartaSans_700Bold' }}>{course.enrolledCount.toLocaleString()}</Text>
              <Text style={{ fontSize: 11, color: colors.text.muted, marginTop: 2 }}>students</Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, color: colors.success, fontFamily: 'PlusJakartaSans_700Bold' }}>{course.durationWeeks}w</Text>
              <Text style={{ fontSize: 11, color: colors.text.muted, marginTop: 2 }}>duration</Text>
            </View>
          </View>

          {/* Instructor */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface.secondary, borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Text style={{ fontSize: 20, color: '#fff' }}>{course.instructor.name[0]}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 15, color: colors.text.primary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{course.instructor.name}</Text>
              <Text style={{ fontSize: 13, color: colors.text.muted }}>{course.instructor.bio}</Text>
            </View>
          </View>

          {/* Tags */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {course.tags.map(tag => (
              <View key={tag} style={{ backgroundColor: colors.accent + '18', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.accent + '33' }}>
                <Text style={{ color: colors.accent, fontSize: 12 }}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Payment Plans */}
          {!isEnrolled && (
            <>
              <Text style={{ fontSize: 18, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 16 }}>Choose a Plan</Text>
              {course.paymentPlans.map(plan => (
                <TouchableOpacity key={plan.id} onPress={() => router.push({ pathname: '/(student)/checkout', params: { courseId: course.id, planId: plan.id } })}
                  style={{ backgroundColor: plan.isPopular ? colors.primary + '18' : colors.surface.secondary, borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 2, borderColor: plan.isPopular ? colors.primary : colors.border }}>
                  {plan.isPopular && (
                    <View style={{ backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 10 }}>
                      <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold' }}>MOST POPULAR</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View>
                      <Text style={{ fontSize: 17, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>{plan.name}</Text>
                      <Text style={{ fontSize: 13, color: colors.text.muted, marginTop: 2 }}>{plan.description}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 20, color: plan.isPopular ? colors.primary : colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
                        {plan.installments > 1 ? `${formatINR(plan.installmentAmountInr ?? plan.priceInr)}/mo` : formatINR(plan.priceInr)}
                      </Text>
                      {plan.installments > 1 && <Text style={{ fontSize: 12, color: colors.text.muted }}>× {plan.installments} months</Text>}
                    </View>
                  </View>
                  {plan.features.map(f => (
                    <View key={f} style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                      <Text style={{ color: colors.success }}>✓</Text>
                      <Text style={{ fontSize: 13, color: colors.text.secondary }}>{f}</Text>
                    </View>
                  ))}
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Access dashboard if enrolled */}
          {isEnrolled && (
            <TouchableOpacity onPress={() => router.push(`/(student)/course/${id}/dashboard`)}
              style={{ backgroundColor: colors.success, borderRadius: 14, padding: 18, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>Go to My Course →</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
