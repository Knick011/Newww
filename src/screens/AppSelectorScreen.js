// src/screens/AppSelectorScreen.js (updated with time expiration alert)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppLauncher from '../services/AppLauncher';
import TimerService from '../services/TimerService';
import TimeExpiredAlert from '../components/common/TimeExpiredAlert';

const AppSelectorScreen = ({ navigation }) => {
  const [apps, setApps] = useState([]);
  const [installedApps, setInstalledApps] = useState([]);
  const [availableTime, setAvailableTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showTimeExpiredAlert, setShowTimeExpiredAlert] = useState(false);
  
  useEffect(() => {
    // Load available apps and check which are installed
    const loadApps = async () => {
      setLoading(true);
      
      // Get available apps
      const appList = AppLauncher.getAppList();
      setApps(appList);
      
      // Check which apps are installed
      const installedAppIds = [];
      for (const app of appList) {
        const isInstalled = await AppLauncher.isAppInstalled(app.id);
        if (isInstalled) {
          installedAppIds.push(app.id);
        }
      }
      
      setInstalledApps(installedAppIds);
      setLoading(false);
    };
    
    // Get available time
    setAvailableTime(TimerService.getAvailableTime());
    
    // Set up timer event listener
    const removeListener = TimerService.addEventListener(handleTimerEvent);
    
    loadApps();
    
    return () => {
      removeListener();
    };
  }, []);
  
  const handleTimerEvent = (event) => {
    if (event.event === 'timeUpdate' || event.event === 'creditsAdded') {
      setAvailableTime(TimerService.getAvailableTime());
    } else if (event.event === 'timeExpired') {
      setShowTimeExpiredAlert(true);
    }
  };
  
  const handleSelectApp = async (app) => {
    // Check if app is installed
    if (!installedApps.includes(app.id)) {
      alert(`${app.name} is not installed on your device.`);
      return;
    }
    
    // Check if we have enough time
    if (availableTime <= 0) {
      setShowTimeExpiredAlert(true);
      return;
    }
    
    // Launch the app
    const success = await AppLauncher.launchApp(app.id);
    
    if (success) {
      // Return to home screen after launching
      navigation.navigate('Home');
    } else {
      alert(`Could not launch ${app.name}. Please try again.`);
    }
  };
  
  const handleTimeExpiredContinue = () => {
    setShowTimeExpiredAlert(false);
    navigation.navigate('Quiz');
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose an App</Text>
          <View style={styles.timeDisplay}>
            <Icon name="clock-outline" size={24} color="#FF9F1C" />
            <Text style={styles.timeText}>
              {TimerService.formatTime(availableTime)}
            </Text>
          </View>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading apps...</Text>
          </View>
        ) : (
          <FlatList
            data={apps}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.appGrid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.appItem,
                  !installedApps.includes(item.id) && styles.appNotInstalled
                ]}
                onPress={() => handleSelectApp(item)}
                disabled={!installedApps.includes(item.id)}
              >
                <View style={[styles.appIcon, { backgroundColor: item.backgroundColor }]}>
                  <Icon name={item.icon} size={40} color={item.color} />
                </View>
                <Text style={styles.appName}>{item.name}</Text>
                
                {!installedApps.includes(item.id) && (
                  <View style={styles.notInstalledBadge}>
                    <Text style={styles.notInstalledText}>Not Installed</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        )}
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TimeExpiredAlert 
          visible={showTimeExpiredAlert} 
          onContinue={handleTimeExpiredContinue}
        />
      </View>
    </SafeAreaView>
  );
};

// Styles remain the same as before
const styles = StyleSheet.create({
  // ...same styles as before
});

export default AppSelectorScreen;
