import { NativeModules, DeviceEventEmitter, EmitterSubscription, Platform } from 'react-native';
import { log } from '../utils/Logger';

const { GlanceNotificationModule } = NativeModules;

export interface GlanceNoteData {
  id: number;
  title: string;
  body: string;
}

export const glanceService = {
  isAvailable: (): boolean => {
    return Platform.OS === 'android' && !!GlanceNotificationModule;
  },

  hasPermission: async (): Promise<boolean> => {
    if (!GlanceNotificationModule) return false;
    try {
      return await GlanceNotificationModule.hasPermission();
    } catch (e) {
      log.warn('GlanceNotification permission check failed', e as any);
      return false;
    }
  },

  postGlanceNote: async (note: GlanceNoteData): Promise<boolean> => {
    if (!GlanceNotificationModule) return false;
    try {
      return await GlanceNotificationModule.postGlanceNote(note.id, note.title || '', note.body || '');
    } catch (e) {
      log.warn('Failed to post glance note', e as any);
      return false;
    }
  },

  clearGlanceNote: async (): Promise<boolean> => {
    if (!GlanceNotificationModule) return false;
    try {
      return await GlanceNotificationModule.clearGlanceNote();
    } catch (e) {
      log.warn('Failed to clear glance note', e as any);
      return false;
    }
  },

  isGlanceActive: async (): Promise<boolean> => {
    if (!GlanceNotificationModule) return false;
    try {
      return await GlanceNotificationModule.isGlanceActive();
    } catch (e) {
      return false;
    }
  },

  onMarkDone: (callback: (noteId: number) => void): EmitterSubscription | null => {
    if (Platform.OS !== 'android') return null;
    return DeviceEventEmitter.addListener('onGlanceMarkDone', (noteId: number) => {
      callback(noteId);
    });
  },

  onDismissed: (callback: (noteId: number) => void): EmitterSubscription | null => {
    if (Platform.OS !== 'android') return null;
    return DeviceEventEmitter.addListener('onGlanceDismissed', (noteId: number) => {
      callback(noteId);
    });
  },
};

