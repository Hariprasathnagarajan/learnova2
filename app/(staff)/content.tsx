import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCourses } from '../../src/queries/useCourses';
import { colors } from '../../src/theme/colors';

export default function StaffContentComposerScreen() {
  const router = useRouter();
  const { data: courses } = useCourses();
  const [contentType, setContentType] = useState<'material' | 'note'>('material');
  const [selectedCourse, setSelectedCourse] = useState(courses?.[0]?.id || 'course-1');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentMarkdown, setContentMarkdown] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    if (!title) {
      Alert.alert('Required', 'Please enter a title for this material.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Published', `New ${contentType} "${title}" has been published to course batch and notifications sent.`, [
        { text: 'OK', onPress: () => router.replace('/(staff)/dashboard') },
      ]);
    }, 700);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: 22, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
          Publish Learning Content
        </Text>
        <Text style={{ fontSize: 13, color: colors.text.muted, marginTop: 4 }}>
          Upload DRM-protected materials or markdown study notes
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Content Type Selector */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => setContentType('material')}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 12,
              backgroundColor: contentType === 'material' ? colors.primary : colors.surface.secondary,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: contentType === 'material' ? colors.primary : colors.border,
            }}
          >
            <Text style={{ color: contentType === 'material' ? '#fff' : colors.text.muted, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>
              📄 Protected PDF/Slide
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setContentType('note')}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 12,
              backgroundColor: contentType === 'note' ? colors.primary : colors.surface.secondary,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: contentType === 'note' ? colors.primary : colors.border,
            }}
          >
            <Text style={{ color: contentType === 'note' ? '#fff' : colors.text.muted, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>
              📝 Markdown Note
            </Text>
          </TouchableOpacity>
        </View>

        {/* Course Selector */}
        {courses && courses.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
              Select Course
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {courses.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setSelectedCourse(c.id)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: selectedCourse === c.id ? colors.accent : colors.surface.secondary,
                    borderWidth: 1,
                    borderColor: selectedCourse === c.id ? colors.accent : colors.border,
                  }}
                >
                  <Text style={{ color: selectedCourse === c.id ? '#080B14' : colors.text.secondary, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                    {c.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Title */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
            Resource Title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={contentType === 'material' ? 'e.g. Docker & Kubernetes Production Slides' : 'e.g. Lecture 4: Database Transactions & ACID'}
            placeholderTextColor={colors.text.muted}
            style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border }}
          />
        </View>

        {/* Description or Markdown Body */}
        {contentType === 'material' ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
              Material Description & Context
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Provide a brief explanation of how students should use this resource..."
              placeholderTextColor={colors.text.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border, minHeight: 100 }}
            />
          </View>
        ) : (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
              Markdown Content & Code Snippets
            </Text>
            <TextInput
              value={contentMarkdown}
              onChangeText={setContentMarkdown}
              placeholder="## Topic 1: Transactions&#10;```python&#10;with transaction.atomic():&#10;    # code here&#10;```"
              placeholderTextColor={colors.text.muted}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border, minHeight: 180, fontFamily: 'monospace' }}
            />
          </View>
        )}

        {/* Protection Note */}
        <View style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Ionicons name="lock-closed" size={18} color={colors.accent} />
          <Text style={{ color: colors.text.secondary, fontSize: 12, flex: 1, lineHeight: 18 }}>
            {"All uploaded materials are automatically protected under Learnova's DRM layer with dynamic student email watermarking."}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handlePublish}
          disabled={loading}
          style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 18, alignItems: 'center' }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>
              Publish Resource to Batch
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
