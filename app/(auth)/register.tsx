import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '../../src/utils/validationUtils';
import { authService } from '../../src/services/authService';
import { useAuthStore } from '../../src/store/authStore';
import { colors } from '../../src/theme/colors';

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      const res = await authService.register({ email: data.email, password: data.password, firstName: data.firstName, lastName: data.lastName, phone: data.phone });

      // The API returns tokens on success - go straight in rather than making
      // a brand new learner retype the password they just chose.
      if (res?.tokens) {
        setUser(res.user);
        return;
      }

      router.push({ pathname: '/(auth)/otp-verify', params: { email: data.email } });
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message ?? 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const fields: { name: keyof RegisterFormData; label: string; placeholder: string; secure?: boolean; keyboard?: any }[] = [
    { name: 'firstName', label: 'First Name', placeholder: 'Rohan' },
    { name: 'lastName', label: 'Last Name', placeholder: 'Verma' },
    { name: 'email', label: 'Email', placeholder: 'rohan@example.com', keyboard: 'email-address' },
    { name: 'phone', label: 'Phone (optional)', placeholder: '+91 98765 43210', keyboard: 'phone-pad' },
    { name: 'password', label: 'Password', placeholder: '••••••••', secure: true },
    { name: 'confirmPassword', label: 'Confirm Password', placeholder: '••••••••', secure: true },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 24, paddingTop: 60 }} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
        <Text style={{ color: colors.primary, fontSize: 15 }}>← Back</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 28, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 8 }}>Create account</Text>
      <Text style={{ fontSize: 14, color: colors.text.muted, fontFamily: 'PlusJakartaSans_400Regular', marginBottom: 32 }}>Join Learnova and start learning today</Text>

      {fields.map((f) => (
        <View key={f.name} style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>{f.label}</Text>
          <Controller control={control} name={f.name} render={({ field: { onChange, value } }) => (
            <TextInput value={(value ?? '') as string} onChangeText={onChange} placeholder={f.placeholder} placeholderTextColor={colors.text.muted} secureTextEntry={f.secure} keyboardType={f.keyboard ?? 'default'} autoCapitalize={f.keyboard === 'email-address' ? 'none' : 'words'}
              style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, borderWidth: 1, borderColor: errors[f.name] ? colors.error : colors.border }} />
          )} />
          {errors[f.name] && <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{errors[f.name]?.message as string}</Text>}
        </View>
      ))}

      <TouchableOpacity onPress={handleSubmit(onSubmit)} disabled={loading}
        style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 8, marginBottom: 20 }}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>Create Account</Text>}
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
        <Text style={{ color: colors.text.muted, fontSize: 14 }}>Already have an account?</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={{ color: colors.primary, fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
