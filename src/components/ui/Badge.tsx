import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'muted';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'primary': return { bg: colors.primary + '22', text: colors.primary, border: colors.primary + '44' };
      case 'accent': return { bg: colors.accent + '22', text: colors.accent, border: colors.accent + '44' };
      case 'success': return { bg: colors.success + '22', text: colors.success, border: colors.success + '44' };
      case 'warning': return { bg: colors.warning + '22', text: colors.warning, border: colors.warning + '44' };
      case 'error': return { bg: colors.error + '22', text: colors.error, border: colors.error + '44' };
      default: return { bg: colors.surface.elevated, text: colors.text.muted, border: colors.border };
    }
  };

  const c = getColors();

  return (
    <View
      style={[
        {
          backgroundColor: c.bg,
          borderColor: c.border,
          borderWidth: 1,
          borderRadius: 6,
          paddingHorizontal: size === 'sm' ? 6 : 8,
          paddingVertical: size === 'sm' ? 2 : 4,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text
        style={[
          {
            color: c.text,
            fontSize: size === 'sm' ? 10 : 11,
            fontFamily: 'PlusJakartaSans_700Bold',
            textTransform: 'uppercase',
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};
