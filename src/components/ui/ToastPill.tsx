import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, StatusBar } from 'react-native';
import Animated, { 
    useAnimatedStyle, 
    useSharedValue, 
    withSpring, 
    withTiming, 
    runOnJS,
    withSequence,
    withDelay
} from 'react-native-reanimated';
import { useToastStore } from '../../store/toastStore';
import { useTheme } from '../../store/themeStore';
import { useTypography } from '../../store/typographyStore';
import { Svg, Path } from 'react-native-svg';

export function ToastPill() {
    const { visible, message, type, hideToast } = useToastStore();
    const theme = useTheme();
    const typeDef = useTypography();
    const { colors, font, radius, shadow } = theme;

    const translateY = useSharedValue(-100);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 200 });
            translateY.value = withSpring(0, { damping: 15, stiffness: 200 }, () => {
                // Wait 2.5 seconds, then hide
                translateY.value = withDelay(2500, withTiming(-100, { duration: 300 }, () => {
                    opacity.value = withTiming(0, { duration: 100 });
                    runOnJS(hideToast)();
                }));
            });
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
            opacity: opacity.value,
        };
    });

    if (!visible && opacity.value === 0) return null;

    let iconColor = colors.inkMid;
    if (type === 'success') {
        iconColor = colors.accent;
    } else if (type === 'error') {
        iconColor = '#E53E3E';
    }

    const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 16 : 60;

    return (
        <Animated.View style={[styles.container, { top: paddingTop }, animatedStyle]} pointerEvents="none">
            <View style={[styles.pill, { backgroundColor: colors.bgRaised, borderColor: colors.strokeDim, ...shadow.gentle, shadowColor: colors.shadow }]}>
                {type === 'success' ? (
                    <Svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={iconColor} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M20 6L9 17l-5-5" />
                    </Svg>
                ) : type === 'error' ? (
                    <Svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={iconColor} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M12 8v4M12 16h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                    </Svg>
                ) : (
                    <Svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={iconColor} strokeWidth={theme.strokeWidth.sw} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M12 16v-4M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                    </Svg>
                )}
                <Text style={[styles.text, { color: colors.ink, fontFamily: font.sansSemi }]} numberOfLines={2}>
                    {message}
                </Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
        elevation: 9999,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 99,
        borderWidth: 1,
        maxWidth: '85%',
    },
    text: {
        fontSize: 14,
        lineHeight: 20,
    }
});
