import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackupService, BackupItem } from '../services/backupService';
import { useNotesStore } from './notesStore';
import { log } from '../utils/Logger';

export type AutoBackupInterval = 'daily' | 'two_days' | 'weekly' | 'off';

interface BackupState {
    autoBackupInterval: AutoBackupInterval;
    lastAutoBackupTime: number | null;
    backups: BackupItem[];
    isBackingUp: boolean;
    isRestoring: boolean;
    lastError: string | null;

    setAutoBackupInterval: (interval: AutoBackupInterval) => void;
    loadBackups: () => Promise<void>;
    checkAndRunAutoBackup: () => Promise<boolean>;
    createManualBackup: () => Promise<{ success: boolean; item?: BackupItem; error?: string }>;
    restoreBackup: (filename: string) => Promise<{ success: boolean; error?: string }>;
    deleteBackup: (filename: string) => Promise<boolean>;
    shareBackup: (filename: string) => Promise<{ success: boolean; error?: string }>;
}

const INTERVAL_MS: Record<AutoBackupInterval, number> = {
    daily: 24 * 60 * 60 * 1000,
    two_days: 48 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    off: Infinity,
};

export const useBackupStore = create<BackupState>()(
    persist(
        (set, get) => ({
            autoBackupInterval: 'daily',
            lastAutoBackupTime: null,
            backups: [],
            isBackingUp: false,
            isRestoring: false,
            lastError: null,

            setAutoBackupInterval: (interval: AutoBackupInterval) => {
                set({ autoBackupInterval: interval });
                log.info('BackupStore', `Auto-backup interval set to: ${interval}`);
            },

            loadBackups: async () => {
                try {
                    const list = await BackupService.listAutoBackups();
                    set({ backups: list });
                } catch (e: any) {
                    log.error('BackupStore.loadBackups', e);
                }
            },

            /**
             * Checks if an automated backup is due based on the chosen interval and executes it silently.
             * Safe to call on every app launch and foreground resume.
             */
            checkAndRunAutoBackup: async () => {
                const { autoBackupInterval, lastAutoBackupTime, isBackingUp } = get();
                if (autoBackupInterval === 'off' || isBackingUp) {
                    return false;
                }

                const requiredInterval = INTERVAL_MS[autoBackupInterval];
                const now = Date.now();

                // If never backed up, or interval has passed
                const isDue = !lastAutoBackupTime || (now - lastAutoBackupTime >= requiredInterval);
                if (!isDue) {
                    return false;
                }

                log.info('BackupStore', `Auto-backup is due (interval: ${autoBackupInterval}). Executing...`);
                set({ isBackingUp: true, lastError: null });

                try {
                    const res = await BackupService.createAutoBackup();
                    if (res.success && res.item) {
                        const list = await BackupService.listAutoBackups();
                        set({
                            lastAutoBackupTime: now,
                            backups: list,
                            isBackingUp: false,
                        });
                        return true;
                    } else {
                        set({ isBackingUp: false, lastError: res.error || 'Failed' });
                        return false;
                    }
                } catch (e: any) {
                    log.error('BackupStore.checkAndRunAutoBackup', e);
                    set({ isBackingUp: false, lastError: e?.message || 'Unexpected error' });
                    return false;
                }
            },

            createManualBackup: async () => {
                set({ isBackingUp: true, lastError: null });
                try {
                    const res = await BackupService.createAutoBackup();
                    if (res.success && res.item) {
                        const list = await BackupService.listAutoBackups();
                        set({
                            lastAutoBackupTime: Date.now(),
                            backups: list,
                            isBackingUp: false,
                        });
                        return res;
                    } else {
                        set({ isBackingUp: false, lastError: res.error || 'Failed' });
                        return res;
                    }
                } catch (e: any) {
                    set({ isBackingUp: false, lastError: e?.message });
                    return { success: false, error: e?.message };
                }
            },

            restoreBackup: async (filename: string) => {
                set({ isRestoring: true, lastError: null });
                try {
                    const res = await BackupService.restoreAutoBackup(filename);
                    if (res.success) {
                        // Reset notes store to immediately reload from restored database
                        useNotesStore.getState().resetDB();
                        set({ isRestoring: false });
                        return { success: true };
                    } else {
                        set({ isRestoring: false, lastError: res.error || 'Restore failed' });
                        return res;
                    }
                } catch (e: any) {
                    set({ isRestoring: false, lastError: e?.message });
                    return { success: false, error: e?.message };
                }
            },

            deleteBackup: async (filename: string) => {
                const ok = await BackupService.deleteAutoBackup(filename);
                if (ok) {
                    const list = await BackupService.listAutoBackups();
                    set({ backups: list });
                }
                return ok;
            },

            shareBackup: async (filename: string) => {
                return await BackupService.shareBackup(filename);
            },
        }),
        {
            name: 'saral-lekhan-backup-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                autoBackupInterval: state.autoBackupInterval,
                lastAutoBackupTime: state.lastAutoBackupTime,
            }),
        }
    )
);
