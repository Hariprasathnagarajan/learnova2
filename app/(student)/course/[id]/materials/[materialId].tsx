import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenCapture from 'expo-screen-capture';
import { useAuthStore } from '../../../../../src/store/authStore';
import { materialService, type MaterialAccessResponse } from '../../../../../src/services/materialService';
import { colors } from '../../../../../src/theme/colors';

export default function ProtectedMaterialViewer() {
  const { materialId } = useLocalSearchParams<{ id: string; materialId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [accessData, setAccessData] = useState<MaterialAccessResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Enable screen capture prevention for protected educational assets
    const setupDrm = async () => {
      try {
        if (Platform.OS !== 'web') {
          await ScreenCapture.preventScreenCaptureAsync();
        }
      } catch (err) {
        console.warn('ScreenCapture protection not available in this environment:', err);
      }

      try {
        const data = await materialService.requestAccess(materialId || '');
        if (isMounted) {
          setAccessData(data);
        }
      } catch (err: any) {
        Alert.alert('Access Denied', err.message || 'Unable to load protected material.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    setupDrm();

    return () => {
      isMounted = false;
      if (Platform.OS !== 'web') {
        ScreenCapture.allowScreenCaptureAsync().catch(() => {});
      }
    };
  }, [materialId]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text.muted, marginTop: 14, fontSize: 13 }}>
          Verifying DRM authorization...
        </Text>
      </View>
    );
  }

  const material = accessData?.material;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Top Header */}
      <View
        style={{
          padding: 20,
          paddingTop: 60,
          backgroundColor: colors.surface.primary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          <Text style={{ color: colors.text.primary, fontSize: 16, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
            Protected Viewer
          </Text>
        </TouchableOpacity>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: colors.error + '22',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
          }}
        >
          <Ionicons name="shield-checkmark" size={14} color={colors.error} />
          <Text style={{ color: colors.error, fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold' }}>DRM PROTECTED</Text>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {/* Document Container with Security Watermark */}
        <View
          style={{
            backgroundColor: colors.surface.secondary,
            borderRadius: 16,
            padding: 24,
            borderWidth: 1,
            borderColor: colors.border,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Dynamic Watermark Stamp Overlay */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'space-around',
              alignItems: 'center',
              opacity: 0.12,
              transform: [{ rotate: '-25deg' }],
              pointerEvents: 'none',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', textAlign: 'center' }}>
              {accessData?.securityWatermark}
            </Text>
            <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', textAlign: 'center' }}>
              {accessData?.securityWatermark}
            </Text>
            <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', textAlign: 'center' }}>
              {accessData?.securityWatermark}
            </Text>
          </View>

          {/* Document Header */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Text style={{ fontSize: 28 }}>📄</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {material?.title}
                </Text>
                <Text style={{ fontSize: 12, color: colors.text.muted }}>
                  Encrypted stream token: {accessData?.viewerToken?.slice(0, 18)}...
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 14, color: colors.text.secondary, lineHeight: 22 }}>
              {material?.description}
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }} />

          {/* Viewer Preview Payload */}
          <View style={{ gap: 14 }}>
            <Text style={{ fontSize: 15, color: colors.text.primary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
              Section 1: Architecture Overview & Security Policies
            </Text>
            <Text style={{ fontSize: 13, color: colors.text.secondary, lineHeight: 21 }}>
              • All student interactions with core database schemas are mediated through signed Django ViewSets with TokenAuthentication.
            </Text>
            <Text style={{ fontSize: 13, color: colors.text.secondary, lineHeight: 21 }}>
              • Video session credentials are not rendered directly in mobile clients; reverse-proxy session tokens validate student enrollment state dynamically.
            </Text>
            <Text style={{ fontSize: 13, color: colors.text.secondary, lineHeight: 21 }}>
              • Razorpay webhook signatures are strictly evaluated before updating CourseEnrollment models.
            </Text>

            <View style={{ backgroundColor: colors.surface.elevated, borderRadius: 10, padding: 14, marginTop: 10 }}>
              <Text style={{ color: colors.accent, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, marginBottom: 4 }}>
                Key Takeaway for Final Examination
              </Text>
              <Text style={{ color: colors.text.secondary, fontSize: 12, lineHeight: 18 }}>
                Always maintain idempotency keys for payment validation and cache read-heavy course catalogs using Redis.
              </Text>
            </View>
          </View>
        </View>

        {/* Security Notice */}
        <View
          style={{
            marginTop: 20,
            backgroundColor: colors.surface.primary,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <Ionicons name="information-circle-outline" size={24} color={colors.text.muted} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text.secondary, fontSize: 12, lineHeight: 18 }}>
              Screenshots and screen sharing are deterred on physical mobile devices. This content is licensed exclusively to {user?.email}.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
