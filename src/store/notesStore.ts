import { create } from 'zustand';
import * as SQLite from 'expo-sqlite';
import { log } from '../utils/Logger';
import type { SyncStatus } from '../types/note';
import { glanceService } from '../services/glanceService';

// Open (or create) the SQLite database
const DB_NAME = 'saral_lekhan.db';
let db = SQLite.openDatabase(DB_NAME);

async function reopenDatabaseConnection() {
  try {
    if ((db as any)?.closeAsync) {
      await (db as any).closeAsync();
    }
  } catch (error) {
    // Ignore close errors and still attempt to reopen.
    log.warn("SQLite close before reopen failed", error as any);
  }
  db = SQLite.openDatabase(DB_NAME);
}

// ─── Note Interface (enriched with simple-notes-sync fields) ───────────
export interface Note {
  id: number;
  title: string;
  body: string;
  tag: string;
  created_at: number;
  updated_at: number;
  pinned: boolean;
  is_deleted: boolean;
  // ─── New fields (Phase 1) ────────────────────────────────────────────
  folder_name: string | null;
  sync_status: SyncStatus;
  labels: string[] | null;
  is_glance?: boolean;
}

const ALL_TAG = '__all__';
export const ALL_TAG_ID = ALL_TAG;
const ALL_FOLDER = '__all__';
export const ALL_FOLDER_ID = ALL_FOLDER;

// ─── Safe column migration list ────────────────────────────────────────
// Each entry is a column that should exist. The migrator will check each
// one via pragma_table_info and ADD it if missing. This is the same pattern
// we already used for `is_deleted`, but generalized to many columns.
const REQUIRED_COLUMNS: { name: string; definition: string }[] = [
  { name: 'is_deleted',      definition: 'INTEGER DEFAULT 0' },
  { name: 'folder_name',     definition: 'TEXT DEFAULT NULL' },
  { name: 'sync_status',     definition: "TEXT DEFAULT 'local_only'" },
  { name: 'labels',          definition: 'TEXT DEFAULT NULL' },
  { name: 'is_glance',       definition: 'INTEGER DEFAULT 0' },
];

// ─── AddNote input type ────────────────────────────────────────────────
// Only title/body/tag/pinned are required. All enriched fields are optional
// so existing call sites (which only pass the original 4 fields) still compile.
type AddNoteInput = {
  title: string;
  body: string;
  tag: string;
  pinned: boolean;
  folder_name?: string | null;
  labels?: string[] | null;
  is_glance?: boolean;
};

// ─── Store Interface ───────────────────────────────────────────────────
interface NotesState {
  notes: Note[];
  isLoaded: boolean;
  initDB: () => void;
  loadNotes: () => void;
  addNote: (note: AddNoteInput) => number;
  updateNote: (id: number, updates: Partial<Pick<Note, 'title' | 'body' | 'tag' | 'pinned' | 'folder_name' | 'labels' | 'is_glance'>>) => void;
  deleteNote: (id: number) => void;
  bulkDeleteNotes: (ids: number[]) => void;
  restoreNote: (id: number) => void;
  permanentlyDeleteNote: (id: number) => void;
  emptyTrash: () => void;
  getNotesFilteredByTag: (tag: string) => Note[];
  getDeletedNotes: () => Note[];
  getUniqueTags: () => string[];
  setGlancePinnedNote: (id: number, pinned: boolean) => Promise<boolean>;
  // ─── New methods (Phase 1 & 5) ────────────────────────────────────
  resetDB: () => Promise<void>;
  bootstrap: (initialNotesJson?: string) => void;
}

// ─── Row → Note parser ─────────────────────────────────────────────────
// Safely parses a raw SQLite row into our enriched Note interface.
// All new fields have safe defaults so existing rows (without these columns) work.
function parseNoteRow(row: any): Note {
  let labels: string[] | null = null;
  if (row.labels) {
    try {
      labels = JSON.parse(row.labels);
    } catch (e) {
      log.warn('Failed to parse labels JSON', e as any);
    }
  }

  return {
    id: row.id,
    title: row.title || '',
    body: row.body || '',
    tag: row.tag || '',
    created_at: row.created_at || 0,
    updated_at: row.updated_at || 0,
    pinned: row.pinned === 1,
    is_deleted: row.is_deleted === 1,
    folder_name: row.folder_name || null,
    sync_status: (row.sync_status as SyncStatus) || 'local_only',
    labels: labels,
    is_glance: row.is_glance === 1,
  };
}

// ─── Sort helper: pinned notes float to top ────────────────────────────
function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    // Pinned notes always come first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    // Within the same pin group, sort by updated_at descending
    return b.updated_at - a.updated_at;
  });
}

// ─── Zustand Store ─────────────────────────────────────────────────────
export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  isLoaded: false,

  bootstrap: (json) => {
    if (!json) return;
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed) && parsed.length > 0) {
        log.info(`Bootstrapping store with ${parsed.length} native-preloaded notes`);
        set({ notes: parsed, isLoaded: true });
      }
    } catch (e) {
      log.error("Bootstrap parsing failed", e);
    }
  },

  initDB: () => {
    db.transaction((tx: any) => {
      // Step 1: Ensure the notes table exists with the original schema.
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY NOT NULL,
          title TEXT,
          body TEXT,
          tag TEXT,
          created_at INTEGER,
          updated_at INTEGER,
          pinned INTEGER DEFAULT 0,
          is_deleted INTEGER DEFAULT 0
        );`, [],
        () => {
          // Step 2: Run safe migrations for all required columns.
          // We check each column via pragma_table_info and only ALTER if missing.
          // This is chained sequentially to avoid transaction conflicts.
          let migrationsApplied = 0;

          const runMigration = (index: number) => {
            if (index >= REQUIRED_COLUMNS.length) {
              // All migrations checked — load notes
              if (migrationsApplied > 0) {
                log.info(`Schema migration complete: ${migrationsApplied} column(s) added`);
              }
              get().loadNotes();
              return;
            }

            const col = REQUIRED_COLUMNS[index];
            tx.executeSql(
              `SELECT COUNT(*) as count FROM pragma_table_info('notes') WHERE name=?;`,
              [col.name],
              (_: any, { rows }: any) => {
                const hasColumn = rows.item(0)?.count > 0;
                if (!hasColumn) {
                  tx.executeSql(
                    `ALTER TABLE notes ADD COLUMN ${col.name} ${col.definition};`,
                    [],
                    () => {
                      migrationsApplied++;
                      log.info(`Migration: added column '${col.name}'`);
                      runMigration(index + 1);
                    },
                    (_: any, err: any) => {
                      log.warn(`Migration ALTER failed for '${col.name}'`, err as any);
                      runMigration(index + 1);
                      return true;
                    }
                  );
                } else {
                  runMigration(index + 1);
                }
              },
              (_: any, err: any) => {
                log.warn(`pragma check failed for '${col.name}', skipping`, err as any);
                runMigration(index + 1);
                return true;
              }
            );
          };

          runMigration(0);
        }
      );
    }, (err: any) => {
        log.error("Failed to init DB (Transaction Error)", err);
        // CRITICAL: Always mark as loaded so the app doesn't stay stuck on the loading screen.
        set({ isLoaded: true });
    });
  },

  loadNotes: () => {
    log.info("Loading notes from DB...");
    db.transaction((tx: any) => {
      tx.executeSql(
        `SELECT * FROM notes ORDER BY updated_at DESC;`, [],
        (_: any, { rows: { _array } }: any) => {
          const loadedNotes = _array.map(parseNoteRow);
          log.info(`Loaded ${loadedNotes.length} notes`);
          set({ notes: loadedNotes, isLoaded: true });
        }
      );
    }, (err: any) => {
      log.error("Failed to load notes", err);
      // Ensure app never stays stuck on the loading skeleton
      set({ isLoaded: true });
    });
  },

  addNote: (note) => {
    const now = Date.now();
    const newNote: Note = {
      ...note,
      id: now * 1000 + Math.floor(Math.random() * 1000000),
      created_at: now,
      updated_at: now,
      pinned: note.pinned ?? false,
      is_deleted: false,
      folder_name: note.folder_name || null,
      sync_status: 'local_only',
      labels: note.labels || null,
      is_glance: note.is_glance ?? false,
    };

    log.info(`Adding new note: ${newNote.title}`);
    set((state) => ({ notes: [newNote, ...state.notes] }));

    const labelsJson = newNote.labels ? JSON.stringify(newNote.labels) : null;

    db.transaction((tx: any) => {
      tx.executeSql(
        `INSERT INTO notes (id, title, body, tag, created_at, updated_at, pinned, is_deleted, folder_name, sync_status, labels, is_glance)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?);`,
        [
          newNote.id, newNote.title, newNote.body, newNote.tag,
          newNote.created_at, newNote.updated_at, newNote.pinned ? 1 : 0,
          newNote.folder_name, newNote.sync_status, labelsJson,
          newNote.is_glance ? 1 : 0
        ]
      );
    }, (err: any) => {
      log.error("Failed to insert note", err);
    });

    return newNote.id;
  },

  updateNote: (id, updates) => {
    const now = Date.now();
    const prev = get().notes.find(x => x.id === id);
    if (!prev) return;

    const merged = { ...prev, ...updates, updated_at: now, sync_status: 'pending' as SyncStatus };

    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? merged : n
      ),
    }));

    const labelsJson = merged.labels ? JSON.stringify(merged.labels) : null;

    db.transaction((tx: any) => {
      tx.executeSql(
        `UPDATE notes SET title = ?, body = ?, tag = ?, updated_at = ?, pinned = ?,
         folder_name = ?, sync_status = ?, labels = ?, is_glance = ?
         WHERE id = ?;`,
        [
          merged.title, merged.body, merged.tag, merged.updated_at, merged.pinned ? 1 : 0,
          merged.folder_name, merged.sync_status, labelsJson, merged.is_glance ? 1 : 0,
          id
        ]
      );
    }, (err: any) => {
      log.error("Failed to update note", err);
    });
  },

  getNotesFilteredByTag: (tag) => {
    const { notes } = get();
    const activeNotes = notes.filter(n => !n.is_deleted);
    if (tag === ALL_TAG_ID) return sortNotes(activeNotes);
    return sortNotes(activeNotes.filter((n) => n.tag === tag));
  },

  deleteNote: (id) => {
    const target = get().notes.find(n => n.id === id);
    if (target?.is_glance) {
      glanceService.clearGlanceNote();
    }
    set((state) => ({
      notes: state.notes.map((n) => n.id === id ? { ...n, is_deleted: true, is_glance: false } : n)
    }));
    db.transaction((tx: any) => {
      tx.executeSql(`UPDATE notes SET is_deleted = 1, is_glance = 0 WHERE id = ?;`, [id]);
    });
  },

  setGlancePinnedNote: async (id: number, pinned: boolean) => {
    const target = get().notes.find(n => n.id === id);
    if (!target) return false;

    if (pinned) {
      // Unpin any other note from glance
      set((state) => ({
        notes: state.notes.map((n) => ({
          ...n,
          is_glance: n.id === id,
        })),
      }));

      db.transaction((tx: any) => {
        tx.executeSql(`UPDATE notes SET is_glance = 0 WHERE is_glance = 1;`);
        tx.executeSql(`UPDATE notes SET is_glance = 1 WHERE id = ?;`, [id]);
      });

      const success = await glanceService.postGlanceNote({
        id: target.id,
        title: target.title,
        body: target.body,
      });

      return success;
    } else {
      set((state) => ({
        notes: state.notes.map((n) => n.id === id ? { ...n, is_glance: false } : n),
      }));

      db.transaction((tx: any) => {
        tx.executeSql(`UPDATE notes SET is_glance = 0 WHERE id = ?;`, [id]);
      });

      await glanceService.clearGlanceNote();
      return true;
    }
  },

  bulkDeleteNotes: (ids) => {
    if (ids.length === 0) return;
    set((state) => {
      const idSet = new Set(ids);
      return {
        notes: state.notes.map((n) => idSet.has(n.id) ? { ...n, is_deleted: true } : n)
      };
    });
    db.transaction((tx: any) => {
      const placeholders = ids.map(() => '?').join(',');
      tx.executeSql(`UPDATE notes SET is_deleted = 1 WHERE id IN (${placeholders});`, ids);
    });
  },

  restoreNote: (id) => {
    set((state) => ({
      notes: state.notes.map((n) => n.id === id ? { ...n, is_deleted: false } : n)
    }));
    db.transaction((tx: any) => {
      tx.executeSql(`UPDATE notes SET is_deleted = 0 WHERE id = ?;`, [id]);
    });
  },

  permanentlyDeleteNote: (id) => {
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
    db.transaction((tx: any) => {
      tx.executeSql(`DELETE FROM notes WHERE id = ?;`, [id]);
    });
  },

  emptyTrash: () => {
    const trashIds = get().notes.filter(n => n.is_deleted).map(n => n.id);
    if (trashIds.length === 0) return;
    set((state) => ({ notes: state.notes.filter((n) => !n.is_deleted) }));
    db.transaction((tx: any) => {
      tx.executeSql(`DELETE FROM notes WHERE is_deleted = 1;`);
    }, (err: any) => {
      log.error("Failed to empty trash", err);
    });
  },

  getDeletedNotes: () => {
    return get().notes.filter(n => n.is_deleted).sort((a, b) => b.updated_at - a.updated_at);
  },

  getUniqueTags: () => {
    const tags = new Set(get().notes.filter(n => !n.is_deleted).map((n) => n.tag).filter(Boolean));
    return Array.from(tags).sort();
  },

  

  resetDB: async () => {
    set({ notes: [], isLoaded: false });
    // Re-initialize and load notes from the newly restored/replaced database file
    await reopenDatabaseConnection();
    get().initDB();
  },
}));
