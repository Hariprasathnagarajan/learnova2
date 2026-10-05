import { useEffect, useState } from 'react';
import { View, Text, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function SplashScreen() {
  const router = useRouter();
  const [opacity] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(0.8));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
      Animated.spring(scale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: Platform.OS !== 'web' }),
    ]).start(() => {
      setTimeout(() => router.replace('/(auth)/login'), 1500);
    });
  }, [opacity, scale, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center' }}>
        <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 36, color: '#fff' }}>L</Text>
        </View>
        <Text style={{ fontSize: 32, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: -0.5 }}>
          Learnova
        </Text>
        <Text style={{ fontSize: 14, color: colors.text.muted, marginTop: 8, fontFamily: 'PlusJakartaSans_400Regular' }}>
          Learn Without Limits
        </Text>
      </Animated.View>
    </View>
  );
}
