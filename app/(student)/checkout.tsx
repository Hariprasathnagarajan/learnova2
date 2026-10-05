import { useState, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCourse } from '../../src/queries/useCourses';
import { paymentService } from '../../src/services/paymentService';
import { runRazorpayCheckout, PaymentCancelledError } from '../../src/services/razorpayCheckout';
import { useAuthStore } from '../../src/store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../src/queries/queryKeys';
import { colors } from '../../src/theme/colors';
import { formatINR } from '../../src/utils/currencyUtils';
import type { PaymentPlan } from '../../src/types/course.types';

export default function CheckoutScreen() {
  const { courseId, planId } = useLocalSearchParams<{ courseId: string; planId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: course } = useCourse(courseId || '');
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  const plan = course?.paymentPlans.find((p: PaymentPlan) => p.id === planId);

  const handlePayment = useCallback(async () => {
    if (!plan || !course) return;
    setLoading(true);
    try {
      const checkout = await runRazorpayCheckout(
        { courseId: course.id, planId: plan.id },
        {
          name: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.email || 'Learnova learner',
          email: user?.email ?? '',
          phone: user?.phone,
        },
        () => setLoading(false),
      );

      const result = await paymentService.verifyPayment({
        razorpayOrderId: checkout.orderId,
        razorpayPaymentId: checkout.paymentId,
        razorpaySignature: checkout.signature,
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.list() });
      setPaid(true);
      return result;
    } catch (e: any) {
      if (e instanceof PaymentCancelledError) return;
      Alert.alert('Payment Failed', e.message ?? 'Please try again');
    } finally {
      setLoading(false);
    }
  }, [plan, course, user, queryClient]);

  if (paid) return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text style={{ fontSize: 72, marginBottom: 24 }}>🎉</Text>
      <Text style={{ fontSize: 26, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 12, textAlign: 'center' }}>Enrollment Successful!</Text>
      <Text style={{ fontSize: 15, color: colors.text.muted, textAlign: 'center', marginBottom: 8 }}>Welcome to {course?.title}</Text>
      <Text style={{ fontSize: 14, color: colors.success, textAlign: 'center', marginBottom: 40 }}>Payment of {formatINR(plan?.installmentAmountInr ?? 0)} confirmed</Text>
      <TouchableOpacity onPress={() => router.replace(`/(student)/course/${courseId}/dashboard`)}
        style={{ backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 16, width: '100%', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>Start Learning</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/(student)/my-courses')}>
        <Text style={{ color: colors.text.muted, fontSize: 14 }}>Go to My Courses</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 14 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        {/* Course Summary */}
        <View style={{ backgroundColor: colors.surface.secondary, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 13, color: colors.text.muted, marginBottom: 4 }}>Course</Text>
          <Text style={{ fontSize: 16, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 16 }}>{course?.title}</Text>
          <Text style={{ fontSize: 13, color: colors.text.muted, marginBottom: 4 }}>Plan</Text>
          <Text style={{ fontSize: 15, color: colors.accent, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{plan?.name}</Text>
        </View>

        {/* Order Summary */}
        <View style={{ backgroundColor: colors.surface.secondary, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 16, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 16 }}>Order Summary</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 14, color: colors.text.secondary }}>Payment amount</Text>
            <Text style={{ fontSize: 14, color: colors.text.primary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{formatINR(plan?.installmentAmountInr ?? 0)}</Text>
          </View>
          {plan && plan.installments > 1 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 14, color: colors.text.secondary }}>Installment</Text>
              <Text style={{ fontSize: 14, color: colors.text.primary }}>1 of {plan.installments}</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 14, color: colors.text.secondary }}>Total course value</Text>
            <Text style={{ fontSize: 14, color: colors.text.primary }}>{formatINR(plan?.priceInr ?? 0)}</Text>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>Due Today</Text>
            <Text style={{ fontSize: 20, color: colors.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>{formatINR(plan?.installmentAmountInr ?? 0)}</Text>
          </View>
        </View>

        {/* Payer Info */}
        <View style={{ backgroundColor: colors.surface.secondary, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 16, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 16 }}>Billing Details</Text>
          <Text style={{ fontSize: 14, color: colors.text.secondary, marginBottom: 4 }}>{user?.firstName} {user?.lastName}</Text>
          <Text style={{ fontSize: 13, color: colors.text.muted }}>{user?.email}</Text>
        </View>

        <TouchableOpacity onPress={handlePayment} disabled={loading}
          style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 18, alignItems: 'center' }}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>Pay {formatINR(plan?.installmentAmountInr ?? 0)} with Razorpay</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
