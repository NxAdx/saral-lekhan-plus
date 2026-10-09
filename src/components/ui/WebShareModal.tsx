import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, Platform, Clipboard } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../store/themeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { strings } from '../../i18n/strings';
import { ThemedModal } from './ThemedModal';
import {
  startWebShareServer,
  stopWebShareServer,
  getWebShareServerStatus,
  NetworkEndpointInfo,
} from '../../utils/webServer';

interface WebShareModalProps {
  visible: boolean;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

export function WebShareModal({ visible, onClose, onShowToast }: WebShareModalProps) {
  const { colors, font, radius, shadow, isDark } = useTheme();
  const language = useSettingsStore((s) => s.language);
  const loc = strings[language] || strings['En'];
  const [isRunning, setIsRunning] = useState(false);
  const [endpoints, setEndpoints] = useState<NetworkEndpointInfo[]>([]);
  const [primaryUrl, setPrimaryUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    const status = await getWebShareServerStatus();
    if (status && status.isRunning) {
      setIsRunning(true);
      setPrimaryUrl(status.primaryUrl);
      setEndpoints(status.endpoints || []);
    } else {
      setIsRunning(false);
      setPrimaryUrl(null);
      setEndpoints(status?.endpoints || []);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      checkStatus();
    }
  }, [visible, checkStatus]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (isRunning) {
        await stopWebShareServer();
        setIsRunning(false);
        setPrimaryUrl(null);
        setEndpoints([]);
        onShowToast('Web Share server stopped');
      } else {
        const state = await startWebShareServer(8085);
        if (state && state.isRunning) {
          setIsRunning(true);
          setPrimaryUrl(state.primaryUrl);
          setEndpoints(state.endpoints);
          onShowToast('Web Share Studio is live!');
        } else {
          onShowToast('Could not start server. Please check Wi-Fi or Hotspot.');
        }
      }
    } catch (e) {
      onShowToast('Error toggling Web Share');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (url: string) => {
    try {
      Clipboard.setString(url);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopiedUrl(url);
      onShowToast('Web address copied!');
      setTimeout(() => setCopiedUrl(null), 2500);
    } catch (e) {
      onShowToast('URL: ' + url);
    }
  };

  const customContent = (
    <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
        {/* Server Status Header Card */}
        <View
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.bgRaised,
            borderRadius: radius.md,
            padding: 16,
            borderWidth: 1,
            borderColor: isRunning ? 'rgba(16,185,129,0.3)' : colors.strokeDim,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: isRunning ? '#10b981' : '#64748b',
                  shadowColor: isRunning ? '#10b981' : 'transparent',
                  shadowOpacity: isRunning ? 0.8 : 0,
                  shadowRadius: 6,
                  elevation: isRunning ? 3 : 0,
                }}
              />
              <Text style={{ fontFamily: font.sansBold, fontSize: 14, color: isRunning ? '#10b981' : colors.inkDim }}>
                {isRunning ? 'Web Studio Online' : 'Server Offline'}
              </Text>
            </View>

            {isRunning && (
              <Pressable
                onPress={checkStatus}
                hitSlop={8}
                style={{ padding: 4 }}
                accessibilityLabel="Refresh addresses"
              >
                <Svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke={colors.inkDim} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -5v5h5" />
                  <Path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 5v-5h-5" />
                </Svg>
              </Pressable>
            )}
          </View>

          {isRunning ? (
            <Text style={{ fontFamily: font.sans, fontSize: 12.5, color: colors.inkMid, lineHeight: 17 }}>
              Open any web browser on your PC or tablet connected to your network to access your notes.
            </Text>
          ) : (
            <Text style={{ fontFamily: font.sans, fontSize: 12.5, color: colors.inkMid, lineHeight: 17 }}>
              Start the local server to edit and manage notes directly from your computer browser over Hotspot or Wi-Fi.
            </Text>
          )}
        </View>

        {/* URLs List */}
        {isRunning && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontFamily: font.sansBold, fontSize: 12, color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              Reachable Web Addresses
            </Text>

            {endpoints.length > 0 ? (
              endpoints.map((ep, idx) => {
                const url = `http://${ep.ip}:8085`;
                const isCopied = copiedUrl === url;
                const isHotspot = ep.type === 'hotspot';
                const isWifi = ep.type === 'wifi';

                return (
                  <Pressable
                    key={idx}
                    onPress={() => handleCopy(url)}
                    style={({ pressed }) => ({
                      backgroundColor: isDark ? '#141724' : '#f8fafc',
                      borderRadius: radius.md,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: isCopied ? colors.accent : colors.strokeDim,
                      marginBottom: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: pressed ? 0.8 : 1,
                      ...shadow.gentle,
                    })}
                    accessibilityLabel={`Copy ${ep.label} address`}
                  >
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <Text
                          style={{
                            fontFamily: font.sansBold,
                            fontSize: 10.5,
                            color: isHotspot ? '#f59e0b' : isWifi ? '#38bdf8' : colors.accent,
                            backgroundColor: isHotspot ? 'rgba(245,158,11,0.12)' : isWifi ? 'rgba(56,189,248,0.12)' : 'rgba(139,92,246,0.12)',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                            textTransform: 'uppercase',
                          }}
                        >
                          {ep.label}
                        </Text>
                      </View>
                      <Text
                        selectable={true}
                        style={{
                          fontFamily: font.mono || font.sansBold,
                          fontSize: 14.5,
                          color: colors.ink,
                          letterSpacing: 0.2,
                        }}
                      >
                        {url}
                      </Text>
                    </View>

                    <View
                      style={{
                        backgroundColor: isCopied ? colors.accent : colors.bgRaised,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: radius.sm,
                        borderWidth: 1,
                        borderColor: isCopied ? colors.accent : colors.strokeDim,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <Svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke={isCopied ? '#fff' : colors.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z" />
                        <Path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" />
                      </Svg>
                      <Text style={{ fontFamily: font.sansSemi, fontSize: 11.5, color: isCopied ? '#fff' : colors.ink }}>
                        {isCopied ? 'Copied' : 'Copy'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            ) : (
              <Pressable
                onPress={() => primaryUrl && handleCopy(primaryUrl)}
                style={{
                  backgroundColor: colors.bgRaised,
                  padding: 12,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.strokeDim,
                }}
              >
                <Text style={{ fontFamily: font.sansBold, fontSize: 15, color: colors.accent }}>{primaryUrl || 'http://127.0.0.1:8085'}</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* How-To Instructions */}
        <View
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : colors.bg,
            padding: 14,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.strokeDim,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontFamily: font.sansBold, fontSize: 13, color: colors.ink, marginBottom: 6 }}>
            Connection Modes:
          </Text>
          <Text style={{ fontFamily: font.sans, fontSize: 12, color: colors.inkMid, lineHeight: 18 }}>
            <Text style={{ fontFamily: font.sansBold, color: '#f59e0b' }}>Method 1 (Hotspot): </Text>
            Turn on Mobile Hotspot on this phone, connect your PC to the hotspot, and enter the Hotspot URL (e.g. <Text style={{ fontFamily: font.mono }}>192.168.43.1:8085</Text>).{'\n\n'}
            <Text style={{ fontFamily: font.sansBold, color: '#38bdf8' }}>Method 2 (Wi-Fi): </Text>
            Connect both your phone and PC to the same Wi-Fi network and open the Wi-Fi address.
          </Text>
        </View>

        {/* Toggle Button */}
        <Pressable
          onPress={handleToggle}
          disabled={loading}
          style={({ pressed }) => ({
            backgroundColor: isRunning ? colors.accentBg || '#3b1d28' : colors.accent,
            borderWidth: isRunning ? 1.5 : 0,
            borderColor: isRunning ? '#ef4444' : 'transparent',
            paddingVertical: 13,
            borderRadius: radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: loading ? 0.6 : pressed ? 0.9 : 1,
            ...shadow.gentle,
          })}
          accessibilityLabel={isRunning ? 'Stop Web Share Server' : 'Start Web Share Server'}
        >
          {loading ? (
            <ActivityIndicator color={isRunning ? '#ef4444' : '#fff'} size="small" />
          ) : (
            <Text
              style={{
                fontFamily: font.sansBold,
                fontSize: 14.5,
                color: isRunning ? '#ef4444' : '#ffffff',
              }}
            >
              {isRunning ? 'Stop Web Studio Server' : 'Start Web Share Studio'}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );

  return (
    <ThemedModal
      visible={visible}
      title="Web Share Studio"
      subtitle="Full-screen note editing on computer browser"
      customContent={customContent}
      actions={[
        {
          label: loc.editor?.done || 'Done',
          onPress: onClose,
          style: 'default',
        },
      ]}
      onClose={onClose}
    />
  );
}
