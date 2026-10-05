import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { colors } from '../../src/theme/colors';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [phone, setPhone] = useState(user?.phone || '');
  const [learningGoal, setLearningGoal] = useState('Full Stack Career');
  const [preferredPace, setPreferredPace] = useState('Part-Time (10 hrs/week)');
  const [loading, setLoading] = useState(false);

  const goals = ['Full Stack Career', 'Data Science & AI', 'Mobile Development', 'Upskilling'];
  const paces = ['Intensive (20+ hrs/wk)', 'Part-Time (10 hrs/wk)', 'Self-Paced (Weekend)'];

  const handleFinish = async () => {
    setLoading(true);
    // Update local user state
    if (user) {
      setUser({ ...user, phone });
    }
    setLoading(false);
    router.replace('/(student)/home');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 24, paddingTop: 70 }}>
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 28, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 8 }}>
          Personalize Learning
        </Text>
        <Text style={{ fontSize: 14, color: colors.text.muted, lineHeight: 20 }}>
          Help us tailor your curriculum, live class reminders, and batch schedules.
        </Text>
      </View>

      {/* Phone Number */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
          WhatsApp / Mobile (for Class Alerts)
        </Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="+91 98765 43210"
          placeholderTextColor={colors.text.muted}
          keyboardType="phone-pad"
          style={{
            backgroundColor: colors.surface.secondary,
            borderRadius: 12,
            padding: 16,
            color: colors.text.primary,
            fontSize: 15,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        />
      </View>

      {/* Primary Goal */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 12 }}>
          Primary Learning Goal
        </Text>
        <View style={{ gap: 10 }}>
          {goals.map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setLearningGoal(g)}
              style={{
                backgroundColor: learningGoal === g ? colors.primary + '18' : colors.surface.secondary,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1.5,
                borderColor: learningGoal === g ? colors.primary : colors.border,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: learningGoal === g ? colors.primary : colors.text.primary, fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                {g}
              </Text>
              {learningGoal === g && <Text style={{ color: colors.primary }}>●</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Preferred Pace */}
      <View style={{ marginBottom: 36 }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 12 }}>
          Commitment & Schedule
        </Text>
        <View style={{ gap: 10 }}>
          {paces.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPreferredPace(p)}
              style={{
                backgroundColor: preferredPace === p ? colors.accent + '15' : colors.surface.secondary,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1.5,
                borderColor: preferredPace === p ? colors.accent : colors.border,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: preferredPace === p ? colors.accent : colors.text.primary, fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                {p}
              </Text>
              {preferredPace === p && <Text style={{ color: colors.accent }}>●</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        onPress={handleFinish}
        disabled={loading}
        style={{
          backgroundColor: colors.primary,
          borderRadius: 14,
          padding: 18,
          alignItems: 'center',
          marginBottom: 40,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>
            Get Started
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
