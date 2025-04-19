// android/app/src/main/java/com/brainbitesmobilenew/accessibility/AppMonitorAccessibilityService.java
package com.brainbitesmobilenew.accessibility;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.widget.Toast;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class AppMonitorAccessibilityService extends AccessibilityService {
    private static final String TAG = "AppMonitorService";
    private static final String PREFS_NAME = "BrainBitesPrefs";
    private static final String PREF_MONITORED_APPS = "monitored_apps";
    private static final String PREF_STRICT_MODE = "brainbites_strict_mode";
    private static final String PREF_ACTIVE_SESSION = "active_session";
    private static final String PREF_SESSION_APP = "session_app";
    private static final String PREF_SESSION_START = "session_start";
    private static final String PREF_TIME_REMAINING = "time_remaining";
    
    private String currentApp = "";
    private String sessionApp = "";
    private long sessionStartTime = 0;
    private long timeRemainingSeconds = 0;
    private boolean isStrictModeEnabled = false;
    private Set<String> monitoredApps = new HashSet<>();
    private Handler handler = new Handler(Looper.getMainLooper());
    private Runnable timeUpdateRunnable;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "AppMonitorAccessibilityService created");
        
        // Load monitored apps
        loadMonitoredApps();
        
        // Create runnable for time updates
        timeUpdateRunnable = new Runnable() {
            @Override
            public void run() {
                updateTimeRemaining();
                // Run again in 1 second
                handler.postDelayed(this, 1000);
            }
        };
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            if (event.getPackageName() != null) {
                String packageName = event.getPackageName().toString();
                
                // Check if this is a new app
                if (!packageName.equals(currentApp)) {
                    onAppChanged(packageName);
                }
            }
        }
    }

    private void onAppChanged(String packageName) {
        Log.d(TAG, "App changed: " + packageName);
        currentApp = packageName;
        
        // Load latest settings
        loadSettings();
        
        // If strict mode is not enabled, just track but don't enforce
        if (!isStrictModeEnabled) {
            return;
        }
        
        // Check if we're monitoring this app
        if (monitoredApps.contains(packageName)) {
            // Check if we have an active session for this app
            if (isSessionActive() && sessionApp.equals(packageName)) {
                // We have an active session for this app, check time remaining
                if (timeRemainingSeconds <= 0) {
                    // No time left, go back to home
                    goToHomeScreen();
                    showToast("Time's up! Answer questions to earn more time.");
                } else {
                    // Start time tracking
                    startTracking();
                }
            } else if (isSessionActive() && !sessionApp.equals(packageName)) {
                // Session is active but for a different app
                // Go back to home and show message
                goToHomeScreen();
                showToast("You have an active session for " + sessionApp + ". Please use that app or end the session.");
            } else {
                // No active session, check if we have available time
                if (timeRemainingSeconds <= 0) {
                    // No time available
                    goToHomeScreen();
                    showToast("No time available for " + packageName + ". Answer questions to earn more time.");
                } else {
                    // Have time but no session, go back to BrainBites to start one
                    goToHomeScreen();
                    showToast("Please start a session in BrainBites to use this app.");
                }
            }
        }
        // If app is not monitored, do nothing
    }

    private void startTracking() {
        // Start updating time remaining
        handler.removeCallbacks(timeUpdateRunnable);
        handler.post(timeUpdateRunnable);
    }

    private void stopTracking() {
        // Stop updating time
        handler.removeCallbacks(timeUpdateRunnable);
    }

    private void updateTimeRemaining() {
        if (!isSessionActive() || sessionStartTime == 0) {
            return;
        }
        
        // Calculate elapsed time
        long currentTime = System.currentTimeMillis();
        long elapsedSeconds = (currentTime - sessionStartTime) / 1000;
        
        // Update time remaining
        timeRemainingSeconds = Math.max(0, timeRemainingSeconds - 1);
        
        // Save updated time
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putLong(PREF_TIME_REMAINING, timeRemainingSeconds);
        editor.apply();
        
        // Check if time's up
        if (timeRemainingSeconds <= 0) {
            // End session and go to home
            endSession();
            goToHomeScreen();
            showToast("Time's up! Answer questions to earn more time.");
        }
    }

    private void endSession() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putBoolean(PREF_ACTIVE_SESSION, false);
        editor.putString(PREF_SESSION_APP, "");
        editor.putLong(PREF_SESSION_START, 0);
        editor.apply();
        
        stopTracking();
    }

    private boolean isSessionActive() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        return prefs.getBoolean(PREF_ACTIVE_SESSION, false);
    }

    private void loadSettings() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        isStrictModeEnabled = prefs.getBoolean(PREF_STRICT_MODE, false);
        sessionApp = prefs.getString(PREF_SESSION_APP, "");
        sessionStartTime = prefs.getLong(PREF_SESSION_START, 0);
        timeRemainingSeconds = prefs.getLong(PREF_TIME_REMAINING, 0);
        
        // Re-load monitored apps
        loadMonitoredApps();
    }

    private void loadMonitoredApps() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        monitoredApps = prefs.getStringSet(PREF_MONITORED_APPS, new HashSet<>());
        
        // Add some default apps if none are set
        if (monitoredApps.isEmpty()) {
            monitoredApps = new HashSet<>(Arrays.asList(
                "com.facebook.katana",       // Facebook
                "com.instagram.android",     // Instagram
                "com.zhiliaoapp.musically",  // TikTok
                "com.twitter.android",       // Twitter
                "com.snapchat.android",      // Snapchat
                "com.google.android.youtube" // YouTube
            ));
            
            // Save default apps
            SharedPreferences.Editor editor = prefs.edit();
            editor.putStringSet(PREF_MONITORED_APPS, monitoredApps);
            editor.apply();
        }
    }

    private void goToHomeScreen() {
        Intent homeIntent = new Intent(Intent.ACTION_MAIN);
        homeIntent.addCategory(Intent.CATEGORY_HOME);
        homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(homeIntent);
    }

    private void showToast(final String message) {
        handler.post(new Runnable() {
            @Override
            public void run() {
                Toast.makeText(getApplicationContext(), message, Toast.LENGTH_LONG).show();
            }
        });
    }

    @Override
    public void onInterrupt() {
        Log.d(TAG, "Service interrupted");
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopTracking();
        Log.d(TAG, "Service destroyed");
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        Log.d(TAG, "Service connected");
        
        // Load settings when service connects
        loadSettings();
    }
}