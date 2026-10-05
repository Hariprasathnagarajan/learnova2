import React from 'react';
import { View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'secondary' | 'outlined';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'secondary' }) => {
  const getBg = () => {
    switch (variant) {
      case 'elevated': return colors.surface.elevated;
      case 'secondary': return colors.surface.secondary;
      case 'outlined': return 'transparent';
      default: return colors.surface.secondary;
    }
  };

  return (
    <View
      style={[
        {
          backgroundColor: getBg(),
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
