import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return colors.surface.elevated;
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.surface.secondary;
      case 'outline': return 'transparent';
      case 'accent': return colors.accent;
      case 'danger': return colors.error;
      default: return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.text.muted;
    switch (variant) {
      case 'primary': return '#FFFFFF';
      case 'secondary': return colors.text.primary;
      case 'outline': return colors.primary;
      case 'accent': return '#080B14';
      case 'danger': return '#FFFFFF';
      default: return '#FFFFFF';
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm': return { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 };
      case 'md': return { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12 };
      case 'lg': return { paddingVertical: 18, paddingHorizontal: 24, borderRadius: 14 };
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          backgroundColor: getBackgroundColor(),
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: colors.primary,
        },
        getPadding(),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              {
                color: getTextColor(),
                fontSize: size === 'sm' ? 13 : size === 'md' ? 15 : 16,
                fontFamily: 'PlusJakartaSans_700Bold',
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};
