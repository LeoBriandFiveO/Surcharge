import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { initials } from '@/lib/format';
import { colors, radius, space } from '@/lib/theme';

export function Screen({
  children,
  scroll = true,
  edges = ['top'],
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: ('top' | 'bottom')[];
}) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <Animated.Text entering={FadeInDown.duration(350)} style={[styles.title, style]}>
      {children}
    </Animated.Text>
  );
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Muted({ style, ...props }: TextProps) {
  return <Text style={[styles.muted, style]} {...props} />;
}

export function Body({ style, ...props }: TextProps) {
  return <Text style={[styles.body, style]} {...props} />;
}

export function Card({
  children,
  style,
  onPress,
  index,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  // Position dans une liste : la carte apparaît en cascade.
  index?: number;
}) {
  const content = onPress ? (
    <Pressable_ onPress={onPress} style={[styles.card, style]}>
      {children}
    </Pressable_>
  ) : (
    <View style={[styles.card, style]}>{children}</View>
  );
  if (index === undefined) return content;
  return <Appear index={index}>{content}</Appear>;
}

// Apparition douce en glissant vers le haut, décalée selon la position dans la liste.
export function Appear({ children, index = 0 }: { children: ReactNode; index?: number }) {
  return (
    <Animated.View entering={FadeInDown.duration(380).delay(Math.min(index, 8) * 60).springify().damping(18)}>
      {children}
    </Animated.View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Pressable qui s'enfonce légèrement sous le doigt.
export function Pressable_({
  children,
  onPress,
  disabled,
  style,
  pressedScale = 0.97,
}: {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
}) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(pressedScale, { damping: 20, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 300 });
      }}
      style={[style, animated]}>
      {children}
    </AnimatedPressable>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = {
    primary: colors.accent,
    secondary: colors.cardAlt,
    ghost: 'transparent',
    danger: 'transparent',
  }[variant];
  const fg = { primary: '#fff', secondary: colors.text, ghost: colors.accent, danger: colors.danger }[
    variant
  ];
  return (
    <Pressable_
      onPress={onPress}
      disabled={disabled || loading}
      pressedScale={0.95}
      style={[styles.button, { backgroundColor: bg, opacity: disabled ? 0.4 : 1 }, style]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
      )}
    </Pressable_>
  );
}

export function Input({ label, style, ...props }: TextInputProps & { label?: string }) {
  return (
    <View style={{ gap: space.xs }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <View
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ color: colors.accent, fontWeight: '700', fontSize: size * 0.38 }}>
        {initials(name)}
      </Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Card style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.xl }}>
      <Body style={{ fontWeight: '600' }}>{title}</Body>
      {children}
    </Card>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Muted style={{ fontSize: 12 }}>{label}</Muted>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: space.sm },
  body: { color: colors.text, fontSize: 16 },
  muted: { color: colors.muted, fontSize: 14 },
  label: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  input: {
    backgroundColor: colors.cardAlt,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  avatar: { backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '700' },
});
