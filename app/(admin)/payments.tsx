import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { adminService } from '../../src/services/adminService';
import type { Payment } from '../../src/types/payment.types';
import { colors } from '../../src/theme/colors';
import { formatINR } from '../../src/utils/currencyUtils';
import { formatDate } from '../../src/utils/dateUtils';

export default function AdminPaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAllPayments().then((data) => {
      setPayments(data);
      setLoading(false);
    });
  }, []);

  const totalRevenue = payments.reduce((acc, p) => acc + (p.status === 'successful' ? p.amountInr : 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: 22, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
          Platform Payment Ledger
        </Text>
        <Text style={{ fontSize: 13, color: colors.accent, marginTop: 4 }}>
          Total Captured: {formatINR(totalRevenue)}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : payments.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>💳</Text>
            <Text style={{ fontSize: 16, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
              No payments recorded
            </Text>
          </View>
        ) : (
          payments.map((p) => (
            <View
              key={p.id}
              style={{
                backgroundColor: colors.surface.secondary,
                borderRadius: 16,
                padding: 18,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: colors.text.primary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                  {p.userId}
                </Text>
                <Text style={{ fontSize: 17, color: colors.success, fontFamily: 'PlusJakartaSans_700Bold' }}>
                  +{formatINR(p.amountInr)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: colors.text.muted }}>
                  {formatDate(p.createdAt)} • {p.gateway.toUpperCase()}
                </Text>

                <View style={{ backgroundColor: colors.success + '22', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: colors.success, fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', textTransform: 'uppercase' }}>
                    {p.status}
                  </Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 10 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: colors.text.muted }}>ID: {p.id}</Text>
                <TouchableOpacity onPress={() => Alert.alert('Payment Detail', `Gateway Order: ${p.orderId}\nPlan: ${p.planId ?? 'N/A'}`)}>
                  <Text style={{ color: colors.accent, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Inspect</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
