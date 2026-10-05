import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCourseNotes } from '../../../../src/queries/useCourses';
import { colors } from '../../../../src/theme/colors';
import { formatDate } from '../../../../src/utils/dateUtils';

export default function NotesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: notes, isLoading } = useCourseNotes(id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 14 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>Course Notes</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> :
          notes?.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 16 }}>📝</Text>
              <Text style={{ fontSize: 16, color: colors.text.primary, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 8 }}>No notes yet</Text>
              <Text style={{ fontSize: 13, color: colors.text.muted, textAlign: 'center' }}>Notes from your sessions will appear here</Text>
            </View>
          ) :
          notes?.map(note => (
            <View key={note.id} style={{ backgroundColor: colors.surface.secondary, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 15, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', flex: 1 }}>{note.title}</Text>
                <Text style={{ fontSize: 12, color: colors.text.muted }}>{formatDate(note.updatedAt)}</Text>
              </View>
              {/* Render markdown content as plain text preview */}
              <Text style={{ fontSize: 13, color: colors.text.secondary, lineHeight: 20 }} numberOfLines={5}>
                {note.content.replace(/[#*`]/g, '').trim()}
              </Text>
              <View style={{ marginTop: 12, backgroundColor: colors.surface.elevated, borderRadius: 8, padding: 12 }}>
                <Text style={{ fontSize: 12, color: colors.text.muted, fontFamily: 'PlusJakartaSans_500Medium' }}>Full markdown content available — connect to WebView for rendering</Text>
              </View>
            </View>
          ))
        }
      </ScrollView>
    </View>
  );
}
