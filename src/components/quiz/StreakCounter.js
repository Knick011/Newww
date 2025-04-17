// src/components/quiz/StreakCounter.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const StreakCounter = ({ streak }) => {
  const [prevStreak, setPrevStreak] = useState(streak);
  const scaleAnim = useState(new Animated.Value(1))[0];
  
  // Add animation when streak increases
  useEffect(() => {
    if (streak > prevStreak) {
      // Run animation sequence
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
    setPrevStreak(streak);
  }, [streak, prevStreak, scaleAnim]);
  
  const isMilestone = streak > 0 && streak % 5 === 0;
  
  return (
    <Animated.View 
      style={[
        styles.container,
        isMilestone && styles.milestone,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <Icon 
        name="fire" 
        size={16} 
        color={streak > 0 ? '#FF9F1C' : '#ccc'} 
      />
      <Text style={[
        styles.text,
        isMilestone && styles.milestoneText
      ]}>
        {streak}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  milestone: {
    backgroundColor: '#FF9F1C',
  },
  text: {
    marginLeft: 4,
    fontWeight: '600',
    color: '#333',
  },
  milestoneText: {
    color: 'white',
  }
});

export default StreakCounter;
