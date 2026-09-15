import { Tabs } from 'expo-router';
import { colors } from '@/constants/theme';
import { navigationItems, NavigationItemId } from '@/constants/navigation';
import { NavigationProvider, useNavigationPreferences } from '@/context/NavigationContext';

const routes: NavigationItemId[] = ['home', 'courses', 'tasks', 'calendar', 'grades', 'inbox', 'files', 'ai', 'profile'];

function ConfigurableTabs() {
  const { items } = useNavigationPreferences();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.muted, tabBarStyle: { height: 82, paddingTop: 8, borderTopColor: colors.border, backgroundColor: colors.surface }, tabBarLabelStyle: { fontSize: 11, fontWeight: '600', paddingBottom: 8 } }}>
      {routes.map((id) => {
        const item = navigationItems[id];
        const Icon = item.icon;
        return <Tabs.Screen key={id} name={item.route} options={{ title: item.label, href: items.includes(id) ? undefined : null, tabBarIcon: ({ color, size }) => <Icon color={color} size={size} strokeWidth={2} /> }} />;
      })}
    </Tabs>
  );
}

export default function TabLayout() {
  return <NavigationProvider><ConfigurableTabs /></NavigationProvider>;
}
