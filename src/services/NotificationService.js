// src/services/NotificationService.js
import { Platform } from 'react-native';
import TimerService from './TimerService';

class NotificationService {
  constructor() {
    this.scheduledNotifications = [];
    this.hasPermission = false;
    this.initialized = false;
  }
  
  // Initialize notification system - will be different for iOS and Android
  async initialize() {
    if (this.initialized) return;
    
    try {
      // On an actual implementation, you'd use a library like 'react-native-push-notification'
      // or '@react-native-community/push-notification-ios' or 'expo-notifications'
      
      // This is a placeholder to show the design pattern
      if (Platform.OS === 'ios') {
        // iOS requires permissions for notifications
        // const permission = await requestNotificationPermissions();
        this.hasPermission = true; // Assume success for this example
      } else {
        // Android doesn't require explicit permissions for local notifications in older versions
        // For Android >= 13, you need to request POST_NOTIFICATIONS permission
        this.hasPermission = true;
      }
      
      this.initialized = true;
      return this.hasPermission;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }
  
  // Schedule a notification for time reminders
  async scheduleTimeReminder(type, appId, timeRemaining) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!this.hasPermission) {
      console.warn('No notification permission');
      return false;
    }
    
    // Cancel any existing notifications of the same type
    this.cancelNotificationsByType(type);
    
    let triggerTime;
    let title;
    let body;
    
    switch (type) {
      case 'halfway':
        // Schedule at halfway point
        triggerTime = Math.floor(timeRemaining / 2);
        title = 'Halfway Point';
        body = `You've used half of your allotted time for ${appId}!`;
        break;
        
      case 'fiveMinute':
        // 5 minutes before expiry
        triggerTime = Math.max(0, timeRemaining - 300);
        title = '5 Minutes Left';
        body = `Only 5 minutes of app time remaining!`;
        break;
        
      case 'timeUp':
        // At expiry time
        triggerTime = timeRemaining;
        title = 'Time\'s Up!';
        body = `Your allotted time for ${appId} has ended.`;
        break;
        
      case 'periodic':
        // Every 15 minutes for longer sessions
        triggerTime = Math.min(900, timeRemaining); // First one at 15 minutes
        title = 'Time Check-in';
        body = `You've been using ${appId} for a while. Time remaining: ${TimerService.formatTime(timeRemaining - triggerTime)}`;
        break;
        
      default:
        return false;
    }
    
    // Don't schedule if trigger time is 0 or negative
    if (triggerTime <= 0) {
      return false;
    }
    
    // This would use the actual notification library to schedule
    // For now we'll just add it to our tracked list
    const notificationId = `${Date.now()}-${type}-${Math.random().toString(36).substring(7)}`;
    
    this.scheduledNotifications.push({
      id: notificationId,
      type,
      appId,
      triggerAt: Date.now() + (triggerTime * 1000),
      title,
      body
    });
    
    // If periodic, schedule the next one
    if (type === 'periodic' && timeRemaining > 900) {
      // Schedule next periodic notification in 15 minutes
      setTimeout(() => {
        this.scheduleTimeReminder('periodic', appId, timeRemaining - 900);
      }, 1000); // Small delay to avoid recursive stack
    }
    
    console.log(`[Notification scheduled] ${type}: ${body} in ${triggerTime} seconds`);
    return notificationId;
  }
  
  // Schedule all standard reminders for a session
  scheduleSessionReminders(appId, timeRemaining) {
    // Cancel any existing notifications first
    this.cancelAllNotifications();
    
    // Don't schedule if time is too short
    if (timeRemaining < 60) return;
    
    // Schedule halfway notification
    if (timeRemaining > 120) {
      this.scheduleTimeReminder('halfway', appId, timeRemaining);
    }
    
    // Schedule 5-minute warning if session is > 6 minutes
    if (timeRemaining > 360) {
      this.scheduleTimeReminder('fiveMinute', appId, timeRemaining);
    }
    
    // Schedule time-up notification
    this.scheduleTimeReminder('timeUp', appId, timeRemaining);
    
    // Schedule periodic reminders if session is > 20 minutes
    if (timeRemaining > 1200) {
      this.scheduleTimeReminder('periodic', appId, timeRemaining);
    }
  }
  
  // Cancel notifications by type
  cancelNotificationsByType(type) {
    const toCancel = this.scheduledNotifications.filter(n => n.type === type);
    
    toCancel.forEach(notification => {
      // In a real implementation, you'd use the notification library to cancel
      // PushNotification.cancelLocalNotification(notification.id);
      console.log(`[Notification canceled] ${notification.type}: ${notification.body}`);
    });
    
    // Remove from our tracked list
    this.scheduledNotifications = this.scheduledNotifications.filter(n => n.type !== type);
  }
  
  // Cancel all scheduled notifications
  cancelAllNotifications() {
    // In a real implementation, you'd use the notification library
    // PushNotification.cancelAllLocalNotifications();
    
    this.scheduledNotifications.forEach(notification => {
      console.log(`[Notification canceled] ${notification.type}: ${notification.body}`);
    });
    
    this.scheduledNotifications = [];
  }
  
  // Show an immediate notification
  showNotification(title, body, data = {}) {
    if (!this.hasPermission) {
      console.warn('No notification permission');
      return false;
    }
    
    // In a real implementation, you'd use the notification library
    // PushNotification.localNotification({
    //   title,
    //   message: body,
    //   userInfo: data
    // });
    
    console.log(`[Notification shown] ${title}: ${body}`);
    return true;
  }
}

export default new NotificationService();