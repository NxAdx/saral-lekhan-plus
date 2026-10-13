import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { log } from '../utils/Logger';

export interface BackupItem {
    filename: string;
    uri: string;
    sizeBytes: number;
    timestamp: number;
    displayDate: string;
}

const DB_NAME = 'saral_lekhan.db';
const SQLITE_DIR = `${FileSystem.documentDirectory}SQLite`;
const DB_PATH = `${SQLITE_DIR}/${DB_NAME}`;
const BACKUPS_DIR = `${FileSystem.documentDirectory}Backups/`;
const MAX_BACKUPS_RETAINED = 5;
const BACKUP_PREFIX = 'SaralLekhan_AutoBackup_';

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const BackupService = {
    getBackupsDirectory(): string {
        return BACKUPS_DIR;
    },

    async ensureBackupsDir(): Promise<void> {
        const dirInfo = await FileSystem.getInfoAsync(BACKUPS_DIR);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(BACKUPS_DIR, { intermediates: true });
        }
    },

    /**
     * Creates an automated snapshot of the SQLite database and rotates old backups (keeps max 5).
     * Derived from Mihon's BackupCreator rotation algorithm.
     */
    async createAutoBackup(): Promise<{ success: boolean; item?: BackupItem; error?: string }> {
        try {
            const dbInfo = await FileSystem.getInfoAsync(DB_PATH);
            if (!dbInfo.exists) {
                return { success: false, error: 'Source database file does not exist.' };
            }

            await this.ensureBackupsDir();

            const now = new Date();
            const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `${BACKUP_PREFIX}${dateStr}.db`;
            const destPath = `${BACKUPS_DIR}${filename}`;

            // Atomic copy of the database file
            await FileSystem.copyAsync({ from: DB_PATH, to: destPath });

            const backupInfo = await FileSystem.getInfoAsync(destPath);
            const sizeBytes = backupInfo.exists && 'size' in backupInfo ? (backupInfo.size ?? 0) : 0;

            const newItem: BackupItem = {
                filename,
                uri: destPath,
                sizeBytes,
                timestamp: now.getTime(),
                displayDate: now.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                }),
            };

            // Mihon Pattern: Rotate older backups (drop all after MAX_BACKUPS_RETAINED - 1)
            await this.pruneOldBackups();

            log.info('BackupService', `Automated backup created successfully: ${filename} (${formatFileSize(sizeBytes)})`);
            return { success: true, item: newItem };
        } catch (e: any) {
            log.error('BackupService.createAutoBackup', e);
            return { success: false, error: e?.message || 'Failed to create backup.' };
        }
    },

    /**
     * Lists existing auto-backups sorted from newest to oldest.
     */
    async listAutoBackups(): Promise<BackupItem[]> {
        try {
            await this.ensureBackupsDir();
            const files = await FileSystem.readDirectoryAsync(BACKUPS_DIR);
            const backupFiles = files.filter(f => f.startsWith(BACKUP_PREFIX) && f.endsWith('.db'));

            const items: BackupItem[] = [];

            for (const file of backupFiles) {
                const uri = `${BACKUPS_DIR}${file}`;
                const info = await FileSystem.getInfoAsync(uri);
                if (info.exists) {
                    const sizeBytes = 'size' in info ? (info.size ?? 0) : 0;
                    const modificationTime = 'modificationTime' in info && info.modificationTime ? info.modificationTime * 1000 : Date.now();
                    const d = new Date(modificationTime);

                    items.push({
                        filename: file,
                        uri,
                        sizeBytes,
                        timestamp: modificationTime,
                        displayDate: d.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                    });
                }
            }

            // Sort newest first
            items.sort((a, b) => b.timestamp - a.timestamp);
            return items;
        } catch (e: any) {
            log.error('BackupService.listAutoBackups', e);
            return [];
        }
    },

    /**
     * Prunes old backups to ensure only the latest MAX_BACKUPS_RETAINED remain on disk.
     */
    async pruneOldBackups(): Promise<void> {
        try {
            const backups = await this.listAutoBackups();
            if (backups.length > MAX_BACKUPS_RETAINED) {
                const toDelete = backups.slice(MAX_BACKUPS_RETAINED);
                for (const item of toDelete) {
                    await FileSystem.deleteAsync(item.uri, { idempotent: true });
                    log.info('BackupService', `Pruned older backup: ${item.filename}`);
                }
            }
        } catch (e) {
            log.error('BackupService.pruneOldBackups', e);
        }
    },

    /**
     * Restores the database from a selected backup file.
     */
    async restoreAutoBackup(filename: string): Promise<{ success: boolean; error?: string }> {
        try {
            const sourcePath = `${BACKUPS_DIR}${filename}`;
            const fileInfo = await FileSystem.getInfoAsync(sourcePath);
            if (!fileInfo.exists) {
                return { success: false, error: 'Backup file does not exist.' };
            }

            const sqliteDirInfo = await FileSystem.getInfoAsync(SQLITE_DIR);
            if (!sqliteDirInfo.exists) {
                await FileSystem.makeDirectoryAsync(SQLITE_DIR, { intermediates: true });
            }

            // Safely overwrite the active database
            await FileSystem.copyAsync({ from: sourcePath, to: DB_PATH });
            log.info('BackupService', `Restored database from ${filename}`);
            return { success: true };
        } catch (e: any) {
            log.error('BackupService.restoreAutoBackup', e);
            return { success: false, error: e?.message || 'Restore failed.' };
        }
    },

    /**
     * Deletes a specific backup snapshot.
     */
    async deleteAutoBackup(filename: string): Promise<boolean> {
        try {
            const path = `${BACKUPS_DIR}${filename}`;
            await FileSystem.deleteAsync(path, { idempotent: true });
            return true;
        } catch (e) {
            log.error('BackupService.deleteAutoBackup', e);
            return false;
        }
    },

    /**
     * Shares a backup file via the native system share sheet.
     */
    async shareBackup(filename: string): Promise<{ success: boolean; error?: string }> {
        try {
            const path = `${BACKUPS_DIR}${filename}`;
            const info = await FileSystem.getInfoAsync(path);
            if (!info.exists) {
                return { success: false, error: 'Backup file not found.' };
            }

            if (!(await Sharing.isAvailableAsync())) {
                return { success: false, error: 'Sharing is not supported on this device.' };
            }

            await Sharing.shareAsync(path, {
                dialogTitle: 'Export Saral Lekhan Backup',
                mimeType: 'application/x-sqlite3',
                UTI: 'public.database',
            });
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e?.message || 'Failed to share backup.' };
        }
    },
};
