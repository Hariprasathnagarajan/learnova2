import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { authService } from '../../src/services/authService';
import { useAuthStore } from '../../src/store/authStore';
import { colors } from '../../src/theme/colors';

export default function OTPVerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { setUser } = useAuthStore();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const refs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    if (!/^\d*$/.test(text)) return;
    const next = [...otp];
    next[index] = text;
    setOtp(next);
    if (text && index < 5) refs.current[index + 1]?.focus();
  };

  const handleSubmit = async () => {
    const code = otp.join('');
    if (code.length < 6) { Alert.alert('Enter full OTP'); return; }
    setLoading(true);
    try {
      const res = await authService.verifyOTP({ email: email ?? '', otp: code });
      setUser(res.user);
    } catch (e: any) {
      Alert.alert('Invalid OTP', e.message ?? 'Please try again. Demo OTP: 123456');
      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 80 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 32 }}>
        <Text style={{ color: colors.primary, fontSize: 15 }}>← Back</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 28, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 8 }}>Verify Email</Text>
      <Text style={{ fontSize: 14, color: colors.text.muted, marginBottom: 8 }}>We sent a 6-digit code to</Text>
      <Text style={{ fontSize: 14, color: colors.accent, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 40 }}>{email}</Text>

      <View style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 12, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
        <Text style={{ color: colors.text.muted, fontSize: 12, textAlign: 'center' }}>Demo OTP: <Text style={{ color: colors.accent, fontFamily: 'PlusJakartaSans_700Bold' }}>123456</Text></Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 40 }}>
        {otp.map((digit, i) => (
          <TextInput key={i} ref={(r) => { refs.current[i] = r; }} value={digit} onChangeText={(t) => handleChange(t, i)}
            maxLength={1} keyboardType="number-pad" textAlign="center"
            style={{ flex: 1, backgroundColor: colors.surface.secondary, borderRadius: 12, height: 56, fontSize: 22, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', borderWidth: 2, borderColor: digit ? colors.primary : colors.border }} />
        ))}
      </View>

      <TouchableOpacity onPress={handleSubmit} disabled={loading}
        style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 18, alignItems: 'center' }}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>Verify OTP</Text>}
      </TouchableOpacity>
    </View>
  );
}
