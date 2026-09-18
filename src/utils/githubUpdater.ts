import * as FileSystem from 'expo-file-system';
import { Linking, Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import { log } from './Logger';

const { UpdaterModule } = NativeModules;

export const APP_VERSION = (
    Constants.expoConfig?.version ||
    (Constants.manifest as any)?.version ||
    '0.0.0'
).replace(/^v/, '');
export const DISTRIBUTION_CHANNEL = String(Constants.expoConfig?.extra?.distributionChannel || 'direct');
export const UPDATER_MODE = String(Constants.expoConfig?.extra?.updaterMode || 'github');

const REPO_OWNER = 'NxAdx';
const REPO_NAME = 'saral-lekhan-plus';

/**
 * Expert Numeric Versioning Logic
 * Pattern: major * 100,000,000 + minor * 10,000 + patch
 */
function getVersionNumber(version: string): number {
    const parts = String(version || '').replace(/^v/, '').split('.').map(p => parseInt(p, 10));
    const major = parts[0] || 0;
    const minor = parts[1] || 0;
    const patch = parts[2] || 0;
    return major * 100000000 + minor * 10000 + patch;
}

export interface UpdateInfo {
    hasUpdate: boolean;
    version: string;
    downloadUrl: string;
    changelog: string;
    releaseUrl: string;
    isReinstall: boolean;
}

/**
 * Checks the public GitHub repository for the latest release.
 */
export async function checkForUpdate(allowSameVersion = false): Promise<UpdateInfo | null> {
    if (UPDATER_MODE !== 'github') {
        log.info('[Updater] Skipped: UPDATER_MODE is not "github", got: ' + UPDATER_MODE);
        return null;
    }
    try {
        log.info(`[Updater] Checking for updates... APP_VERSION=${APP_VERSION}, allowSameVersion=${allowSameVersion}`);
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`, {
            headers: { 'Accept': 'application/vnd.github.v3+json' }
        });

        if (!response.ok) {
            log.warn(`[Updater] GitHub API returned ${response.status} ${response.statusText}`);
            return null;
        }

        const releases = await response.json();
        if (!Array.isArray(releases) || releases.length === 0) {
            log.warn('[Updater] No releases found or invalid response');
            return null;
        }

        let latestRelease = null;
        let apkAsset = null;

        for (const release of releases) {
            const assets = Array.isArray(release.assets) ? release.assets : [];
            const foundApk = assets.find((asset: any) =>
                typeof asset?.name === 'string' && asset.name.endsWith('.apk')
            );
            if (foundApk) {
                latestRelease = release;
                apkAsset = foundApk;
                break;
            }
        }

        if (!latestRelease || !apkAsset) {
            log.warn('[Updater] No release with APK asset found');
            return null;
        }

        const latestVersion = latestRelease.tag_name.replace(/^v/, '');
        const currentVersion = APP_VERSION.replace(/^v/, '');

        const latestNum = getVersionNumber(latestVersion);
        const currentNum = getVersionNumber(currentVersion);

        const isNewVersion = latestNum > currentNum;
        const isReinstall = latestNum === currentNum && allowSameVersion;
        const hasUpdate = isNewVersion || isReinstall;

        log.info(`[Updater] RESULT: current=${currentVersion}(${currentNum}) vs latest=${latestVersion}(${latestNum}) → isNew=${isNewVersion}, isReinstall=${isReinstall}, hasUpdate=${hasUpdate}`);

        return {
            hasUpdate,
            version: latestVersion,
            downloadUrl: apkAsset.browser_download_url,
            changelog: latestRelease.body || '',
            releaseUrl: latestRelease.html_url,
            isReinstall,
        };

    } catch (error) {
        log.error('[Updater] Check failed with error:', error as any);
        return null;
    }
}

/**
 * Checks if the app has permission to install other apps (Unknown Sources).
 */
export async function checkInstallPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    if (UPDATER_MODE !== 'github' || !UpdaterModule) return false;
    try {
        return await UpdaterModule.canInstallPackages();
    } catch {
        return true;
    }
}

/**
 * Opens system settings to grant installation permission.
 */
export async function requestInstallPermission(): Promise<void> {
    if (Platform.OS !== 'android') return;
    if (UPDATER_MODE !== 'github') return;
    try {
        await UpdaterModule.openInstallPermissionSettings();
    } catch (e) {
        log.warn("Failed to open install settings", e as any);
    }
}

/**
 * Advanced Installation Mechanism
 * Prioritizes PackageInstaller Session (Direct Install) with fallback for MIUI.
 */
export async function downloadAndInstallApk(
    downloadUrl: string,
    version: string,
    onProgress?: (progress: number) => void
): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    if (UPDATER_MODE !== 'github' || !UpdaterModule) return false;

    const normalizedTargetVersion = String(version || '').replace(/^v/, '');
    const normalizedCurrentVersion = String(APP_VERSION || '').replace(/^v/, '');
    const isSameVersionReinstall = normalizedTargetVersion === normalizedCurrentVersion;

    // We no longer force same-version reinstalls into the browser.
    // The catch block below will safely fallback to the browser if the PackageInstaller intent is ignored.

    // Check permission first
    const hasPermission = await checkInstallPermission();
    if (!hasPermission) {
        await requestInstallPermission();
        return false; // Return false to indicate the process was interrupted for permission
    }

    try {
        const fileUri = `${FileSystem.cacheDirectory}update_v${version}.apk`;

        const downloadResumable = FileSystem.createDownloadResumable(
            downloadUrl,
            fileUri,
            {},
            (dp) => {
                const prog = dp.totalBytesExpectedToWrite > 0
                    ? dp.totalBytesWritten / dp.totalBytesExpectedToWrite
                    : 0;
                if (onProgress) onProgress(prog);
            }
        );

        const result = await downloadResumable.downloadAsync();
        if (!result) return false;

        // --- INSTALLATION LOGIC ---

        let isMiui = false;
        try {
            const manufacturer = await UpdaterModule.getManufacturer();
            isMiui = manufacturer?.toLowerCase().includes('xiaomi');
        } catch (e) {}

        if (isMiui || !UpdaterModule) {
            log.info('Using legacy installation method (MIUI detected or Module missing)');
            return await Linking.openURL(downloadUrl);
        }

        const absolutePath = result.uri.replace('file://', '');
        return await UpdaterModule.installPackage(absolutePath);

    } catch (e) {
        log.error("Install Error:", e as any);
        try {
            await Linking.openURL(downloadUrl);
            return true;
        } catch {
            return false;
        }
    }
}
