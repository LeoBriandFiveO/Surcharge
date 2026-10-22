import { Tabs } from 'expo-router/js-tabs';
import { Text } from 'react-native';

import { colors } from '@/lib/theme';

function icon(emoji: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Séance', tabBarIcon: icon('🏋️') }} />
      <Tabs.Screen name="feed" options={{ title: 'Fil', tabBarIcon: icon('🔥') }} />
      <Tabs.Screen name="history" options={{ title: 'Progrès', tabBarIcon: icon('📈') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: icon('👤') }} />
    </Tabs>
  );
}
