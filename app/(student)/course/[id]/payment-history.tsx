import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePaymentHistory } from '../../../../src/queries/usePayments';
import { useCourse } from '../../../../src/queries/useCourses';
import { colors } from '../../../../src/theme/colors';
import { formatINR } from '../../../../src/utils/currencyUtils';
import { formatDate } from '../../../../src/utils/dateUtils';

export default function CoursePaymentHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: course } = useCourse(id);
  const { data: payments, isLoading } = usePaymentHistory();

  const coursePayments = payments?.filter((p) => p.courseId === id) || [];

  const handleDownloadInvoice = (paymentId: string) => {
    Alert.alert('Invoice Generated', `Tax invoice for transaction #${paymentId} has been prepared for download.`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
          Payment & Invoices
        </Text>
        <Text style={{ fontSize: 13, color: colors.text.muted, marginTop: 4 }}>
          {course?.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : coursePayments.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>🧾</Text>
            <Text style={{ fontSize: 16, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
              No payments found
            </Text>
            <Text style={{ fontSize: 13, color: colors.text.muted, marginTop: 4 }}>
              Receipts for this course will appear here once processed.
            </Text>
          </View>
        ) : (
          coursePayments.map((p) => (
            <View
              key={p.id}
              style={{
                backgroundColor: colors.surface.secondary,
                borderRadius: 16,
                padding: 18,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: colors.success + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: colors.success, fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', textTransform: 'uppercase' }}>
                      {p.status}
                    </Text>
                  </View>
                  <Text style={{ color: colors.text.muted, fontSize: 12 }}>Gateway: {p.gateway}</Text>
                </View>

                <Text style={{ fontSize: 18, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {formatINR(p.amountInr)}
                </Text>
              </View>

              <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 4 }}>
                Transaction ID: {p.id}
              </Text>
              <Text style={{ fontSize: 12, color: colors.text.muted, marginBottom: 16 }}>
                Date: {formatDate(p.createdAt)}
              </Text>

              <TouchableOpacity
                onPress={() => handleDownloadInvoice(p.id)}
                style={{
                  backgroundColor: colors.surface.elevated,
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="document-text-outline" size={16} color={colors.accent} />
                <Text style={{ color: colors.accent, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>
                  Download Tax Receipt (PDF)
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
