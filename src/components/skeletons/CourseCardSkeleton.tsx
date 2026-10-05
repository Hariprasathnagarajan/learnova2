import React from 'react';
import { View } from 'react-native';
import { colors } from '../../theme/colors';

export const CourseCardSkeleton: React.FC = () => {
  return (
    <View
      style={{
        backgroundColor: colors.surface.secondary,
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ width: '100%', height: 140, backgroundColor: colors.surface.elevated }} />
      <View style={{ padding: 16, gap: 10 }}>
        <View style={{ width: 80, height: 16, borderRadius: 4, backgroundColor: colors.surface.elevated }} />
        <View style={{ width: '80%', height: 20, borderRadius: 4, backgroundColor: colors.surface.elevated }} />
        <View style={{ width: '50%', height: 16, borderRadius: 4, backgroundColor: colors.surface.elevated }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <View style={{ width: 100, height: 22, borderRadius: 4, backgroundColor: colors.surface.elevated }} />
          <View style={{ width: 60, height: 18, borderRadius: 4, backgroundColor: colors.surface.elevated }} />
        </View>
      </View>
    </View>
  );
};
