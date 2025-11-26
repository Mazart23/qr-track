import React, { createContext, useContext, useState, useCallback } from 'react';

interface NavigationContextType {
  isNavigating: boolean;
  navigate: (callback: () => void) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);

  const navigate = useCallback((callback: () => void) => {
    if (isNavigating) return;
    setIsNavigating(true);
    callback();
    setTimeout(() => setIsNavigating(false), 500);
  }, [isNavigating]);

  return (
    <NavigationContext.Provider value={{ isNavigating, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
