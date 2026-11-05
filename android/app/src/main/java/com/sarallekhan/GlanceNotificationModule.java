package com.sarallekhan;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class GlanceNotificationModule extends ReactContextBaseJavaModule {
    private static final String TAG = "GlanceNotification";
    public static final String CHANNEL_ID = "saral_glance_notes_channel";
    public static final int GLANCE_NOTIFICATION_ID = 9001;

    private static ReactApplicationContext sReactContext;
    private final ReactApplicationContext reactContext;

    public GlanceNotificationModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        sReactContext = reactContext;
        createNotificationChannel();
    }

    @Override
    public String getName() {
        return "GlanceNotificationModule";
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Glance Notes",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Shows active glance notes pinned to lock screen & notification shade");
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            channel.setShowBadge(false);

            NotificationManager notificationManager = reactContext.getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    public static void emitEvent(String eventName, int noteId) {
        if (sReactContext != null && sReactContext.hasActiveReactInstance()) {
            try {
                sReactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(eventName, noteId);
            } catch (Exception e) {
                Log.e(TAG, "Error emitting event " + eventName, e);
            }
        }
    }

    @ReactMethod
    public void hasPermission(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= 33) { // Android 13+
                int status = ContextCompat.checkSelfPermission(
                    reactContext,
                    "android.permission.POST_NOTIFICATIONS"
                );
                promise.resolve(status == PackageManager.PERMISSION_GRANTED);
            } else {
                promise.resolve(NotificationManagerCompat.from(reactContext).areNotificationsEnabled());
            }
        } catch (Exception e) {
            promise.reject("ERR_PERMISSION_CHECK", e.getMessage());
        }
    }

    @android.annotation.SuppressLint("MissingPermission")
    @ReactMethod
    public void postGlanceNote(int noteId, String title, String body, Promise promise) {
        try {
            createNotificationChannel();

            // 1. PendingIntent for Tapping the Notification (Opens note in app)
            Intent openIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("sarallekhan://editor/" + noteId));
            openIntent.setPackage(reactContext.getPackageName());
            openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

            int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent openPendingIntent = PendingIntent.getActivity(
                reactContext,
                noteId,
                openIntent,
                pendingFlags
            );

            // 2. PendingIntent for "Mark Done" Action
            Intent doneIntent = new Intent(reactContext, GlanceActionReceiver.class);
            doneIntent.setAction("com.sarallekhan.GLANCE_MARK_DONE");
            doneIntent.putExtra("noteId", noteId);

            PendingIntent donePendingIntent = PendingIntent.getBroadcast(
                reactContext,
                noteId + 10000,
                doneIntent,
                pendingFlags
            );

            // 3. Notification Title & Body
            String displayTitle = (title != null && !title.trim().isEmpty()) ? title.trim() : "📌 Glance Note";
            String displayBody = (body != null) ? body : "";

            // Strip any raw HTML tags for clean notification display
            String cleanBody = displayBody.replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").trim();

            NotificationCompat.Builder builder = new NotificationCompat.Builder(reactContext, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(displayTitle)
                .setContentText(cleanBody)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(cleanBody))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setOngoing(true) // Pinned to lock screen & notification shade
                .setAutoCancel(false)
                .setContentIntent(openPendingIntent)
                .addAction(android.R.drawable.ic_menu_view, "Open", openPendingIntent)
                .addAction(android.R.drawable.checkbox_on_background, "Done", donePendingIntent);

            NotificationManagerCompat notificationManager = NotificationManagerCompat.from(reactContext);
            notificationManager.notify(GLANCE_NOTIFICATION_ID, builder.build());

            promise.resolve(true);
        } catch (SecurityException se) {
            Log.e(TAG, "Notification permission missing", se);
            promise.reject("ERR_PERMISSION_DENIED", "Notification permission required.");
        } catch (Exception e) {
            Log.e(TAG, "Failed to post glance notification", e);
            promise.reject("ERR_POST_NOTIFICATION", e.getMessage());
        }
    }

    @ReactMethod
    public void clearGlanceNote(Promise promise) {
        try {
            NotificationManagerCompat notificationManager = NotificationManagerCompat.from(reactContext);
            notificationManager.cancel(GLANCE_NOTIFICATION_ID);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Failed to cancel glance notification", e);
            promise.reject("ERR_CANCEL_NOTIFICATION", e.getMessage());
        }
    }

    @ReactMethod
    public void isGlanceActive(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                NotificationManager notificationManager = reactContext.getSystemService(NotificationManager.class);
                if (notificationManager != null) {
                    for (android.service.notification.StatusBarNotification sbn : notificationManager.getActiveNotifications()) {
                        if (sbn.getId() == GLANCE_NOTIFICATION_ID) {
                            promise.resolve(true);
                            return;
                        }
                    }
                }
            }
            promise.resolve(false);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }
}

