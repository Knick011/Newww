// android/app/src/main/java/com/brainbitesmobilenew/strictmode/StrictModeModule.java
package com.brainbitesmobilenew.strictmode;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;

import androidx.annotation.NonNull;

import com.brainbitesmobilenew.accessibility.AppMonitorAccessibilityService;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;

import java.util.HashSet;
import java.util.Set;

public class StrictModeModule extends ReactContextBaseJavaModule {
    private static final String TAG = "StrictModeModule";
    private static final String PREFS_NAME = "BrainBitesPrefs";
    private static final String PREF_MONITORED_APPS = "monitored_apps";
    private static final String PREF_STRICT_MODE = "brainbites_strict_mode";
    private static final String PREF_ACTIVE_SESSION = "active_session";
    private static final String PREF_SESSION_APP = "session_app";
    private static final String PREF_SESSION_START = "session_start";
    private static final String PREF_TIME_REMAINING = "time_remaining";

    private final ReactApplicationContext reactContext;

    public StrictModeModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return "StrictMode";
    }

    @ReactMethod
    public void isAccessibilityServiceEnabled(Promise promise) {
        try {
            boolean isEnabled = isAccessibilitySettingsOn(reactContext);
            promise.resolve(isEnabled);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to check accessibility service: " + e.getMessage());
        }
    }

    @ReactMethod
    public void openAccessibilitySettings(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to open accessibility settings: " + e.getMessage());
        }
    }

    @ReactMethod
    public void startSession(String appName, String packageName, int timeRemainingSeconds, Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            
            editor.putBoolean(PREF_ACTIVE_SESSION, true);
            editor.putString(PREF_SESSION_APP, packageName);
            editor.putLong(PREF_SESSION_START, System.currentTimeMillis());
            editor.putLong(PREF_TIME_REMAINING, timeRemainingSeconds);
            
            boolean success = editor.commit();
            promise.resolve(success);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to start session: " + e.getMessage());
        }
    }

    @ReactMethod
    public void endSession(Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            
            editor.putBoolean(PREF_ACTIVE_SESSION, false);
            editor.putString(PREF_SESSION_APP, "");
            editor.putLong(PREF_SESSION_START, 0);
            
            boolean success = editor.commit();
            promise.resolve(success);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to end session: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getSessionInfo(Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            boolean isActive = prefs.getBoolean(PREF_ACTIVE_SESSION, false);
            
            if (!isActive) {
                promise.resolve(null);
                return;
            }
            
            String appName = prefs.getString(PREF_SESSION_APP, "");
            long startTime = prefs.getLong(PREF_SESSION_START, 0);
            long timeRemaining = prefs.getLong(PREF_TIME_REMAINING, 0);
            
            WritableMap sessionInfo = new WritableNativeMap();
            sessionInfo.putBoolean("isActive", isActive);
            sessionInfo.putString("appName", appName);
            sessionInfo.putDouble("startTime", startTime);
            sessionInfo.putDouble("timeRemaining", timeRemaining);
            
            promise.resolve(sessionInfo);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to get session info: " + e.getMessage());
        }
    }

    @ReactMethod
    public void setMonitoredApps(ReadableArray appPackages, Promise promise) {
        try {
            Set<String> monitoredApps = new HashSet<>();
            for (int i = 0; i < appPackages.size(); i++) {
                monitoredApps.add(appPackages.getString(i));
            }
            
            SharedPreferences prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            editor.putStringSet(PREF_MONITORED_APPS, monitoredApps);
            
            boolean success = editor.commit();
            promise.resolve(success);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to set monitored apps: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getMonitoredApps(Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            Set<String> monitoredApps = prefs.getStringSet(PREF_MONITORED_APPS, new HashSet<>());
            
            WritableArray appsArray = new WritableNativeArray();
            for (String app : monitoredApps) {
                appsArray.pushString(app);
            }
            
            promise.resolve(appsArray);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to get monitored apps: " + e.getMessage());
        }
    }

    @ReactMethod
    public void setStrictModeEnabled(boolean enabled, Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            editor.putBoolean(PREF_STRICT_MODE, enabled);
            
            boolean success = editor.commit();
            promise.resolve(success);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to set strict mode: " + e.getMessage());
        }
    }

    @ReactMethod
    public void isStrictModeEnabled(Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            boolean isEnabled = prefs.getBoolean(PREF_STRICT_MODE, false);
            promise.resolve(isEnabled);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to check strict mode: " + e.getMessage());
        }
    }

    // Helper to check if Accessibility Service is enabled
    private boolean isAccessibilitySettingsOn(Context context) {
        int accessibilityEnabled = 0;
        final String serviceName = context.getPackageName() + "/" + AppMonitorAccessibilityService.class.getCanonicalName();
        
        try {
            accessibilityEnabled = Settings.Secure.getInt(
                context.getContentResolver(),
                Settings.Secure.ACCESSIBILITY_ENABLED);
        } catch (Settings.SettingNotFoundException e) {
            Log.e(TAG, "Error finding setting, default accessibility to not found: " + e.getMessage());
        }
        
        TextUtils.SimpleStringSplitter mStringColonSplitter = new TextUtils.SimpleStringSplitter(':');
        
        if (accessibilityEnabled == 1) {
            String settingValue = Settings.Secure.getString(
                context.getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
                
            if (settingValue != null) {
                mStringColonSplitter.setString(settingValue);
                while (mStringColonSplitter.hasNext()) {
                    String accessibilityService = mStringColonSplitter.next();
                    if (accessibilityService.equalsIgnoreCase(serviceName)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
}