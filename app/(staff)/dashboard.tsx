import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { colors } from '../../src/theme/colors';

export default function StaffDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const handleStartClass = (platform: string) => {
    Alert.alert('Initiating Host Session', `Starting faculty host room on ${platform.toUpperCase()} with instructor rights.`);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Faculty Header */}
      <View style={{ padding: 24, paddingTop: 60, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: 24, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
          Instructor Workspace
        </Text>
        <Text style={{ fontSize: 13, color: colors.text.muted, marginTop: 4 }}>
          Welcome, {user?.firstName} {user?.lastName} (Faculty)
        </Text>

        {/* Quick Teaching Metrics */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
          <View style={{ flex: 1, backgroundColor: colors.surface.elevated, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 22, color: colors.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>3</Text>
            <Text style={{ fontSize: 12, color: colors.text.muted, marginTop: 2 }}>Assigned Courses</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface.elevated, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 22, color: colors.accent, fontFamily: 'PlusJakartaSans_700Bold' }}>2,100</Text>
            <Text style={{ fontSize: 12, color: colors.text.muted, marginTop: 2 }}>Active Students</Text>
          </View>
        </View>
      </View>

      <View style={{ padding: 20 }}>
        {/* Next Live Teaching Session */}
        <Text style={{ fontSize: 16, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 12 }}>
          Your Next Live Class (Faculty Host)
        </Text>

        <View style={{ backgroundColor: colors.surface.secondary, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.primary + '55' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ backgroundColor: '#2D8CFF22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ color: '#2D8CFF', fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold' }}>ZOOM HOST</Text>
            </View>
            <Text style={{ color: colors.accent, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Starts in 2 hours</Text>
          </View>

          <Text style={{ fontSize: 17, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 4 }}>
            Django Project Setup & REST API Basics
          </Text>
          <Text style={{ fontSize: 13, color: colors.text.muted, marginBottom: 16 }}>
            Course: Full-Stack Web Development • Batch A (142 students)
          </Text>

          <TouchableOpacity
            onPress={() => handleStartClass('zoom')}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="videocam" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}>
              Start Class as Host
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Upload Action */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 16, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
            Course Materials & Notes
          </Text>
          <TouchableOpacity onPress={() => router.push('/(staff)/content')}>
            <Text style={{ color: colors.primary, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>+ Upload</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(staff)/content')}
          style={{
            backgroundColor: colors.surface.secondary,
            borderRadius: 14,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accent + '22', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="document-text-outline" size={24} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, color: colors.text.primary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
              Publish Study Note or PDF
            </Text>
            <Text style={{ fontSize: 12, color: colors.text.muted }}>
              Instantly notifies enrolled students via push & in-app alerts
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
