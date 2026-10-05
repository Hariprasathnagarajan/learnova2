import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../../src/services/adminService';
import { colors } from '../../../src/theme/colors';

export default function CreateStaffScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Staff@123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email) {
      Alert.alert('Validation Error', 'Please complete all required fields.');
      return;
    }
    setLoading(true);
    try {
      await adminService.createStaff({ firstName, lastName, email, password });
      Alert.alert('Staff Created', `Staff instructor account for ${firstName} created successfully.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create staff account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
          Add Faculty / Staff
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
            First Name
          </Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="e.g. Priya"
            placeholderTextColor={colors.text.muted}
            style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border }}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
            Last Name
          </Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="e.g. Nair"
            placeholderTextColor={colors.text.muted}
            style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border }}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
            Institutional Email
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="priya@learnova.app"
            placeholderTextColor={colors.text.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border }}
          />
        </View>

        <View style={{ marginBottom: 28 }}>
          <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
            Default Temporary Password
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Staff@123"
            placeholderTextColor={colors.text.muted}
            secureTextEntry
            style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border }}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: colors.accent,
            borderRadius: 14,
            padding: 18,
            alignItems: 'center',
          }}
        >
          {loading ? (
            <ActivityIndicator color="#080B14" />
          ) : (
            <Text style={{ color: '#080B14', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>
              Create Staff Account
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
