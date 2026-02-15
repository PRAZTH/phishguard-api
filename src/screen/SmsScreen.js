import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, 
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, 
  ImageBackground, Dimensions, Linking, AppState, Vibration 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons'; 

// 👇 UPDATED: Pointing to the base Render URL
const SERVER_URL = "https://phishguard-api-1-t6wy.onrender.com";
const { width, height } = Dimensions.get('window');

export default function SmsScreen({ onNavigate }) {
  const [smsText, setSmsText] = useState('');
  const [loading, setLoading] = useState(false);
  const appState = React.useRef(AppState.currentState);

  const extractUrlFromText = (text) => {
    const urlRegex = /((https?:\/\/)|(www\.)|(?:[a-zA-Z0-9-]+\.)+[a-z]{2,})[^\s]*/gi;
    const matches = text.match(urlRegex);
    return matches ? matches[0] : null;
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        setTimeout(checkClipboard, 500);
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  const checkClipboard = async () => {
    const hasString = await Clipboard.hasStringAsync();
    if (hasString) {
        const text = await Clipboard.getStringAsync();
        if (text && text.length > 0) setSmsText(text);
    }
  };

  const openMessagesApp = async () => {
    const url = Platform.OS === 'ios' ? 'message:' : 'sms:'; 
    try { await Linking.openURL(url); } catch (err) { Alert.alert("Error", "Could not open SMS app."); }
  };

  const handleScan = async () => {
    if (!smsText) { Alert.alert("Empty", "Please paste an SMS message first."); return; }
    
    let foundUrl = extractUrlFromText(smsText);
    
    if (!foundUrl) { 
        Alert.alert("No Link Found", "This message doesn't contain a recognizable link."); 
        return; 
    }

    if (!foundUrl.startsWith('http')) {
        foundUrl = 'https://' + foundUrl;
    }

    setLoading(true);
    try {
      // 👇 UPDATED: Correct endpoint path
      const response = await fetch(`${SERVER_URL}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: foundUrl }),
      });
      const data = await response.json();
      setLoading(false);

      if (data.error) {
        Alert.alert("Server Error", data.error);
      } else {
        // --- VIBRATION FEEDBACK ---
        if (data.result !== "Safe") {
            Vibration.vibrate([0, 500, 200, 500]); // Danger pattern: Long pulses
        } else {
            Vibration.vibrate(100); // Short pulse for safe
        }

        const newLog = { 
            id: Date.now().toString(), 
            url: data.url, 
            result: data.result, 
            confidence: data.confidence, 
            date: new Date().toLocaleString() 
        };
        const existingHistory = await AsyncStorage.getItem('scanHistory');
        const historyArray = existingHistory ? JSON.parse(existingHistory) : [];
        historyArray.unshift(newLog);
        await AsyncStorage.setItem('scanHistory', JSON.stringify(historyArray));

        Alert.alert(
            data.result === "Safe" ? "✅ SAFE" : "⚠️ THREAT DETECTED",
            `Confidence: ${data.confidence}\n\n${data.explanation ? data.explanation.join('\n') : ''}`
        );
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Connection Failed", "Backend is unreachable. Check Render logs.");
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ImageBackground
        source={require('../../assets/smsbg.jpeg')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.header}>
                <Ionicons name="chatbubble-ellipses" size={50} color="#fff" />
                <Text style={styles.title}>SMS Guard</Text>
                <Text style={styles.subtitle}>Scan links from messages</Text>
            </View>
            
            <View style={styles.card}>
                <View style={styles.instructionBox}>
                    <Text style={styles.stepText}>1. Open Messages.</Text>
                    <Text style={styles.stepText}>2. Copy the text.</Text>
                    <Text style={styles.stepText}>3. Return here.</Text>
                </View>

                <TouchableOpacity style={styles.openAppButton} onPress={openMessagesApp}>
                    <Ionicons name="chatbox-ellipses-outline" size={20} color="#fff" style={{marginRight: 10}}/>
                    <Text style={styles.btnTextSmall}>OPEN MESSAGES APP</Text>
                </TouchableOpacity>

                <TextInput 
                    style={styles.textArea} 
                    placeholder="Waiting for copied text..." 
                    value={smsText} 
                    onChangeText={setSmsText} 
                    multiline={true} 
                    numberOfLines={4} 
                    textAlignVertical="top" 
                />
                
                <TouchableOpacity style={styles.orangeButton} onPress={handleScan} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>🔍 SCAN MESSAGE</Text>}
                </TouchableOpacity>

                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.greyButton} onPress={async () => {
                        const text = await Clipboard.getStringAsync();
                        setSmsText(text);
                    }}>
                        <Ionicons name="clipboard-outline" size={18} color="#fff" />
                        <Text style={styles.btnTextSmall}> Paste</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.greyButton} onPress={() => setSmsText('')}>
                        <Ionicons name="trash-outline" size={18} color="#fff" />
                        <Text style={styles.btnTextSmall}> Clear</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('Home')}>
                    <Ionicons name="arrow-back" size={20} color="#636e72" />
                    <Text style={styles.backText}> Back to Home</Text>
                </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000' },
  backgroundImage: { flex: 1, width: width, height: height },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 5, marginTop: 10 },
  subtitle: { fontSize: 16, color: '#dfe6e9', marginBottom: 20 },
  card: { width: '100%', backgroundColor: 'rgba(255,255,255,0.95)', padding: 25, borderRadius: 20, elevation: 10 },
  instructionBox: { backgroundColor: '#f1f2f6', padding: 10, borderRadius: 10, marginBottom: 15 },
  stepText: { fontSize: 13, color: '#2d3436', marginBottom: 4, fontWeight: '600' },
  openAppButton: { backgroundColor: '#00b894', padding: 15, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 20, elevation: 5 },
  textArea: { borderWidth: 1, borderColor: '#dfe6e9', padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16, backgroundColor: '#fff', height: 100 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  greyButton: { backgroundColor: '#636e72', padding: 10, borderRadius: 8, width: '48%', alignItems: 'center', flexDirection:'row', justifyContent:'center' },
  btnTextSmall: { color: '#fff', fontWeight: 'bold', fontSize: 13, marginLeft: 5 },
  orangeButton: { backgroundColor: '#e67e22', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 15, shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity: 0.2, elevation: 3 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backButton: { padding: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  backText: { color: '#636e72', fontSize: 16, fontWeight: '600' },
});