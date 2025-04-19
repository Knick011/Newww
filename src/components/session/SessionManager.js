// src/components/session/SessionManager.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TimerService from '../../services/TimerService';
import NotificationService from '../../services/NotificationService';

const SessionManager = ({ navigation, appId }) => {
  const [remainingTime, setRemainingTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [percentage, setPercentage] = useState(100);
  const [initialTime, setInitialTime] = useState(0);
  const [isActive, setIsActive] = useState(true);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Set up pulse animation for low time
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };
  
  useEffect(() => {
    // Start the session
    const success = TimerService.startAppTimer(appId);
    
    if (!success) {
      alert('No time available!');
      navigation.goBack();
      return;
    }
    
    // Get initial session info
    const sessionInfo = TimerService.getCurrentSession();
    if (sessionInfo) {
      setRemainingTime(sessionInfo.remainingTime);
      setElapsedTime(sessionInfo.elapsedTime);
      setInitialTime(sessionInfo.remainingTime + sessionInfo.elapsedTime);
      setIsActive(sessionInfo.isActive);
    }
    
    // Schedule notifications
    NotificationService.scheduleSessionReminders(appId, sessionInfo?.remainingTime || 0);
    
    // Set up listener for time updates
    const removeListener = TimerService.addEventListener(handleTimerEvent);
    
    // Clean up when component unmounts
    return () => {
      removeListener();
      // Don't stop the timer here - it should keep running until user explicitly ends
    };
  }, []);
  
  // Start pulse animation when time is low
  useEffect(() => {
    if (remainingTime < 300 && remainingTime > 0) { // Less than 5 minutes
      startPulseAnimation();
    } else {
      pulseAnim.setValue(1);
      pulseAnim.stopAnimation();
    }
  }, [remainingTime]);
  
  const handleTimerEvent = (event) => {
    if (event.event === 'timeUpdate') {
      setRemainingTime(event.remaining);
      setElapsedTime(event.elapsed);
      setPercentage((event.remaining / initialTime) * 100);
    } else if (event.event === 'timeExpired') {
      handleTimeExpired();
    } else if (event.event === 'sessionPaused') {
      setIsActive(false);
    } else if (event.event === 'sessionResumed') {
      setIsActive(true);
    }
  };
  
  const handleTimeExpired = () => {
    // Show an immediate notification
    NotificationService.showNotification(
      'Time Expired',
      `Your time for ${appId} has run out. You can earn more by answering questions!`
    );
    
    // Navigate back to home
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };
  
  // Get color based on remaining percentage
  const getProgressColor = () => {
    if (percentage > 50) return '#4CAF50'; // Green
    if (percentage > 20) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };
  
  const handleEndSession = () => {
    // Stop the timer
    TimerService.stopAppTimer();
    
    // Cancel all notifications
    NotificationService.cancelAllNotifications();
    
    // Navigate back
    navigation.goBack();
  };
  
  return (
    <Animated.View 
      style={[
        styles.container,
        // Apply pulse animation if time is low
        remainingTime < 300 && { transform: [{ scale: pulseAnim }] }
      ]}
    >
      <View style={styles.content}>
        <View style={styles.timeHeader}>
          <Icon 
            name={isActive ? "clock-outline" : "clock-pause-outline"} 
            size={24} 
            color={remainingTime < 300 ? "#F44336" : "#FF9F1C"} 
          />
          <Text style={[
            styles.timeText,
            remainingTime < 300 && styles.lowTimeText
          ]}>
            {TimerService.formatTime(remainingTime)}
          </Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${percentage}%`, backgroundColor: getProgressColor() }
            ]} 
          />
        </View>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {isActive ? `Using ${appId}` : 'Session paused'}
          </Text>
          <Text style={styles.elapsedText}>
            Elapsed: {TimerService.formatTime(elapsedTime)}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.endButton} onPress={handleEndSession}>
          <Text style={styles.endButtonText}>End Session</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingTop: 40, // Account for status bar
    paddingBottom: 16,
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  content: {
    alignItems: 'center',
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 24,
    color: '#333',
  },
  lowTimeText: {
    color: '#F44336',
  },
  progressContainer: {
    height: 6,
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  elapsedText: {
    fontSize: 14,
    color: '#666',
  },
  endButton: {
    backgroundColor: '#FF9F1C',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  endButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default SessionManager;