/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#080B14',
        surface: {
          primary: '#101625',
          secondary: '#151D30',
          elevated: '#192238',
        },
        border: '#202A3D',
        primary: {
          DEFAULT: '#6366F1',
          pressed: '#5558E8',
        },
        accent: '#22D3EE',
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#38BDF8',
      },
      fontFamily: {
        regular: ['PlusJakartaSans_400Regular'],
        medium: ['PlusJakartaSans_500Medium'],
        semibold: ['PlusJakartaSans_600SemiBold'],
        bold: ['PlusJakartaSans_700Bold'],
      },
    },
  },
  plugins: [],
};
