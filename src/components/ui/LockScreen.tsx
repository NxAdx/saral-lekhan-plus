import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../store/themeStore';
import { Svg, Path, Rect } from 'react-native-svg';
import { strings } from '../../i18n/strings';
import { useSettingsStore } from '../../store/settingsStore';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { shallow } from 'zustand/shallow';

export function LockScreen() {
    const { isBiometricEnabled, isUnlocked, unlockApp, setSupported } = useAuthStore();
    const theme = useTheme();
    const { language: lang } = useSettingsStore((s) => ({ language: s.language }), shallow);
    const loc = strings[lang] || strings['En'];
    const [errorText, setErrorText] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const colors = theme.colors;
    const font = theme.font;

    // Check support on mount
    useEffect(() => {
        const checkSupport = async () => {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            setSupported(compatible && enrolled);
        };
        checkSupport();
    }, []);

    const authenticate = async () => {
        if (isAuthenticating) return;

        console.log("LockScreen: authenticate triggered");
        setErrorText('');
        setIsAuthenticating(true);

        try {
            // Check if hardware is actually available right now
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                setErrorText("Biometrics not available on this device.");
                setIsAuthenticating(false);
                return;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: loc.lockScreen.authPrompt || 'Unlock Saral Lekhan',
                fallbackLabel: 'Use Passcode',
                disableDeviceFallback: false,
                cancelLabel: loc.editor.cancel,
            });

            if (result.success) {
                unlockApp();
            } else {
                // user canceled or failed
                setErrorText(loc.lockScreen.authFailed);
            }
        } catch (e) {
            console.warn(e);
            setErrorText(loc.lockScreen.authError);
        } finally {
            setIsAuthenticating(false);
        }
    };

    // Attempt auto-auth when this mounts and app is locked
    useEffect(() => {
        if (isBiometricEnabled && !isUnlocked) {
            // Small delay to ensure UI is ready
            const timer = setTimeout(() => {
                authenticate();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isBiometricEnabled, isUnlocked]);

    // If app is unlocked or lock is disabled, don't render anything
    if (!isBiometricEnabled || isUnlocked) return null;

    return (
        <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg, zIndex: 9999, justifyContent: 'center', alignItems: 'center' }]}
        >
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
                <View style={{
                    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.bgRaised,
                    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
                    borderWidth: 1.5, borderColor: colors.stroke
                }}>
                    <Svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke={colors.accent} strokeWidth={theme.strokeWidth?.sw ?? 2} strokeLinecap="round" strokeLinejoin="round">
                        <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </Svg>
                </View>
                <Text
                    style={{
                        fontFamily: lang === 'En' ? font.display : font.sansBold,
                        fontSize: 26,
                        lineHeight: 38,
                        color: colors.ink,
                        marginBottom: 8,
                        textAlign: 'center',
                        paddingHorizontal: 20,
                    }}
                    numberOfLines={1}
                >
                    {loc.lockScreen.vaultLocked}
                </Text>
                <Text style={{ fontFamily: font.sans, fontSize: 16, color: colors.inkDim, textAlign: 'center', paddingHorizontal: 20 }}>{loc.lockScreen.vaultSub}</Text>
            </View>

            {errorText ? (
                <Text style={{ fontFamily: font.mono, fontSize: 12, color: colors.accent, marginBottom: 24, paddingHorizontal: 20, textAlign: 'center' }}>{errorText}</Text>
            ) : <View style={{ height: 40 }} />}

            <Pressable
                onPress={() => {
                    console.log("LockScreen: Unlock button pressed");
                    authenticate();
                }}
                disabled={isAuthenticating}
                style={({ pressed }) => [{
                    backgroundColor: colors.accent,
                    paddingHorizontal: 32,
                    paddingVertical: 14,
                    borderRadius: theme.radius.pill,
                    opacity: (pressed || isAuthenticating) ? 0.8 : 1,
                    ...theme.shadow.soft
                }]}
            >
                <Text style={{ fontFamily: font.sansSemi, fontSize: 16, color: colors.white }}>
                    {isAuthenticating ? loc.plusFeatures.isSyncing : loc.lockScreen.unlockBtn}
                </Text>
            </Pressable>
        </Animated.View>
    );
}
