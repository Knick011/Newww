// src/components/rewards/TimeTracker.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TimerService from '../../services/TimerService';

const TimeTracker = ({ activeApp, onTimeExpired, onReturn }) => {
  const [remainingTime, setRemainingTime] = useState(0);
  const [percentage, setPercentage] = useState(100);
  const [initialTime, setInitialTime] = useState(0);
  
  useEffect(() => {
    // Get initial time
    const time = TimerService.getAvailableTime();
    setRemainingTime(time);
    setInitialTime(time);
    
    // Set up listener for time updates
    const removeListener = TimerService.addEventListener(handleTimerEvent);
    
    return () => {
      removeListener();
    };
  }, []);
  
  const handleTimerEvent = (event) => {
    if (event.event === 'timeUpdate') {
      setRemainingTime(event.remaining);
      setPercentage((event.remaining / initialTime) * 100);
    } else if (event.event === 'timeExpired') {
      if (onTimeExpired) onTimeExpired();
    }
  };
  
  // Get color based on remaining percentage
  const getProgressColor = () => {
    if (percentage > 50) return '#4CAF50'; // Green
    if (percentage > 20) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.timeDisplay}>
          <Icon name="clock-outline" size={20} color="#FF9F1C" />
          <Text style={styles.timeText}>
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
        
        <TouchableOpacity style={styles.returnButton} onPress={onReturn}>
          <Text style={styles.returnText}>Return</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    paddingBottom: 10,
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timeText: {
    marginLeft: 6,
    fontWeight: 'bold',
    color: '#333',
  },
  progressContainer: {
    height: 4,
    flex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  returnButton: {
    backgroundColor: '#FF9F1C',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  returnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default TimeTracker;
