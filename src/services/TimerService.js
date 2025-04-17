// src/services/TimerService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class TimerService {
  constructor() {
    this.availableTime = 0; // in seconds
    this.activeApp = null;
    this.isAppRunning = false;
    this.timer = null;
    this.startTime = null;
    this.listeners = [];
    this.STORAGE_KEY = 'brainbites_timer_data';
    
    // Load saved data on initialization
    this.loadSavedTime();
  }
  
  // Load previously saved time from storage
  async loadSavedTime() {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsedData = JSON.parse(data);
        this.availableTime = parsedData.availableTime || 0;
      }
    } catch (error) {
      console.error('Error loading saved time:', error);
    }
  }
  
  // Save current time state to storage
  async saveTimeData() {
    try {
      const data = {
        availableTime: this.availableTime,
        lastUpdated: new Date().toISOString()
      };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving time data:', error);
    }
  }
  
  // Start the timer for an app
  startAppTimer(appId) {
    if (this.availableTime <= 0) {
      this._notifyListeners('timeExpired');
      return false;
    }
    
    this.activeApp = appId;
    this.isAppRunning = true;
    this.startTime = Date.now();
    
    // Clear any existing timer
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    // Start tracking time
    this.timer = setInterval(() => {
      this._updateRemainingTime();
    }, 1000);
    
    this._notifyListeners('timerStarted', { appId });
    return true;
  }
  
  // Stop the timer
  stopAppTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // Update remaining time
    if (this.startTime) {
      const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
      this.availableTime = Math.max(0, this.availableTime - elapsedTime);
      this.startTime = null;
    }
    
    this.isAppRunning = false;
    this._notifyListeners('timerStopped', { appId: this.activeApp });
    this.activeApp = null;
    this.saveTimeData();
    return true;
  }
  
  // Update remaining time
  _updateRemainingTime() {
    if (!this.startTime) return;
    
    const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
    const remaining = Math.max(0, this.availableTime - elapsedTime);
    
    // Notify listeners of time update
    this._notifyListeners('timeUpdate', { 
      remaining,
      elapsed: elapsedTime,
      total: this.availableTime
    });
    
    // Check if time expired
    if (remaining <= 0) {
      this.stopAppTimer();
      this._notifyListeners('timeExpired');
    }
  }
  
  // Add time credits (rewards for correct answers)
  addTimeCredits(seconds) {
    this.availableTime += seconds;
    this.saveTimeData();
    this._notifyListeners('creditsAdded', { seconds, newTotal: this.availableTime });
    return this.availableTime;
  }
  
  // Get current available time
  getAvailableTime() {
    return this.availableTime;
  }
  
  // Format seconds to MM:SS
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }
  
  // Add event listener
  addEventListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
  
  // Notify all listeners
  _notifyListeners(event, data = {}) {
    this.listeners.forEach(listener => {
      listener({ event, ...data });
    });
  }
  
  // Clean up
  cleanup() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}

export default new TimerService();
