import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../../src/services/adminService';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../src/queries/queryKeys';
import { colors } from '../../../src/theme/colors';
import { formatINR } from '../../../src/utils/currencyUtils';
import { StaffPicker } from '../../../src/components/ui/StaffPicker';

const STEPS = [
  'Basics',
  'Description',
  'Media',
  'Instructor',
  'Schedule',
  'Pricing',
  'Publish',
];

export default function CreateCourseWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600');
  const [assignedStaffIds, setAssignedStaffIds] = useState<number[]>([]);
  const [instructorName, setInstructorName] = useState('Priya Nair');
  const [durationWeeks, setDurationWeeks] = useState('12');
  const [totalSessions, setTotalSessions] = useState('36');
  const [oneTimePrice, setOneTimePrice] = useState('14999');
  const [installmentAmount, setInstallmentAmount] = useState('5499');
  const [installments, setInstallments] = useState('3');
  const [status, setStatus] = useState<'published' | 'draft'>('published');

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    if (!title) {
      Alert.alert('Missing Field', 'Please enter a course title.');
      setCurrentStep(0);
      return;
    }
    setLoading(true);
    try {
      const price = parseInt(oneTimePrice, 10) || 14999;
      const emiPrice = parseInt(installmentAmount, 10) || 5499;
      const emiCount = parseInt(installments, 10) || 3;

      await adminService.createCourse({
        title,
        category,
        level,
        shortDescription: shortDesc || title,
        description: description || shortDesc || title,
        thumbnail,
        instructor: { id: assignedStaffIds[0] ? String(assignedStaffIds[0]) : 'user-staff-1', name: instructorName, bio: 'Faculty Member' },
        assigned_to: assignedStaffIds,
        assignedTo: assignedStaffIds,
        durationWeeks: parseInt(durationWeeks, 10) || 12,
        totalSessions: parseInt(totalSessions, 10) || 36,
        status,
        tags: [category, level],
        paymentPlans: [
          {
            id: `plan-${Date.now()}-a`,
            courseId: '',
            name: 'One-Time Payment',
            description: 'Full lifetime access & certificate',
            priceInr: price,
            currency: 'INR',
            planType: 'full',
            durationMonths: 0,
            duration: 'Lifetime',
            installments: 1,
            installmentAmountInr: price,
            features: ['Lifetime access', 'Certificate', 'Live class access'],
            isPopular: false,
          },
          {
            id: `plan-${Date.now()}-b`,
            courseId: '',
            name: 'Flexi EMI Plan',
            description: `${emiCount} monthly installments`,
            priceInr: emiPrice * emiCount,
            currency: 'INR',
            planType: 'emi',
            durationMonths: emiCount,
            duration: `${emiCount} months`,
            installments: emiCount,
            installmentAmountInr: emiPrice,
            features: ['Split into monthly installments', 'Instant enrollment'],
            isPopular: true,
          },
        ],
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.courses.list() });

      Alert.alert('Success', 'Course created and published successfully!', [
        { text: 'View Courses', onPress: () => router.replace('/(admin)/courses') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create course.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: colors.surface.primary, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
          Create New Course
        </Text>
        <Text style={{ fontSize: 13, color: colors.accent, marginTop: 2 }}>
          Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
        </Text>

        {/* Stepper Dots */}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 14 }}>
          {STEPS.map((s, idx) => (
            <View
              key={s}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: idx <= currentStep ? colors.accent : colors.surface.elevated,
              }}
            />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {/* Step 1: Basics */}
        {currentStep === 0 && (
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
                Course Title
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Master Cloud Engineering with AWS & Docker"
                placeholderTextColor={colors.text.muted}
                style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border }}
              />
            </View>

            <View>
              <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
                Category
              </Text>
              <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder="Web Development, Data Science, Mobile..."
                placeholderTextColor={colors.text.muted}
                style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border }}
              />
            </View>

            <View>
              <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
                Proficiency Level
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['beginner', 'intermediate', 'advanced'] as const).map((l) => (
                  <TouchableOpacity
                    key={l}
                    onPress={() => setLevel(l)}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor: level === l ? colors.accent : colors.surface.secondary,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: level === l ? colors.accent : colors.border,
                    }}
                  >
                    <Text style={{ color: level === l ? '#080B14' : colors.text.secondary, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', textTransform: 'capitalize' }}>
                      {l}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Step 2: Description */}
        {currentStep === 1 && (
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
                Short Headline / Tagline
              </Text>
              <TextInput
                value={shortDesc}
                onChangeText={setShortDesc}
                placeholder="Brief summary shown on course cards..."
                placeholderTextColor={colors.text.muted}
                style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border }}
              />
            </View>

            <View>
              <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
                Comprehensive Syllabus Description
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Full breakdown of topics, prerequisites, and learning outcomes..."
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border, minHeight: 140 }}
              />
            </View>
          </View>
        )}

        {/* Step 3: Media */}
        {currentStep === 2 && (
          <View style={{ gap: 16 }}>
            <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>
              Cover Thumbnail Image URL
            </Text>
            <TextInput
              value={thumbnail}
              onChangeText={setThumbnail}
              placeholder="https://..."
              placeholderTextColor={colors.text.muted}
              style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border }}
            />
            <Text style={{ color: colors.text.muted, fontSize: 12 }}>
              High-resolution 16:9 images recommended from Unsplash or S3.
            </Text>
          </View>
        )}

        {/* Step 4: Instructor / Staff Assignment */}
        {currentStep === 3 && (
          <View style={{ gap: 16 }}>
            <StaffPicker
              selectedIds={assignedStaffIds}
              onChange={setAssignedStaffIds}
              label="Assigned To"
              description="Select the Staff members responsible for managing this course."
              placeholder="Search and select staff..."
            />
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
                Primary Display Instructor Name (Optional)
              </Text>
              <TextInput
                value={instructorName}
                onChangeText={setInstructorName}
                placeholder="e.g. Priya Nair"
                placeholderTextColor={colors.text.muted}
                style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border }}
              />
              <Text style={{ color: colors.text.muted, fontSize: 12, marginTop: 6 }}>
                Assigned staff members will gain authorization to schedule live meetings and upload protected study materials.
              </Text>
            </View>
          </View>
        )}

        {/* Step 5: Schedule */}
        {currentStep === 4 && (
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
                Curriculum Duration (Weeks)
              </Text>
              <TextInput
                value={durationWeeks}
                onChangeText={setDurationWeeks}
                keyboardType="numeric"
                style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border }}
              />
            </View>

            <View>
              <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
                Total Live Sessions Planned
              </Text>
              <TextInput
                value={totalSessions}
                onChangeText={setTotalSessions}
                keyboardType="numeric"
                style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border }}
              />
            </View>
          </View>
        )}

        {/* Step 6: Pricing */}
        {currentStep === 5 && (
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
                One-Time Payment Price (₹ INR)
              </Text>
              <TextInput
                value={oneTimePrice}
                onChangeText={setOneTimePrice}
                keyboardType="numeric"
                style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border }}
              />
            </View>

            <View>
              <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
                Flexi EMI Monthly Installment (₹ INR)
              </Text>
              <TextInput
                value={installmentAmount}
                onChangeText={setInstallmentAmount}
                keyboardType="numeric"
                style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border }}
              />
            </View>

            <View>
              <Text style={{ color: colors.text.secondary, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
                Number of Installments
              </Text>
              <TextInput
                value={installments}
                onChangeText={setInstallments}
                keyboardType="numeric"
                style={{ backgroundColor: colors.surface.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border }}
              />
            </View>
          </View>
        )}

        {/* Step 7: Review & Publish */}
        {currentStep === 6 && (
          <View style={{ gap: 16 }}>
            <View style={{ backgroundColor: colors.surface.secondary, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontSize: 18, color: colors.text.primary, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 12 }}>
                Summary Review
              </Text>
              <Text style={{ color: colors.text.secondary, fontSize: 14, marginBottom: 6 }}>
                Title: <Text style={{ color: colors.text.primary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{title || 'Untitled'}</Text>
              </Text>
              <Text style={{ color: colors.text.secondary, fontSize: 14, marginBottom: 6 }}>
                Category: <Text style={{ color: colors.accent }}>{category}</Text> ({level})
              </Text>
              <Text style={{ color: colors.text.secondary, fontSize: 14, marginBottom: 6 }}>
                Duration: {durationWeeks} weeks • {totalSessions} live sessions
              </Text>
              <Text style={{ color: colors.text.secondary, fontSize: 14 }}>
                Pricing: {formatINR(parseInt(oneTimePrice, 10) || 0)} (or {formatINR(parseInt(installmentAmount, 10) || 0)}/mo × {installments})
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setStatus('draft')}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: status === 'draft' ? colors.surface.elevated : colors.surface.secondary,
                  borderWidth: 1,
                  borderColor: status === 'draft' ? colors.warning : colors.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: status === 'draft' ? colors.warning : colors.text.muted, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                  Save as Draft
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStatus('published')}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: status === 'published' ? colors.success + '22' : colors.surface.secondary,
                  borderWidth: 1,
                  borderColor: status === 'published' ? colors.success : colors.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: status === 'published' ? colors.success : colors.text.muted, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                  Publish Live
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Wizard Controls */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 32 }}>
          {currentStep > 0 && (
            <TouchableOpacity
              onPress={handlePrev}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 14,
                backgroundColor: colors.surface.secondary,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.text.primary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleNext}
            disabled={loading}
            style={{
              flex: 2,
              padding: 16,
              borderRadius: 14,
              backgroundColor: colors.accent,
              alignItems: 'center',
            }}
          >
            {loading ? (
              <ActivityIndicator color="#080B14" />
            ) : (
              <Text style={{ color: '#080B14', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>
                {currentStep === STEPS.length - 1 ? 'Publish Course' : 'Next Step →'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
