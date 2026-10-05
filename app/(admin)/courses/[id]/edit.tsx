import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCourse } from '../../../../src/queries/useCourses';
import { colors } from '../../../../src/theme/colors';

function EditCourseForm({ course, onBack }: { course: any; onBack: () => void }) {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>(course.status);

  const handleSave = () => {
    Alert.alert('Saved', 'Course configuration updated successfully.', [
      { text: 'OK', onPress: onBack },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
          Course Title
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border }}
        />
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
          Syllabus Description
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border, minHeight: 140 }}
        />
      </View>

      <View style={{ marginBottom: 28 }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
          Status
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['published', 'draft', 'archived'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setStatus(s)}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 10,
                backgroundColor: status === s ? colors.accent : colors.surface.secondary,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: status === s ? colors.accent : colors.border,
              }}
            >
              <Text style={{ color: status === s ? '#080B14' : colors.text.muted, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', textTransform: 'capitalize' }}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSave}
        style={{ backgroundColor: colors.accent, borderRadius: 14, padding: 18, alignItems: 'center' }}
      >
        <Text style={{ color: '#080B14', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>
          Save Modifications
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function EditCourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: course, isLoading } = useCourse(id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
          Edit Course
        </Text>
      </View>

      {isLoading || !course ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <EditCourseForm key={course.id} course={course} onBack={() => router.back()} />
      )}
    </View>
  );
}
