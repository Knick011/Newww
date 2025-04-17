import React, { useEffect } from 'react';
import { SafeAreaView, StatusBar, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import QuizScreen from './src/screens/QuizScreen';
import AppSelectorScreen from './src/screens/AppSelectorScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Import services
import TimerService from './src/services/TimerService';

// Create the navigator
const Stack = createStackNavigator();

const App = () => {
  // Setup and cleanup for services
  useEffect(() => {
    // Initialize services if needed
    
    // Cleanup when app unmounts
    return () => {
      TimerService.cleanup();
    };
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8E7" />
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#FFF8E7' }
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Quiz" component={QuizScreen} />
          <Stack.Screen name="AppSelector" component={AppSelectorScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default App;