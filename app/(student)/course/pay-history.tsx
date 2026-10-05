import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePaymentHistory } from '../../../src/queries/usePayments';
import { useCourses } from '../../../src/queries/useCourses';
import { colors } from '../../../src/theme/colors';
import { formatINR } from '../../../src/utils/currencyUtils';
import { formatDate } from '../../../src/utils/dateUtils';

export default function GlobalPaymentHistoryScreen() {
  const router = useRouter();
  const { data: payments, isLoading } = usePaymentHistory();
  const { data: courses } = useCourses();

  const totalSpent = payments?.reduce((acc, p) => acc + (p.status === 'successful' ? p.amountInr : 0), 0) || 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
          Payment History
        </Text>
        <Text style={{ fontSize: 13, color: colors.text.muted, marginTop: 4 }}>
          Total tuition invested: {formatINR(totalSpent)}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : payments?.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>💳</Text>
            <Text style={{ fontSize: 16, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>No transactions recorded</Text>
          </View>
        ) : (
          payments?.map((payment) => {
            const course = courses?.find((c) => c.id === payment.courseId);
            return (
              <View
                key={payment.id}
                style={{
                  backgroundColor: colors.surface.secondary,
                  borderRadius: 16,
                  padding: 18,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ fontSize: 15, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
                      {course?.title || 'Course Enrollment'}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.text.muted, marginTop: 2 }}>
                      Ref: {payment.id} • {formatDate(payment.createdAt)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 17, color: colors.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
                    {formatINR(payment.amountInr)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <View style={{ backgroundColor: colors.success + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: colors.success, fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold' }}>
                      PAID VIA {payment.gateway.toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Receipt', `Invoice for ${payment.id} sent to email.`)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Ionicons name="download-outline" size={14} color={colors.accent} />
                    <Text style={{ color: colors.accent, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Receipt</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
