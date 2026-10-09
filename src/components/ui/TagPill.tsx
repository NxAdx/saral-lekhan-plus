import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../store/themeStore';

interface TagPillProps {
  label: string;
  active?: boolean;
  icon?: React.ReactNode;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function TagPill({ label, active, icon, onPress }: TagPillProps) {
  const { colors, font, radius, hitSlop } = useTheme();
  const pressed = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(pressed.value ? 0.95 : 1, { duration: 100 }) }]
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      style={[
        styles.pill,
        icon ? styles.rowPill : null,
        {
          backgroundColor: active ? colors.accent : colors.bg,
          borderColor: active ? colors.accentDark : colors.stroke,
          borderRadius: radius.md,
        },
        animStyle
      ]}
      hitSlop={hitSlop}
    >
      {icon}
      <Text
        style={[
          styles.label,
          {
            color: active ? colors.white : colors.inkMid,
            fontFamily: font.sansSemi,
            fontSize: 12,
            lineHeight: 20,
            textAlignVertical: 'center',
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.8}
        maxFontSizeMultiplier={1.2}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 34,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
