import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCourse, useCourseSessions } from '../../../../src/queries/useCourses';
import { useEnrollments } from '../../../../src/queries/useEnrollments';
import { meetingService } from '../../../../src/services/meetingService';
import { colors } from '../../../../src/theme/colors';
import { formatSessionTime } from '../../../../src/utils/dateUtils';

export default function CourseDashboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: course } = useCourse(id);
  const { data: sessions, isLoading } = useCourseSessions(id);
  const { data: enrollments } = useEnrollments();

  const enrollment = enrollments?.find(e => e.courseId === id);
  const isEnrolled = !!enrollment;

  const handleJoinSession = async (sessionId: string) => {
    try {
      await meetingService.joinSession(sessionId);
    } catch {
      Alert.alert('Error', 'Could not open session link');
    }
  };

  const tabs = [
    { label: 'Sessions', route: `/(student)/course/${id}/sessions` },
    { label: 'Materials', route: `/(student)/course/${id}/materials` },
    { label: 'Notes', route: `/(student)/course/${id}/notes` },
    { label: 'Payments', route: `/(student)/course/${id}/payment-history` },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.surface.primary, padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }} numberOfLines={2}>{course?.title}</Text>
        {enrollment && (
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, color: colors.text.muted }}>Progress</Text>
              <Text style={{ fontSize: 13, color: colors.primary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{enrollment.progressPercent}%</Text>
            </View>
            <View style={{ height: 6, backgroundColor: colors.surface.elevated, borderRadius: 3 }}>
              <View style={{ height: 6, backgroundColor: colors.primary, borderRadius: 3, width: `${enrollment.progressPercent}%` }} />
            </View>
          </View>
        )}
      </View>

      {/* Quick Nav Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 10 }}>
        {tabs.map(tab => (
          <TouchableOpacity key={tab.label} onPress={() => router.push(tab.route as any)}
            style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.surface.secondary, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Upcoming Sessions */}
        <Text style={{ fontSize: 16, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 14 }}>Upcoming Sessions</Text>
        {isLoading ? <ActivityIndicator color={colors.primary} /> :
          sessions?.filter(s => !s.isCompleted).map(session => (
            <View key={session.id} style={{ backgroundColor: colors.surface.secondary, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ backgroundColor: session.platform === 'zoom' ? '#2D8CFF22' : '#1A73E822', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Text style={{ color: session.platform === 'zoom' ? '#2D8CFF' : '#1A73E8', fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', textTransform: 'capitalize' }}>{session.platform.replace('_', ' ')}</Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.text.muted }}>{session.durationMinutes} min</Text>
              </View>
              <Text style={{ fontSize: 15, color: colors.text.primary, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 6 }}>{session.title}</Text>
              <Text style={{ fontSize: 13, color: colors.accent, marginBottom: 14 }}>{formatSessionTime(session.scheduledAt)}</Text>
              {isEnrolled && (
                <TouchableOpacity onPress={() => handleJoinSession(session.id)}
                  style={{ backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}>Join Class</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        }

        {/* Past Sessions */}
        {((sessions?.filter(s => s.isCompleted)?.length ?? 0) > 0) && (
          <>
            <Text style={{ fontSize: 16, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginTop: 8, marginBottom: 14 }}>Past Sessions</Text>
            {sessions?.filter(s => s.isCompleted).map(session => (
              <View key={session.id} style={{ backgroundColor: colors.surface.secondary, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border, opacity: 0.8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: colors.text.secondary, fontFamily: 'PlusJakartaSans_500Medium', flex: 1 }}>{session.title}</Text>
                  {session.recordingAvailable && (
                    <View style={{ backgroundColor: colors.success + '22', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 10 }}>
                      <Text style={{ color: colors.success, fontSize: 11 }}>Recording</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 12, color: colors.text.muted, marginTop: 6 }}>{formatSessionTime(session.scheduledAt)}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
