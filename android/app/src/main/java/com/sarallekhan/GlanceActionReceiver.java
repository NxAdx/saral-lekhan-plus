package com.sarallekhan;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import androidx.core.app.NotificationManagerCompat;

public class GlanceActionReceiver extends BroadcastReceiver {
    private static final String TAG = "GlanceActionReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;

        String action = intent.getAction();
        int noteId = intent.getIntExtra("noteId", -1);

        Log.d(TAG, "Received glance action: " + action + " for noteId: " + noteId);

        if ("com.sarallekhan.GLANCE_MARK_DONE".equals(action)) {
            // Cancel notification
            NotificationManagerCompat.from(context).cancel(GlanceNotificationModule.GLANCE_NOTIFICATION_ID);

            // Notify React Native
            GlanceNotificationModule.emitEvent("onGlanceMarkDone", noteId);
        } else if ("com.sarallekhan.GLANCE_DISMISS".equals(action)) {
            NotificationManagerCompat.from(context).cancel(GlanceNotificationModule.GLANCE_NOTIFICATION_ID);
            GlanceNotificationModule.emitEvent("onGlanceDismissed", noteId);
        }
    }
}

