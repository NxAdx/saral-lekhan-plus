import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../store/themeStore';
import { useBackupStore } from '../../store/backupStore';
import { BackupItem } from '../../services/backupService';
import { strings } from '../../i18n/strings';
import { useSettingsStore } from '../../store/settingsStore';

interface BackupVaultModalProps {
  visible: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const BackupVaultModal: React.FC<BackupVaultModalProps> = ({
  visible,
  onClose,
  onShowToast,
}) => {
  const { colors, font, radius, shadow } = useTheme();
  const language = useSettingsStore((s) => s.language);
  const loc = strings[language] || strings['En'];

  const { backups, isRestoring, restoreBackup, deleteBackup, shareBackup, loadBackups } = useBackupStore();
  const [confirmRestoreFile, setConfirmRestoreFile] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      loadBackups();
    }
  }, [visible]);

  if (!visible) return null;

  const handleRestore = async (filename: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const res = await restoreBackup(filename);
    setConfirmRestoreFile(null);
    if (res.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onShowToast(loc.settingsScreen?.restoreSuccess || 'Backup restored successfully!', 'success');
      onClose();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      onShowToast(res.error || 'Restore failed', 'error');
    }
  };

  const handleShare = async (filename: string) => {
    Haptics.selectionAsync();
    const res = await shareBackup(filename);
    if (!res.success && res.error) {
      onShowToast(res.error, 'error');
    }
  };

  const handleDelete = async (filename: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ok = await deleteBackup(filename);
    if (ok) {
      onShowToast(loc.settingsScreen?.backupDeleted || 'Backup deleted', 'success');
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.dialog,
            {
              backgroundColor: colors.bgRaised,
              borderColor: colors.stroke,
              borderRadius: radius.xl,
              ...shadow.hard,
              shadowColor: colors.shadow,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: colors.accentBg }]}>
              <Svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke={colors.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9 -9 9s-9 -1.8 -9 -9s1.8 -9 9 -9z" />
                <Path d="M12 7v5l3 3" />
              </Svg>
            </View>
            <Text style={[styles.title, { color: colors.ink, fontFamily: font.sansBold }]}>
              {loc.settingsScreen?.backupVaultTitle || 'Backup Vault History'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.inkDim, fontFamily: font.sans }]}>
              {loc.settingsScreen?.backupVaultDesc || 'Up to 5 automated snapshots retained safely on your device'}
            </Text>
          </View>

          {/* Confirmation for Restore */}
          {confirmRestoreFile ? (
            <View style={[styles.confirmBox, { backgroundColor: colors.bg, borderColor: colors.accent, borderRadius: radius.md }]}>
              <Text style={[styles.confirmTitle, { color: colors.ink, fontFamily: font.sansBold }]}>
                {loc.settingsScreen?.confirmRestoreTitle || 'Restore this backup?'}
              </Text>
              <Text style={[styles.confirmSub, { color: colors.inkMid, fontFamily: font.sans }]}>
                {loc.settingsScreen?.confirmRestoreSub || 'This will replace your current notes with the snapshot taken on this date.'}
              </Text>
              <View style={styles.confirmActions}>
                <Pressable
                  style={[styles.cancelBtn, { borderColor: colors.strokeDim, borderRadius: radius.sm }]}
                  onPress={() => setConfirmRestoreFile(null)}
                >
                  <Text style={{ color: colors.inkMid, fontFamily: font.sansSemi, fontSize: 13 }}>
                    {loc.editor?.cancel || 'Cancel'}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.confirmRestoreBtn, { backgroundColor: colors.accent, borderRadius: radius.sm }]}
                  onPress={() => handleRestore(confirmRestoreFile)}
                  disabled={isRestoring}
                >
                  <Text style={{ color: colors.white, fontFamily: font.sansBold, fontSize: 13 }}>
                    {isRestoring ? (loc.editor?.thinking || 'Restoring...') : (loc.settingsScreen?.restoreNow || 'Confirm Restore')}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* Backups List */}
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {backups.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptyText, { color: colors.inkDim, fontFamily: font.sans }]}>
                  {loc.settingsScreen?.noBackupsYet || 'No automated backups found yet. Backups will appear here as scheduled.'}
                </Text>
              </View>
            ) : (
              backups.map((item) => (
                <View
                  key={item.filename}
                  style={[
                    styles.backupRow,
                    {
                      backgroundColor: colors.bg,
                      borderColor: colors.strokeDim,
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <View style={styles.backupInfo}>
                    <Text style={[styles.backupDate, { color: colors.ink, fontFamily: font.sansBold }]}>
                      {item.displayDate}
                    </Text>
                    <Text style={[styles.backupMeta, { color: colors.inkDim, fontFamily: font.mono }]}>
                      {formatBytes(item.sizeBytes)} • SQLite
                    </Text>
                  </View>

                  <View style={styles.rowActions}>
                    {/* Share */}
                    <Pressable
                      style={[styles.actionBtn, { borderColor: colors.strokeDim }]}
                      onPress={() => handleShare(item.filename)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke={colors.inkMid} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-6" />
                        <Path d="M16 6l-4 -4l-4 4" />
                        <Path d="M12 2v13" />
                      </Svg>
                    </Pressable>

                    {/* Restore */}
                    <Pressable
                      style={[styles.restoreBtn, { backgroundColor: colors.accentBg, borderColor: colors.accent }]}
                      onPress={() => setConfirmRestoreFile(item.filename)}
                    >
                      <Text style={{ color: colors.accent, fontFamily: font.sansBold, fontSize: 12 }}>
                        {loc.settingsScreen?.restore || 'Restore'}
                      </Text>
                    </Pressable>

                    {/* Delete */}
                    <Pressable
                      style={[styles.actionBtn, { borderColor: colors.strokeDim }]}
                      onPress={() => handleDelete(item.filename)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke={colors.inkDim} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M4 7l16 0" />
                        <Path d="M10 11l0 6" />
                        <Path d="M14 11l0 6" />
                        <Path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                        <Path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                      </Svg>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: colors.bgDeep, borderColor: colors.strokeDim, borderRadius: radius.pill }]}
              onPress={onClose}
            >
              <Text style={[styles.closeBtnText, { color: colors.inkMid, fontFamily: font.sansSemi }]}>
                {loc.editor?.done || 'Done'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1.5,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  list: {
    maxHeight: 320,
  },
  listContent: {
    paddingVertical: 4,
    gap: 8,
  },
  backupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  backupInfo: {
    flex: 1,
    marginRight: 10,
  },
  backupDate: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 2,
  },
  backupMeta: {
    fontSize: 11,
    lineHeight: 16,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restoreBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBox: {
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 14,
  },
  confirmTitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  confirmSub: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  confirmRestoreBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  emptyWrap: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  footer: {
    marginTop: 14,
  },
  closeBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  closeBtnText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
