import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function PaymentFailureScreen() {
  const router = useRouter();
  const { reason, courseId } = useLocalSearchParams<{ reason?: string; courseId?: string }>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.error + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <Text style={{ fontSize: 38 }}>❌</Text>
      </View>

      <Text style={{ fontSize: 24, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 8, textAlign: 'center' }}>
        Payment Failed
      </Text>
      <Text style={{ fontSize: 14, color: colors.text.muted, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
        {reason || 'The transaction could not be completed. No funds were deducted from your account.'}
      </Text>

      <TouchableOpacity
        onPress={() => {
          if (courseId) {
            router.back();
          } else {
            router.replace('/(student)/explore');
          }
        }}
        style={{
          backgroundColor: colors.primary,
          borderRadius: 14,
          paddingVertical: 16,
          paddingHorizontal: 32,
          width: '100%',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>
          Try Again
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/(student)/home')}>
        <Text style={{ color: colors.text.secondary, fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' }}>
          Cancel & Return Home
        </Text>
      </TouchableOpacity>
    </View>
  );
}
