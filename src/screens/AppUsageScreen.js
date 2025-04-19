// src/screens/AppUsageScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Linking,
  Platform,
  ScrollView,
  Image,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TimerService from '../services/TimerService';
import NotificationService from '../services/NotificationService';
import SessionManager from '../components/session/SessionManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppUsageScreen = ({ route, navigation }) => {
  const { appId, appName, appIcon, appColor } = route.params;
  const [availableTime, setAvailableTime] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [strictMode, setStrictMode] = useState(false);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  
  useEffect(() => {
    // Initialize notification service
    NotificationService.initialize();
    
    // Get available time
    const time = TimerService.getAvailableTime();
    setAvailableTime(time);
    
    // Check if a session is already active
    const activeSession = TimerService.getCurrentSession();
    if (activeSession && activeSession.appId === appId) {
      setSessionActive(true);
    }
    
    // Set up timer event listener
    const removeListener = TimerService.addEventListener(handleTimerEvent);
    
    // Load strictMode setting
    loadSettings();
    
    return () => {
      removeListener();
    };
  }, []);
  
  const loadSettings = async () => {
    try {
      const strictModeSetting = await AsyncStorage.getItem('brainbites_strict_mode');
      setStrictMode(strictModeSetting === 'true');
      
      // On Android, check if accessibility service is enabled
      if (Platform.OS === 'android') {
        // In a real implementation, you'd check if the accessibility service is enabled
        // For now, we'll just set it to false
        setAccessibilityEnabled(false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };
  
  const handleTimerEvent = (event) => {
    if (event.event === 'timeUpdate' || event.event === 'creditsAdded') {
      setAvailableTime(event.remaining || TimerService.getAvailableTime());
    } else if (event.event === 'sessionStarted') {
      setSessionActive(true);
    } else if (event.event === 'sessionEnded' || event.event === 'timeExpired') {
      setSessionActive(false);
    }
  };
  
  const handleStartSession = async () => {
    if (availableTime <= 0) {
      Alert.alert(
        'No Time Available',
        'You need to earn more time by answering questions.',
        [
          { text: 'Go to Quiz', onPress: () => navigation.navigate('Quiz') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }
    
    // For strictMode on Android, direct user to enable Accessibility Service
    if (strictMode && Platform.OS === 'android' && !accessibilityEnabled) {
      Alert.alert(
        'Accessibility Service Required',
        'Strict mode requires enabling the Accessibility Service to monitor app usage.',
        [
          { 
            text: 'Enable Now', 
            onPress: () => {
              // In a real implementation, you'd direct to Accessibility Settings
              // Linking.openSettings();
              Alert.alert('This would redirect to Accessibility Settings');
            } 
          },
          { 
            text: 'Use Normal Mode', 
            onPress: () => {
              setStrictMode(false);
              AsyncStorage.setItem('brainbites_strict_mode', 'false');
              startNormalSession();
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }
    
    if (strictMode && Platform.OS === 'android' && accessibilityEnabled) {
      startStrictSession();
    } else {
      startNormalSession();
    }
  };
  
  const startNormalSession = () => {
    // Start tracking time with TimerService
    const success = TimerService.startAppTimer(appId);
    
    if (success) {
      setSessionActive(true);
      
      // Schedule notifications
      const timeRemaining = TimerService.getAvailableTime();
      NotificationService.scheduleSessionReminders(appName, timeRemaining);
      
      // Attempt to launch the app if it's a real app (not a test/demo app)
      if (!appId.startsWith('demo_')) {
        launchExternalApp(appId);
      }
    } else {
      Alert.alert(
        'Failed to Start Session',
        'There was an error starting your session. Please try again.'
      );
    }
  };
  
  // This would only be used on Android with strict mode
  const startStrictSession = () => {
    // In a real implementation, this would communicate with the AccessibilityService
    Alert.alert(
      'Strict Mode Active',
      `BrainBites will monitor your usage of ${appName} and automatically close it when your time expires.`,
      [{ text: 'OK' }]
    );
    
    // Start the session in TimerService anyway
    TimerService.startAppTimer(appId);
    setSessionActive(true);
    
    // Launch the app
    launchExternalApp(appId);
  };
  
  const launchExternalApp = (appScheme) => {
    // Map app IDs to their URL schemes
    const appSchemes = {
      'facebook': 'fb://',
      'instagram': 'instagram://',
      'tiktok': 'tiktok://',
      'twitter': 'twitter://',
      'youtube': 'youtube://',
      'snapchat': 'snapchat://',
      // Add more apps as needed
    };
    
    const scheme = appSchemes[appScheme] || appScheme;
    
    // Attempt to open the app
    Linking.canOpenURL(scheme).then(supported => {
      if (supported) {
        Linking.openURL(scheme);
      } else {
        console.warn(`Cannot open URL: ${scheme}`);
        Alert.alert(
          'App Not Found',
          `Could not open ${appName}. The app may not be installed.`
        );
      }
    }).catch(err => {
      console.error('Error opening external app:', err);
    });
  };
  
  const handleEndSession = () => {
    // Stop the timer
    TimerService.stopAppTimer();
    
    // Cancel all notifications
    NotificationService.cancelAllNotifications();
    
    setSessionActive(false);
  };
  
  const getAppIconComponent = () => {
    // For demo apps or if icon is a string (Material icon name)
    if (typeof appIcon === 'string') {
      return (
        <View style={[styles.appIconContainer, { backgroundColor: appColor || '#FF9F1C' }]}>
          <Icon name={appIcon} size={60} color="white" />
        </View>
      );
    }
    
    // If it's an image source
    return (
      <Image source={appIcon} style={styles.appIconImage} resizeMode="contain" />
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FFF8E7" barStyle="dark-content" />
      
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>{sessionActive ? 'Session Active' : 'Use App Time'}</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.appInfoContainer}>
          {getAppIconComponent()}
          
          <Text style={styles.appName}>{appName}</Text>
          
          <View style={styles.timeInfoContainer}>
            <Icon name="clock-outline" size={24} color="#FF9F1C" />
            <Text style={styles.timeInfoText}>
              {sessionActive 
                ? `Session in progress (${TimerService.formatTime(availableTime)} left)`
                : `${TimerService.formatTime(availableTime)} available`
              }
            </Text>
          </View>
        </View>
        
        {!sessionActive ? (
          <View style={styles.controlsContainer}>
            <Text style={styles.sectionTitle}>Start a New Session</Text>
            
            <Text style={styles.instructionText}>
              When you start a session, BrainBites will track your usage time for {appName}.
              {Platform.OS === 'android' && strictMode 
                ? ' Strict mode will automatically close the app when your time expires.'
                : ' You\'ll receive notifications to let you know how much time remains.'
              }
            </Text>
            
            {Platform.OS === 'android' && (
              <View style={styles.modeSelector}>
                <Text style={styles.modeTitle}>Usage Mode:</Text>
                
                <View style={styles.modeOptions}>
                  <TouchableOpacity 
                    style={[
                      styles.modeOption,
                      !strictMode && styles.modeOptionSelected
                    ]}
                    onPress={() => {
                      setStrictMode(false);
                      AsyncStorage.setItem('brainbites_strict_mode', 'false');
                    }}
                  >
                    <Text style={[
                      styles.modeOptionText,
                      !strictMode && styles.modeOptionTextSelected
                    ]}>
                      Normal
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.modeOption,
                      strictMode && styles.modeOptionSelected
                    ]}
                    onPress={() => {
                      setStrictMode(true);
                      AsyncStorage.setItem('brainbites_strict_mode', 'true');
                    }}
                  >
                    <Text style={[
                      styles.modeOptionText,
                      strictMode && styles.modeOptionTextSelected
                    ]}>
                      Strict
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            <TouchableOpacity 
              style={[
                styles.startButton,
                availableTime <= 0 && styles.disabledButton
              ]}
              onPress={handleStartSession}
              disabled={availableTime <= 0}
            >
              <Icon name="play-circle-outline" size={20} color="white" />
              <Text style={styles.startButtonText}>
                {availableTime <= 0 ? 'No Time Available' : `Start ${appName} Session`}
              </Text>
            </TouchableOpacity>
            
            {availableTime <= 0 && (
              <TouchableOpacity 
                style={styles.earnMoreButton}
                onPress={() => navigation.navigate('Quiz')}
              >
                <Icon name="plus-circle-outline" size={20} color="white" />
                <Text style={styles.earnMoreButtonText}>
                  Earn More Time
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.activeSessionContainer}>
            <Text style={styles.sectionTitle}>Session In Progress</Text>
            
            <View style={styles.sessionInfoCard}>
              <Text style={styles.sessionInfoText}>
                Your {appName} session is active. You can continue using the app 
                {strictMode && Platform.OS === 'android' 
                  ? ' until your time expires, at which point it will automatically close.'
                  : ' and you\'ll receive notifications about your remaining time.'
                }
              </Text>
              
              <TouchableOpacity 
                style={styles.endSessionButton}
                onPress={handleEndSession}
              >
                <Icon name="stop-circle-outline" size={20} color="white" />
                <Text style={styles.endSessionButtonText}>
                  End Session
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.noteText}>
              Note: Ending your session early will save your remaining time for later.
            </Text>
          </View>
        )}
      </ScrollView>
      
      {/* Session Manager overlay if session is active */}
      {sessionActive && !strictMode && (
        <SessionManager 
          navigation={navigation}
          appId={appName}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  appInfoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appIconImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  timeInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  timeInfoText: {
    marginLeft: 8,
    fontWeight: '600',
    color: '#333',
  },
  controlsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  modeSelector: {
    marginBottom: 20,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  modeOptions: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modeOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeOptionSelected: {
    backgroundColor: '#FF9F1C',
  },
  modeOptionText: {
    color: '#666',
  },
  modeOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#FF9F1C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 30,
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  startButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  earnMoreButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 30,
  },
  earnMoreButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  activeSessionContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sessionInfoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sessionInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  endSessionButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 30,
  },
  endSessionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default AppUsageScreen;