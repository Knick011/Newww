// src/screens/LeaderboardScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import AuthService from '../services/AuthService';

const LeaderboardScreen = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchLeaderboard();
  }, []);
  
  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('https://brain-bites-api.onrender.com/api/leaderboard', {
        headers: {
          'Authorization': `Bearer ${AuthService.getToken()}`
        }
      });
      
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const renderLeaderboardItem = ({ item, index }) => (
    <View style={[styles.leaderboardItem, index < 3 ? styles.topThree : null]}>
      <Text style={styles.rank}>{index + 1}</Text>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.score}>{item.totalPoints} points</Text>
      </View>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Global Leaderboard</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#FF9F1C" />
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.userId.toString()}
          renderItem={renderLeaderboardItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Styles here...
});

export default LeaderboardScreen;