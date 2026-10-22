import { Tabs } from 'expo-router/js-tabs';
import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { colors, radius } from '@/lib/theme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  const progress = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, { damping: 12, stiffness: 220 });
  }, [focused, progress]);

  const pill = useAnimatedStyle(() => ({
    backgroundColor: colors.accentSoft,
    opacity: progress.value,
    transform: [{ scaleX: 0.6 + progress.value * 0.4 }],
  }));
  const icon = useAnimatedStyle(() => ({
    opacity: 0.55 + progress.value * 0.45,
    transform: [{ scale: 1 + progress.value * 0.12 }, { translateY: -progress.value * 1 }],
  }));

  return (
    <Animated.View style={{ width: 56, height: 32, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius.lg }, pill]}
      />
      <Animated.View style={icon}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const icon = (emoji: string) =>
  function Icon({ focused }: { focused: boolean }) {
    return <TabIcon emoji={emoji} focused={focused} />;
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
        tabBarItemStyle: { paddingTop: 6 },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Séance', tabBarIcon: icon('🏋️') }} />
      <Tabs.Screen name="feed" options={{ title: 'Fil', tabBarIcon: icon('🔥') }} />
      <Tabs.Screen name="history" options={{ title: 'Progrès', tabBarIcon: icon('📈') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: icon('👤') }} />
    </Tabs>
  );
}
