import { useTheme } from '@/contexts/theme-context';

export const useColorScheme = () => {
  const { theme } = useTheme();
  return theme;
};
