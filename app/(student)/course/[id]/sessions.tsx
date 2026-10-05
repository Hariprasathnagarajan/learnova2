import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCourseSessions, useCourse } from '../../../../src/queries/useCourses';
import { useEnrollments } from '../../../../src/queries/useEnrollments';
import { meetingService } from '../../../../src/services/meetingService';
import { colors } from '../../../../src/theme/colors';
import { formatSessionTime } from '../../../../src/utils/dateUtils';

export default function CourseSessionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: course } = useCourse(id);
  const { data: sessions, isLoading } = useCourseSessions(id);
  const { data: enrollments } = useEnrollments();

  const isEnrolled = enrollments?.some(e => e.courseId === id && e.status === 'active');

  const handleJoin = async (sessionId: string) => {
    try {
      await meetingService.joinSession(sessionId);
    } catch {
      Alert.alert('Error', 'Unable to initiate meeting session.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>Live Class Schedule</Text>
        <Text style={{ fontSize: 13, color: colors.text.muted, marginTop: 4 }}>{course?.title}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : sessions?.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ fontSize: 44, marginBottom: 14 }}>📅</Text>
            <Text style={{ fontSize: 16, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>No sessions scheduled</Text>
            <Text style={{ fontSize: 13, color: colors.text.muted, marginTop: 4 }}>Upcoming sessions will appear here.</Text>
          </View>
        ) : (
          sessions?.map((session, idx) => (
            <View
              key={session.id}
              style={{
                backgroundColor: colors.surface.secondary,
                borderRadius: 16,
                padding: 18,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: session.isCompleted ? colors.border : colors.primary + '55',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: colors.surface.elevated, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: colors.text.secondary, fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                      Session #{idx + 1}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: session.platform === 'zoom' ? '#2D8CFF22' : '#1A73E822',
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ color: session.platform === 'zoom' ? '#2D8CFF' : '#1A73E8', fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', textTransform: 'capitalize' }}>
                      {session.platform.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                {session.isCompleted ? (
                  <View style={{ backgroundColor: colors.surface.elevated, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: colors.text.muted, fontSize: 11 }}>Completed</Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: colors.accent + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: colors.accent, fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Upcoming</Text>
                  </View>
                )}
              </View>

              <Text style={{ fontSize: 16, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 6 }}>
                {session.title}
              </Text>
              <Text style={{ fontSize: 13, color: colors.text.secondary, lineHeight: 18, marginBottom: 12 }}>
                {session.description}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <Ionicons name="time-outline" size={15} color={colors.accent} />
                <Text style={{ fontSize: 13, color: colors.accent, fontFamily: 'PlusJakartaSans_500Medium' }}>
                  {formatSessionTime(session.scheduledAt)} ({session.durationMinutes} min)
                </Text>
              </View>

              {session.isCompleted ? (
                session.recordingAvailable ? (
                  <TouchableOpacity
                    onPress={() => Alert.alert('Play Recording', 'Opening encrypted recording player...')}
                    style={{
                      backgroundColor: colors.surface.elevated,
                      borderRadius: 10,
                      paddingVertical: 12,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: colors.border,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <Ionicons name="play-circle-outline" size={18} color={colors.success} />
                    <Text style={{ color: colors.success, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>
                      Watch Session Recording
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={{ color: colors.text.muted, fontSize: 12, fontStyle: 'italic' }}>
                    Recording processing or not available
                  </Text>
                )
              ) : isEnrolled ? (
                <TouchableOpacity
                  onPress={() => handleJoin(session.id)}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Ionicons name="videocam-outline" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}>
                    Join Live Class
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => router.push(`/(student)/course/${id}`)}
                  style={{
                    backgroundColor: colors.surface.elevated,
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.text.muted, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>
                    Enroll to Join This Session
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
