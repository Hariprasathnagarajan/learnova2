import { View, Text, ScrollView } from 'react-native';
import { colors } from '../../src/theme/colors';

export default function StaffNotificationsScreen() {
  const staffNotifs = [
    {
      id: 'sn-1',
      title: 'Batch Live Class In 2 Hours',
      body: 'Your live session "Django REST Setup" starts at 7:00 PM IST on Zoom.',
      time: '1 hour ago',
      type: 'session',
    },
    {
      id: 'sn-2',
      title: 'New Student Enrollment',
      body: 'Rohan Verma enrolled in Full-Stack Web Development via Flexi EMI.',
      time: '5 hours ago',
      type: 'enrollment',
    },
    {
      id: 'sn-3',
      title: 'Course Material Sync Completed',
      body: 'Your uploaded slides were processed and encrypted with DRM.',
      time: 'Yesterday',
      type: 'system',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: 22, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
          Faculty Notifications
        </Text>
        <Text style={{ fontSize: 13, color: colors.text.muted, marginTop: 2 }}>
          Class updates and student enrollment alerts
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {staffNotifs.map((n) => (
          <View
            key={n.id}
            style={{
              backgroundColor: colors.surface.secondary,
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 14, color: colors.text.primary, fontFamily: 'PlusJakartaSans_600SemiBold', flex: 1 }}>
                {n.title}
              </Text>
              <Text style={{ fontSize: 11, color: colors.text.muted }}>{n.time}</Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.text.secondary, lineHeight: 19 }}>{n.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
