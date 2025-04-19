// src/screens/AccessibilitySetupScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Image,
  Platform,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import StrictModeService from '../services/StrictModeService';

const AccessibilitySetupScreen = ({ navigation, route }) => {
  const [isServiceEnabled, setIsServiceEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const { returnToScreen } = route.params || { returnToScreen: 'Settings' };
  
  useEffect(() => {
    // Only run this on Android
    if (Platform.OS !== 'android') {
      navigation.replace(returnToScreen);
      return;
    }
    
    checkAccessibilityService();
    
    // Check service status when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      checkAccessibilityService();
    });
    
    return unsubscribe;
  }, [navigation]);
  
  const checkAccessibilityService = async () => {
    setLoading(true);
    const enabled = await StrictModeService.isAccessibilityServiceEnabled();
    setIsServiceEnabled(enabled);
    setLoading(false);
    
    // If service is enabled and we were directed here from AppUsage screen,
    // navigate back there since setup is complete
    if (enabled && returnToScreen === 'AppUsage') {
      navigation.goBack();
    }
  };
  
  const handleOpenSettings = async () => {
    await StrictModeService.openAccessibilitySettings();
  };
  
  const handleSkip = () => {
    if (returnToScreen === 'AppUsage') {
      // Notify user that strict mode won't be available
      Alert.alert(
        'Skip Strict Mode Setup',
        'Without enabling the Accessibility Service, you won\'t be able to use Strict Mode. Your session will continue in Normal Mode.',
        [
          { text: 'Continue in Normal Mode', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      // Just go back to settings
      navigation.goBack();
    }
  };
  
  // If not on Android, don't show this screen
  if (Platform.OS !== 'android') {
    return null;
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Enable Strict Mode</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Icon name="shield-lock-outline" size={80} color="#FF9F1C" />
          </View>
          
          <Text style={styles.heading}>
            {isServiceEnabled 
              ? 'Strict Mode is Ready!' 
              : 'Accessibility Service Required'
            }
          </Text>
          
          <Text style={styles.description}>
            {isServiceEnabled 
              ? 'You have successfully enabled the Accessibility Service. BrainBites can now monitor and enforce app time limits automatically.'
              : 'To use Strict Mode, BrainBites needs permission to monitor which apps are in use. This allows the app to enforce time limits automatically.'
            }
          </Text>
          
          <View style={styles.stepsContainer}>
            {!isServiceEnabled && (
              <>
                <Text style={styles.stepTitle}>Here's how to enable it:</Text>
                
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Tap the "Open Settings" button below
                  </Text>
                </View>
                
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Find and tap on "BrainBites" in the list
                  </Text>
                </View>
                
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Toggle the switch to turn on the service
                  </Text>
                </View>
                
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>4</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Tap "Allow" on the confirmation dialog
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
        
        <View style={styles.footer}>
          {isServiceEnabled ? (
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={handleOpenSettings}
              >
                <Icon name="cog" size={20} color="white" />
                <Text style={styles.settingsButtonText}>Open Settings</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.skipButton}
                onPress={handleSkip}
              >
                <Text style={styles.skipButtonText}>
                  Skip (Use Normal Mode)
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
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
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  stepsContainer: {
    alignSelf: 'stretch',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF9F1C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#444',
  },
  footer: {
    marginTop: 8,
    marginBottom: 24,
  },
  settingsButton: {
    backgroundColor: '#FF9F1C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 16,
  },
  settingsButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 30,
  },
  continueButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AccessibilitySetupScreen;