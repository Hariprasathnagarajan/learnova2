import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '../../src/utils/validationUtils';
import { authService } from '../../src/services/authService';
import { useAuthStore } from '../../src/store/authStore';
import { colors } from '../../src/theme/colors';
import { DEMO_ACCOUNTS, SHOW_DEMO_LOGIN } from '../../src/config/demoAccounts';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const res = await authService.login(data);
      setUser(res.user);
    } catch (e: any) {
      Alert.alert('Login Failed', e.message ?? 'Please check your credentials');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (role: 'admin' | 'staff' | 'student') => {
    setValue('email', DEMO_ACCOUNTS[role].email);
    setValue('password', DEMO_ACCOUNTS[role].password);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 24, paddingTop: 80 }} keyboardShouldPersistTaps="handled">
      {/* Logo */}
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 28, color: '#fff' }}>L</Text>
        </View>
        <Text style={{ fontSize: 28, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>Welcome back</Text>
        <Text style={{ fontSize: 14, color: colors.text.muted, marginTop: 8, fontFamily: 'PlusJakartaSans_400Regular' }}>Sign in to continue learning</Text>
      </View>

      {/* Demo Buttons */}
      {SHOW_DEMO_LOGIN && (
      <View style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
        <Text style={{ color: colors.text.muted, fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 12, textAlign: 'center' }}>QUICK DEMO LOGIN</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['admin', 'staff', 'student'] as const).map((role) => (
            <TouchableOpacity key={role} onPress={() => quickLogin(role)} style={{ flex: 1, backgroundColor: colors.surface.elevated, borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.accent, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', textTransform: 'capitalize' }}>{role}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      )}

      {/* Email */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>Email</Text>
        <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
          <TextInput value={value ?? ''} onChangeText={onChange} placeholder="you@example.com" placeholderTextColor={colors.text.muted} keyboardType="email-address" autoCapitalize="none"
            style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, borderWidth: 1, borderColor: errors.email ? colors.error : colors.border }} />
        )} />
        {errors.email && <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{errors.email.message}</Text>}
      </View>

      {/* Password */}
      <View style={{ marginBottom: 8 }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>Password</Text>
        <View style={{ position: 'relative' }}>
          <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
            <TextInput value={value ?? ''} onChangeText={onChange} placeholder="••••••••" placeholderTextColor={colors.text.muted} secureTextEntry={!showPassword}
              style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, paddingRight: 50, color: colors.text.primary, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, borderWidth: 1, borderColor: errors.password ? colors.error : colors.border }} />
          )} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 16, top: 16 }}>
            <Text style={{ color: colors.text.muted, fontSize: 13 }}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{errors.password.message}</Text>}
      </View>

      <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={{ alignSelf: 'flex-end', marginBottom: 28 }}>
        <Text style={{ color: colors.primary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>Forgot password?</Text>
      </TouchableOpacity>

      {/* Submit */}
      <TouchableOpacity onPress={handleSubmit(onSubmit)} disabled={loading}
        style={{ backgroundColor: loading ? colors.primaryPressed : colors.primary, borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 20 }}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>Sign In</Text>}
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
        <Text style={{ color: colors.text.muted, fontSize: 14 }}>{"Don't have an account?"}</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={{ color: colors.primary, fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
