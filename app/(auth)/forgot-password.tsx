import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '../../src/services/authService';
import { colors } from '../../src/theme/colors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 80 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 32 }}>
        <Text style={{ color: colors.primary, fontSize: 15 }}>← Back</Text>
      </TouchableOpacity>
      {sent ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 20 }}>📧</Text>
          <Text style={{ fontSize: 24, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 12 }}>Email Sent!</Text>
          <Text style={{ fontSize: 14, color: colors.text.muted, textAlign: 'center', lineHeight: 22 }}>Check your inbox for password reset instructions. Demo mode: no actual email is sent.</Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 32, backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 16 }}>
            <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' }}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={{ fontSize: 28, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 8 }}>Forgot Password</Text>
          <Text style={{ fontSize: 14, color: colors.text.muted, marginBottom: 40 }}>{"Enter your email and we'll send reset instructions"}</Text>
          <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>Email</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.text.muted} keyboardType="email-address" autoCapitalize="none"
            style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, fontSize: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }} />
          <TouchableOpacity onPress={handleSubmit} disabled={loading || !email}
            style={{ backgroundColor: email ? colors.primary : colors.surface.elevated, borderRadius: 14, padding: 18, alignItems: 'center' }}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>Send Reset Link</Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
