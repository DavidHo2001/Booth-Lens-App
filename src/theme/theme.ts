import {MD3LightTheme} from 'react-native-paper';
import {DefaultTheme as NavigationDefaultTheme} from '@react-navigation/native';

export const boothLensColors = {
  background: '#EAFBFF',
  backgroundDeep: '#C7F4FF',
  primary: '#1B8FE8',
  primaryDark: '#0D4F80',
  secondary: '#54D6F7',
  accent: '#A7F7FF',
  surface: '#F8FEFF',
  surfaceSoft: '#DDF7FF',
  outline: '#9ADFF0',
  text: '#123047',
  muted: '#5E7E91',
};

export const appTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: boothLensColors.primary,
    secondary: boothLensColors.secondary,
    background: boothLensColors.background,
    surface: boothLensColors.surface,
    surfaceVariant: boothLensColors.surfaceSoft,
    outline: boothLensColors.outline,
    onSurface: boothLensColors.text,
    onBackground: boothLensColors.text,
  },
};

export const navigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: boothLensColors.primary,
    background: boothLensColors.background,
    card: boothLensColors.surface,
    text: boothLensColors.text,
    border: boothLensColors.outline,
    notification: boothLensColors.secondary,
  },
};

