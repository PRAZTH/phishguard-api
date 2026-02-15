import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar, ActivityIndicator, AppState, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 👈 No Firebase
import * as Notifications from 'expo-notifications';
import * as Clipboard from 'expo-clipboard';

// Import Screens
import AuthScreen from './src/screen/AuthScreen';
import HomeScreen from './src/screen/HomeScreen';
import QRScannerScreen from './src/screen/QRScannerScreen';
import HistoryScreen from './src/screen/HistoryScreen';
import SmsScreen from './src/screen/SmsScreen';
import ProfileScreen from './src/screen/Profile'; 

// 👇 UPDATED IP: Match your server
const SERVER_URL = "https://phishguard-api-1-t6wy.onrender.com";

// Configure Notifications to show alert even when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Auth');
  const [initializing, setInitializing] = useState(true);

  // Refs to track state without re-rendering issues
  const appState = useRef(AppState.currentState);
  const lastScannedLink = useRef('');

  useEffect(() => {
    checkLoginStatus();
    requestPermissions();

    // 👇 BACKGROUND LISTENER: Scans clipboard when you open the app
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log("App active! Checking clipboard...");
        setTimeout(autoScanClipboard, 500); // Small delay for OS permission
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permission denied');
    }
  };

  const checkLoginStatus = async () => {
    try {
        const userSession = await AsyncStorage.getItem('user_session');
        if (userSession) {
            setCurrentScreen('Home');
        } else {
            setCurrentScreen('Auth');
        }
    } catch (e) {
        console.log("Login check failed");
    } finally {
        setInitializing(false);
    }
  };

  // 👇 IMPROVED AUTO-SCANNER
  const autoScanClipboard = async () => {
    try {
      const hasString = await Clipboard.hasStringAsync();
      if (!hasString) return;

      const text = await Clipboard.getStringAsync();
      
      // Regex that catches standard URLs AND "viapp.onelink.me" styles
      const urlRegex = /((https?:\/\/)|(www\.)|(?:[a-zA-Z0-9-]+\.)+[a-z]{2,})[^\s]*/gi;
      const matches = text.match(urlRegex);

      if (matches && matches[0]) {
        let foundUrl = matches[0];

        // Normalization: Add https:// if missing so backend understands it
        if (!foundUrl.startsWith('http')) {
            foundUrl = 'https://' + foundUrl;
        }

        // Prevent looping on the same link
        if (foundUrl === lastScannedLink.current) return;
        lastScannedLink.current = foundUrl; 

        console.log("🔍 Auto-Scanning URL:", foundUrl);
        
        // Send to Backend
        try {
            const response = await fetch(SERVER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: foundUrl }),
            });
            const data = await response.json();

            // Notify ONLY if dangerous
            if (data.result === 'Phishing' || data.result === 'Suspicious') {
                triggerWarningNotification(data.url, data.result);
            }
        } catch (serverError) {
            console.log("Backend unreachable during background scan");
        }
      }
    } catch (error) {
      console.log("Clipboard scan error:", error);
    }
  };

  const triggerWarningNotification = async (url, type) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⚠️ THREAT DETECTED",
        body: `Copied link is ${type}: ${url}`,
        data: { url: url },
      },
      trigger: null,
    });
  };

  const navigate = (screen) => {
    // Logout Logic
    if (screen === 'Auth') {
        AsyncStorage.removeItem('user_session');
        setCurrentScreen('Auth');
    } else {
        setCurrentScreen(screen);
    }
  };

  const handleLoginSuccess = () => {
    setCurrentScreen('Home');
  };

  if (initializing) {
    return (
      <View style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
        <ActivityIndicator size="large" color="#0984e3" />
      </View>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Auth': return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
      case 'Home': return <HomeScreen onNavigate={navigate} />;
      case 'Profile': return <ProfileScreen onNavigate={navigate} />;
      case 'QR': return <QRScannerScreen onNavigate={navigate} />;
      case 'History': return <HistoryScreen onNavigate={navigate} />;
      case 'Sms': return <SmsScreen onNavigate={navigate} />;
      default: return <HomeScreen onNavigate={navigate} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});