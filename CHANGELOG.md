# Changelog

## v2.19.29 - Web Share Studio Print & Document Export
- **Note Printing & PDF Export (`🖨️ Print` & Ctrl+P)**: Added an intuitive Print button to the editor top action bar and keyboard shortcut (`Ctrl+P` / `Cmd+P`). Automatically switches from source to visual mode before printing so markdown renders as clean, formatted rich text.
- **Dedicated Print Typography (`@media print`)**: Engineered clean, ink-efficient print styles that hide web chrome (sidebar, topbars, editing toolbars, trash banners, and toasts), preserve document pagination (`page-break-inside: avoid` for code and blockquotes), and render high-contrast black text on pure white paper with formatted title, tag, and body.

## v2.19.28 - Web Share Studio Real-Time Auto-Sync & Manual Refresh
- **Real-Time Auto-Sync (Live Updates)**: Web Share Studio automatically polls and synchronizes notes every 3 seconds. Edits made on the mobile phone automatically reload in the active note and refresh the sidebar list in real time without needing page reloads.
- **Smart Non-Destructive Conflict Guard**: If a user is actively composing or typing unsaved edits in the web studio (`isDirty`), auto-sync protects their work and avoids overwriting edits. The sync status pill alerts the user with a 1-click reload option when ready.
- **Tactile Refresh Buttons**: Added prominent, animated `🔄 Refresh` buttons to both the sidebar brand header and the editor top action bar for immediate on-demand synchronization with visual spin feedback.
- **Cache-Busting & Endpoint Hardening**: Added strict `Cache-Control: no-cache, no-store, must-revalidate` HTTP headers, `ETag`, and tolerant query-parameter matching to prevent browser caching of stale notes.
- **Multi-Byte Raw Stream Handling**: Fixed HTTP payload truncation on emojis, Devanagari text, and markdown tables by switching socket stream consumption to exact raw byte counts.
- **Settings Top-Bar Access**: Placed the Web Share Studio launch button directly on the Settings screen header bar for fast 1-tap access.

## v2.19.27 - UI/UX Styling Toolbar Improvements
- **Toolbar Rearrangement**: Reorganized the markdown editor's styling toolbar into a logical, standard UX flow. Grouped text formatting together, moved structural elements (headings, blockquotes, code) together, and placed lists and dividers sequentially to match how users naturally structure documents.

## v2.19.26 - Auto-Scroll: Bypass Library Bug
- **Root Cause Fixed**: Discovered an operator-precedence bug in `react-native-pell-rich-editor` (line 213 of RichEditor.js) that silently converts ALL cursor Y values to `0` when `useContainer={false}`. The expression `parseInt(data + layout.y || 0)` evaluates to `parseInt(NaN || 0)` = `0` when `layout.y` is undefined, which it always is without the View wrapper.
- **Custom Message Channel**: Bypassed the library's broken `OFFSET_Y` handler entirely. The injected JavaScript now sends cursor coordinates via a custom `CURSOR_Y` message type, which the library passes through its `default:` case to our `onMessage` prop — completely avoiding the buggy arithmetic.
- **Result**: `handleCursorPosition` is now actually called (it was never being called before despite three prior fix attempts).

## v2.19.25 - Deep Auto-Scroll & WebView Fix
- **Absolute Cursor Tracking**: Completely overhauled how the editor tracks the cursor position. Fixed a core bug in the underlying editor library where cursor tracking inside nested elements (like lists or blockquotes) would return a false `Y` coordinate, causing the screen to violently scroll up.
- **WebView Scroll Lock**: Prevented the Android WebView from fighting with the React Native ScrollView. The WebView's internal scroll is now locked, ensuring the smooth React Native autoscroll takes full control without visual glitching or jumping when the keyboard opens.

## v2.19.24 - Rich Editor Auto-Scroll Offset Fix
- **Auto-Scroll Behavior Fixed**: Resolved a bug where the editor would abruptly scroll up to the top of the screen when typing on the first few lines of a note. The layout measurement now accurately accounts for the vertical offset introduced by the Title and Tag inputs sitting above the editor surface inside the ScrollView.

## v2.19.23 - Pinning UI and Bulk Export Fixes
- **Pinning Restored**: Added a visible pin/unpin toggle button to the editor header, allowing users to actively pin important notes to the top of their home screen. 
- **Bulk Export Fix**: Resolved an issue where exporting multiple notes would concatenate them into a single Markdown file. Bulk Export now correctly generates a standardized `.zip` archive containing individual `.md` files for each selected note, preserving folder structure and making it much easier to import into other markdown editors.

## v2.19.22 - Final Fix for Android Horizontal Layout Text Measurement Bug
- **Tag Rail Converted to FlatList**: Replaced the horizontal `ScrollView` used for the tag rail on the Home Screen with a horizontal `FlatList`. In React Native Android, raw root `<Text>` components inside a `ScrollView` that sits as a sibling to another `FlatList` frequently fail layout measurement boundaries (calculating 0-width) until a state update occurs. Converting the tag rail to `FlatList` ensures standard `CellRenderer` bindings are used for robust and fully visible text rendering on mount.

## v2.19.21 - Revert TagPill to v2.17.56 Native Behavior
- **Tag Rendering Fixed (Final)**: Completely reverted the TagPill component's text logic to precisely match the battle-tested code from v2.17.56. All recent hacks (`View` wrapping, `numberOfLines` removal, flexbox changes) that inadvertently broke Android text layout measurement on the home screen have been stripped out.
- **Selection Mode Fix**: Restored native selection mode behavior. In selection mode, tapping a note will correctly select/deselect it rather than unintentionally opening the editor.
- **Tag Rendering Fixed**: Discovered and resolved the root cause of tags appearing blank or dotted on the initial screen load. React Native's Android layout engine struggles to calculate the width of root `<Text>` nodes inside horizontal `<ScrollView>`s. Explicitly wrapped the tag label `<Text>` inside a `<View>` container with `flexShrink: 1` and re-enabled `numberOfLines={1}`. This forces the Android UI engine to calculate the bounds accurately on the very first mount, eliminating the bug where tags were invisible until a user tapped one.

## v2.19.19 - Fix Devanagari & English Tag Layout Text Clipping on Android
- **Tag Rendering Fixed**: Completely removed `includeFontPadding: false` from the `TagPill` text styling, which was causing the text to collapse to ellipses/dots on certain Android devices. Also added `textBreakStrategy="simple"` and a trailing space character to the text rendering to ensure clean, unclipped tag text rendering across all screen sizes.

## v2.19.18 - Resolve Row Flexbox Text Truncation Bug in TagPill
- **Tag Rendering Fixed**: Conditionalized the layout style of `TagPill` component so `flexDirection: 'row'` is only applied when an `icon` is provided. When no icon is present, it falls back to standard block/column layout. Also removed `numberOfLines={1}` from the tag pill label text, eliminating the React Native / Yoga engine layout bug that caused the tags inside horizontal rails to collapse or render as empty dots.

## v2.19.17 - Total Tag UI Layout Fix
- **Tag Rendering Fixed**: Completely restored `TagPill.tsx` layout styles back to how it was in your older, perfectly working builds (`flexDirection: row`, `alignItems: center`, and `includeFontPadding: false`). This finally resolves the issue where tags inside the top rail were rendering as tiny truncated dots instead of readable tags.
- **Icon Support Restored**: Restored icon prop support to the TagPill for compatibility.

## v2.19.16 - Fix Missing Variable in TagPill
- **Tag Rendering Fixed**: Fixed a TypeScript compilation error in `TagPill.tsx` that prevented the previous tag UI fix from being built successfully into an APK. The dynamic `fontSize` variable is now properly extracted from `useTheme()`.

## v2.19.15 - Perfect TagPill UI Restoration
- **Reverted TagPill to Stable Layout**: Reverted the underlying flexbox layout of `TagPill` to exactly match the stable version from `v2.19.10` (before the UI regressions occurred), while preserving the safe dynamic font scaling fix. This guarantees the tags render perfectly as they used to.

## v2.19.14 - Definitively Fix TagPill Text Clipping
- **Tag Rendering Fixed**: On certain Android devices, `includeFontPadding: false` causes complete vertical text clipping if the device font metrics have zero height. Removed this property. Also enforced a strict `Math.max` for tag font size so it can never shrink below `10px` regardless of the user's base multiplier.

## v2.19.13 - Eliminate State Desync in Selection Mode
- **Architectural Fix for Selection State**: Completely eliminated the root cause of the "first note doesn't select" bug. Previously, the selection UI mode (`isSelectionMode`) and the underlying selected items list (`selectedIds`) were two separate React state variables synchronized via `useEffect`. Under certain race conditions, one would update without the other. This has been refactored so that `isSelectionMode` is purely derived from `selectedIds.size > 0`. This makes it mathematically impossible for the UI to be desynced from the actual selection state.

## v2.19.12 - Tag Visibility and Selection Reliability Fix
- **Fix Tag Visibility**: Added fallback values for `fontSize` calculations in `themeStore` and `TagPill`. If local storage evaluates to `NaN` or `undefined` (which shrinks tags to invisible dots), it now safely defaults to `1.0`.
- **Fix Selection Race Condition**: Refactored the `FlatList` component to determine selection status (`selectedIds.has(item.id)`) *inside* the `renderItem` closure instead of relying on a `.map()` copy array (`dataToRender`). Added `isSelectionMode` and `selectedIds` directly to the `useCallback` dependency array. This guarantees that `FlatList` sees a new component reference when state changes and accurately re-renders all cells in place without caching stale items (which previously caused the first long-press to malfunction).
- **Root Cause Confirmed**: Shopify's `FlashList` caches `ListHeaderComponent` and does NOT re-render it when state changes (confirmed via Shopify docs and GitHub issues). This is why the selection header never appeared despite `isSelectionMode` being `true`.
- **FlashList → FlatList**: Replaced `@shopify/flash-list` with React Native's standard `FlatList`. `FlatList` correctly re-renders all cells and respects `extraData` without recycler caching interference.
- **Header Extracted from List**: Moved the selection header, search bar, and tag rail completely outside the `FlatList` and into the parent component's render tree. This guarantees React always re-renders the header instantly on state transitions — no list component caching can interfere.

## v2.19.10 - Selection State Mapped Rendering & Visibility Fixes
- **State-to-Data Mapping**: Mapped `isSelected` and `isSelectionMode` directly onto each note object in a computed `dataToRender` array passed to `FlashList`. This forces FlashList's diffing engine to reliably redraw all visible items and the header component on selection state transitions, completely bypassing closure-stretching and recycling lags.
- **Unselected Outline Visibility**: Changed the border color of `unselectedIcon` in `BentoCard` from `strokeDim` to `stroke`. In almost all dark themes, `strokeDim` matches the card background color, rendering the empty selection rings invisible. The new `stroke` color provides high contrast and full visibility.

## v2.19.9 - FlashList Stale Render Resolution
- **Memoized Callbacks Fix**: Converted static `ListHeader` JSX element and inline `renderItem` into memoized functional callbacks (`renderHeader`, `renderItem`) utilizing `useCallback` with explicit dependency tracking.
- **Selection State Sync**: Configured a custom `extraData` dependency object that forces Shopify's `FlashList` to reliably re-evaluate cell renderers and header components on selection mode transitions, resolving stale closure bugs where selecting a note didn't update the header or tap behaviors on other notes.

## v2.19.8 - FlashList Refresh Enforcement
- **FlashList Stale Updates Fix**: Enforced array reference changes for the `data` prop of `FlashList` during selection transitions, forcing the list diffing engine to reliably re-render all visible cards and the list header.

## v2.19.7 - Selection Mode Lifecycle Polish
- **Pruning Effect Fix**: Removed the background `useEffect` prune watcher which was prematurely resetting the active selection states due to asynchronous list filter recalculation timing. Added event-driven clear triggers when tags or search queries change.
- **Robust Item Rendering**: Simplified `extraData` tracking on the note container list so cell view updates are forced on all mode transitions.

## v2.19.6 - Selection Header Updates
- **Selection Header Fix**: Removed `useMemo` caching from the home page `ListHeader` layout to ensure selection actions and active note selection states update instantly without relying on FlatList/FlashList internal cache triggers.

## v2.19.5 - Duplicate Key Resolution
- **Duplicate Key Fix**: Resolved a critical duplicate `version` key issue at the bottom of `package.json` that was overriding the target build version and keeping it hardcoded at `2.19.1` in production builds. The app will now properly build and publish as `2.19.5`.

## v2.19.4 - Version Sync Fixes
- **Version Configuration Fix**: Fixed an issue where the Expo configuration (`app.config.js`) was trying to read an undefined version field from `package.json`, causing the app to silently fall back to an older cached version during builds. The app will now correctly compile with the latest version number (`2.19.4`) and apply all recent UI fixes.

## v2.19.3 - Updater Testing Release
- **Version Bump**: Bumped version specifically to test the in-app OTA GitHub release updater workflow.

## v2.19.2 - Selection UI & Logic Fixes
- **Selection Layout Fix**: Redesigned the selection mode header into a two-row layout so the Delete and Export buttons are prominently visible on narrow mobile screens.
- **Visual Selection Indicators**: Added a clear empty circular ring to unselected cards when in selection mode, making it visually obvious that they can be selected.
- **Selection Mode Freezing Fix**: Fixed a critical logic bug (React Hook infinite loop) that caused the app to completely freeze when tapping buttons during selection mode.
- **Tap Responsiveness**: Rewrote the underlying FlashList state rendering logic so tapping cards instantly updates their visual selection state without stale cache issues.
- **Updater Diagnostics**: Added detailed version comparison logging for the in-app updater to assist with remote debugging.

## v2.19.1 - Stability & UX Polish
- **Live Preview:** Added an Edit/Preview toggle in the markdown editor for instant rich-text visualization.
- **Selection Mode Fixes:** Added a "Select All" button and removed bouncy animations during bulk selection for a faster, stable experience.
- **Checklist Removed:** Completely removed the Checklist feature to keep the app strictly Markdown-first.
- **Crisp Icons:** Replaced custom toolbar icons with standard vector icons for a premium look.
- **Editor Stability:** Reverted to a stable WebView container pattern for the Rich Editor to fix crashes and broken scrolling on Android.
- **Editor Layout:** Removed redundant keyboard height padding that caused text to be obscured behind the toolbar. The editor now relies securely on Android's native window resizing.
- **Delete UI Fix:** Fixed an ugly "Not Found" flicker that occurred when deleting a note by delaying the deletion until the navigation transition finishes.

## v2.19.0 - Editor Rewrite & UI Polish
- **Pure Native Editor:** Replaced the legacy WebView rich text editor with a lightning-fast native Markdown text box. Perfect 60FPS scrolling and instant keyboard responsiveness.
- **Dual-Mode Magic:** A new View Mode automatically renders your Markdown into beautiful headings and lists.
- **Consolidated Category Rail:** Replaced the clunky double-rails for folders and tags into a single, unified, horizontal category filter on the home screen.
- **OTA Updates Re-Enabled:** The in-app updater and remote UX flags have been fully re-enabled.
- **Premium UX:** Replaced all formatting toolbar buttons with rounded, vector-perfect icons.
- **Backwards Compatibility:** Old notes seamlessly auto-convert their legacy HTML into clean Markdown without losing formatting.

## [2.18.0] - 2026-06-11
### Added
- **Checklist Mode**: Added a dedicated checklist editor for notes. Users can seamlessly toggle a note between standard rich text and an interactive checklist, complete with drag-and-drop reordering.
- **Folder Organization**: Added the ability to organize notes into Folders. The Home Screen now features a dual-rail filter system for folders and context-aware tags.
- **Google Keep Import**: Added native support for importing Google Keep Takeout `.zip` files directly from the Home Screen. Checklists, text, and labels map seamlessly into the local database.
- **Markdown Export Enhancements**: Markdown exports now include full YAML frontmatter containing tags, folders, pinned status, and dates for perfect compatibility with Obsidian and Joplin.

### Changed
- SQLite Database schema migrated to support enriched `Note` properties safely (backward-compatible).
