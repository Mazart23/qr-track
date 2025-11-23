import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@theme';

type ThemeContextType = {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
};

const ThemeContext = createContext<ThemeContextType>({ theme: 'light', setTheme: () => {} });

export const ThemeProvider = ({ children }: { children: React.ReactNode | ((value: ThemeContextType) => React.ReactNode) }) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const saved = await AsyncStorage.getItem(THEME_KEY);
    if (saved) setThemeState(saved as 'light' | 'dark');
  };

  const setTheme = async (newTheme: 'light' | 'dark') => {
    await AsyncStorage.setItem(THEME_KEY, newTheme);
    setThemeState(newTheme);
  };

  const value = { theme, setTheme };

  return (
    <ThemeContext.Provider value={value}>
      {typeof children === 'function' ? children(value) : children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
