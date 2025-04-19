// src/services/StrictModeService.js
import { NativeModules, Platform } from 'react-native';

// If not on Android, provide a mock implementation
const StrictModeModule = Platform.OS === 'android' ? NativeModules.StrictMode : {
  isAccessibilityServiceEnabled: () => Promise.resolve(false),
  openAccessibilitySettings: () => Promise.resolve(false),
  startSession: () => Promise.resolve(false),
  endSession: () => Promise.resolve(false),
  getSessionInfo: () => Promise.resolve(null),
  setMonitoredApps: () => Promise.resolve(false),
  getMonitoredApps: () => Promise.resolve([]),
  setStrictModeEnabled: () => Promise.resolve(false),
  isStrictModeEnabled: () => Promise.resolve(false),
};

class StrictModeService {
  /**
   * Check if accessibility service is enabled
   * @returns {Promise<boolean>}
   */
  async isAccessibilityServiceEnabled() {
    if (Platform.OS !== 'android') return false;
    
    try {
      return await StrictModeModule.isAccessibilityServiceEnabled();
    } catch (error) {
      console.error('Error checking accessibility service:', error);
      return false;
    }
  }
  
  /**
   * Open accessibility settings
   * @returns {Promise<boolean>}
   */
  async openAccessibilitySettings() {
    if (Platform.OS !== 'android') return false;
    
    try {
      return await StrictModeModule.openAccessibilitySettings();
    } catch (error) {
      console.error('Error opening accessibility settings:', error);
      return false;
    }
  }
  
  /**
   * Start a session in strict mode
   * @param {string} appName - Display name of the app
   * @param {string} packageName - Package name of the app
   * @param {number} timeRemainingSeconds - Time remaining in seconds
   * @returns {Promise<boolean>}
   */
  async startSession(appName, packageName, timeRemainingSeconds) {
    if (Platform.OS !== 'android') return false;
    
    try {
      return await StrictModeModule.startSession(appName, packageName, timeRemainingSeconds);
    } catch (error) {
      console.error('Error starting session:', error);
      return false;
    }
  }
  
  /**
   * End the current session
   * @returns {Promise<boolean>}
   */
  async endSession() {
    if (Platform.OS !== 'android') return false;
    
    try {
      return await StrictModeModule.endSession();
    } catch (error) {
      console.error('Error ending session:', error);
      return false;
    }
  }
  
  /**
   * Get information about the current session
   * @returns {Promise<Object|null>}
   */
  async getSessionInfo() {
    if (Platform.OS !== 'android') return null;
    
    try {
      return await StrictModeModule.getSessionInfo();
    } catch (error) {
      console.error('Error getting session info:', error);
      return null;
    }
  }
  
  /**
   * Set the list of monitored app package names
   * @param {string[]} packageNames - Array of package names
   * @returns {Promise<boolean>}
   */
  async setMonitoredApps(packageNames) {
    if (Platform.OS !== 'android') return false;
    
    try {
      return await StrictModeModule.setMonitoredApps(packageNames);
    } catch (error) {
      console.error('Error setting monitored apps:', error);
      return false;
    }
  }
  
  /**
   * Get the list of monitored app package names
   * @returns {Promise<string[]>}
   */
  async getMonitoredApps() {
    if (Platform.OS !== 'android') return [];
    
    try {
      return await StrictModeModule.getMonitoredApps();
    } catch (error) {
      console.error('Error getting monitored apps:', error);
      return [];
    }
  }
  
  /**
   * Enable or disable strict mode
   * @param {boolean} enabled - Whether strict mode should be enabled
   * @returns {Promise<boolean>}
   */
  async setStrictModeEnabled(enabled) {
    if (Platform.OS !== 'android') return false;
    
    try {
      return await StrictModeModule.setStrictModeEnabled(enabled);
    } catch (error) {
      console.error('Error setting strict mode:', error);
      return false;
    }
  }
  
  /**
   * Check if strict mode is enabled
   * @returns {Promise<boolean>}
   */
  async isStrictModeEnabled() {
    if (Platform.OS !== 'android') return false;
    
    try {
      return await StrictModeModule.isStrictModeEnabled();
    } catch (error) {
      console.error('Error checking strict mode:', error);
      return false;
    }
  }
  
  /**
   * Maps app name to package name for common apps
   * @param {string} appName - Friendly name of the app
   * @returns {string} - Package name or original appName if not found
   */
  getPackageNameForApp(appName) {
    const packageMap = {
      'facebook': 'com.facebook.katana',
      'instagram': 'com.instagram.android',
      'tiktok': 'com.zhiliaoapp.musically',
      'twitter': 'com.twitter.android',
      'snapchat': 'com.snapchat.android',
      'youtube': 'com.google.android.youtube',
      'whatsapp': 'com.whatsapp',
      'messenger': 'com.facebook.orca',
      'pinterest': 'com.pinterest',
      'reddit': 'com.reddit.frontpage',
      'discord': 'com.discord',
      'netflix': 'com.netflix.mediaclient',
      'spotify': 'com.spotify.music',
      'twitch': 'tv.twitch.android.app'
    };
    
    return packageMap[appName.toLowerCase()] || appName;
  }
}

export default new StrictModeService();