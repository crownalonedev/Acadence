import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { defaultNavigation, NavigationItemId } from '@/constants/navigation';

type NavigationContextValue = {
  items: NavigationItemId[];
  setItems: (items: NavigationItemId[]) => void;
  reset: () => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<NavigationItemId[]>(defaultNavigation);
  const value = useMemo(() => ({ items, setItems, reset: () => setItems(defaultNavigation) }), [items]);
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigationPreferences() {
  const value = useContext(NavigationContext);
  if (!value) throw new Error('useNavigationPreferences must be used inside NavigationProvider');
  return value;
}
