import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCourseMaterials } from '../../../../src/queries/useCourses';
import { colors } from '../../../../src/theme/colors';
import { formatDate } from '../../../../src/utils/dateUtils';

const TYPE_ICONS: Record<string, string> = { pdf: '📄', video: '🎥', link: '🔗', image: '🖼️' };
const TYPE_COLORS: Record<string, string> = { pdf: '#EF4444', video: '#6366F1', link: '#22D3EE', image: '#22C55E' };

export default function MaterialsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: materials, isLoading } = useCourseMaterials(id);

  const handleAccess = (material: any) => {
    router.push(`/(student)/course/${id}/materials/${material.id}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 14 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>Course Materials</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> :
          materials?.map(m => (
            <TouchableOpacity key={m.id} onPress={() => handleAccess(m)}
              style={{ backgroundColor: colors.surface.secondary, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: (TYPE_COLORS[m.type] ?? colors.primary) + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24 }}>{TYPE_ICONS[m.type] ?? '📁'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text style={{ fontSize: 14, color: colors.text.primary, fontFamily: 'PlusJakartaSans_600SemiBold', flex: 1 }} numberOfLines={2}>{m.title}</Text>
                  {m.isProtected && <Ionicons name="lock-closed" size={14} color={colors.text.muted} />}
                </View>
                <Text style={{ fontSize: 12, color: colors.text.muted, lineHeight: 18 }} numberOfLines={2}>{m.description}</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
                  <Text style={{ fontSize: 11, color: colors.text.muted }}>{formatDate(m.uploadedAt)}</Text>
                  {m.sizeBytes && <Text style={{ fontSize: 11, color: colors.text.muted }}>{(m.sizeBytes / 1024 / 1024).toFixed(1)} MB</Text>}
                </View>
              </View>
            </TouchableOpacity>
          ))
        }
      </ScrollView>
    </View>
  );
}
