import { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCourses } from '../../src/queries/useCourses';
import { colors } from '../../src/theme/colors';
import { formatINR, lowestEntryAmount } from '../../src/utils/currencyUtils';
import type { CourseLevel } from '../../src/types/course.types';

const CATEGORIES = ['All', 'Web Development', 'Data Science', 'Mobile Development'];
const LEVELS: (CourseLevel | 'all')[] = ['all', 'beginner', 'intermediate', 'advanced'];

export default function ExploreScreen() {
  const router = useRouter();
  const { data: courses, isLoading } = useCourses();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState<CourseLevel | 'all'>('all');

  const filtered = courses?.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = category === 'All' || c.category === category;
    const matchLevel = level === 'all' || c.level === level;
    return matchSearch && matchCategory && matchLevel;
  }) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Search Header */}
      <View style={{ padding: 24, paddingTop: 60, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: 22, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 16 }}>Explore Courses</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface.secondary, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border }}>
          <Ionicons name="search-outline" size={18} color={colors.text.muted} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search courses, topics..." placeholderTextColor={colors.text.muted}
            style={{ flex: 1, padding: 14, color: colors.text.primary, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, gap: 8 }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
              style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: category === cat ? colors.primary : colors.surface.secondary, borderWidth: 1, borderColor: category === cat ? colors.primary : colors.border }}>
              <Text style={{ color: category === cat ? '#fff' : colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Level Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 8, marginBottom: 16 }}>
          {LEVELS.map(l => (
            <TouchableOpacity key={l} onPress={() => setLevel(l)}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: level === l ? colors.accent + '22' : colors.surface.secondary, borderWidth: 1, borderColor: level === l ? colors.accent : colors.border }}>
              <Text style={{ color: level === l ? colors.accent : colors.text.muted, fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', textTransform: 'capitalize' }}>{l === 'all' ? 'All Levels' : l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results */}
        <View style={{ paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 13, color: colors.text.muted, marginBottom: 16 }}>{filtered.length} course{filtered.length !== 1 ? 's' : ''} found</Text>
          {isLoading ? <ActivityIndicator color={colors.primary} /> : filtered.map(course => (
            <TouchableOpacity key={course.id} onPress={() => router.push(`/(student)/course/${course.id}`)}
              style={{ backgroundColor: colors.surface.secondary, borderRadius: 16, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
              <Image source={{ uri: course.thumbnail }} style={{ width: '100%', height: 140 }} resizeMode="cover" />
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <View style={{ backgroundColor: colors.surface.elevated, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: colors.text.muted, fontSize: 11, textTransform: 'capitalize' }}>{course.level}</Text>
                  </View>
                  <View style={{ backgroundColor: colors.surface.elevated, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: colors.text.muted, fontSize: 11 }}>{course.durationWeeks}w</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 15, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 4 }} numberOfLines={2}>{course.title}</Text>
                <Text style={{ fontSize: 12, color: colors.text.muted, marginBottom: 12 }}>by {course.instructor.name}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 17, color: colors.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
                    from {formatINR(lowestEntryAmount(course.paymentPlans))}/mo
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.warning }}>⭐ {course.rating} ({course.ratingCount})</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
