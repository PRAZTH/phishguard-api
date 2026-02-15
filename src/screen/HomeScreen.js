import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  Vibration,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

// 👇 UPDATED: Uses your IP
const SERVER_URL = "https://phishguard-api-1-t6wy.onrender.com/scan"; 
const { width, height } = Dimensions.get('window');

export default function HomeScreen({ onNavigate }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null); 
  const [modalVisible, setModalVisible] = useState(false);

  const handleUrlScan = async () => {
    if (!url) {
      Alert.alert("Empty URL", "Please enter a website address first.");
      return;
    }
    
    setLoading(true);
    setScanResult(null);

    try {
      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url }),
      });
      const data = await response.json();
      
      // Artificial delay
      setTimeout(async () => {
        setLoading(false);

        if (data.error) {
          Alert.alert("Server Error", data.error);
        } else {
          const resultStatus = data.result; 
          setScanResult(resultStatus);
          setModalVisible(true);
          
          if (resultStatus === 'Safe') {
            Vibration.vibrate(100); 
          } else {
            Vibration.vibrate([0, 500, 200, 500]); 
          }

          const newLog = {
            id: Date.now().toString(),
            url: data.url,
            result: resultStatus,
            confidence: data.confidence,
            date: new Date().toLocaleString()
          };
          const existingHistory = await AsyncStorage.getItem('scanHistory');
          const historyArray = existingHistory ? JSON.parse(existingHistory) : [];
          historyArray.unshift(newLog);
          await AsyncStorage.setItem('scanHistory', JSON.stringify(historyArray));
        }
      }, 1000); 

    } catch (error) {
      setLoading(false);
      Alert.alert("Connection Error", "Check your server IP and ensure it's running.");
    }
  };

  const closeResult = () => {
    setModalVisible(false);
    setUrl('');
    setScanResult(null);
  };

  return (
    <View style={styles.mainContainer}>
      <Video
        source={require('../../assets/HomeScreenbg.mp4')}
        style={styles.backgroundVideo}
        rate={1.0}
        volume={1.0}
        isMuted={true}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
      />
      <View style={styles.overlay} />

      {/* 👇 Profile Button */}
      <TouchableOpacity 
        style={styles.profileButton} 
        onPress={() => onNavigate('Profile')}
      >
        <Ionicons name="person-circle-outline" size={45} color="#fff" />
      </TouchableOpacity>

      {/* 👇 Logout Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('Auth')}>
        <Ionicons name="log-out-outline" size={30} color="#fff" />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          
          <View style={{alignItems: 'center', marginBottom: 20}}>
            {loading ? (
               // 👇 TEMPORARY: Using an Icon instead of Lottie to stop the crash
               <Ionicons name="scan-circle" size={150} color="#00d2d3" />
            ) : (
                <>
                    <Text style={styles.title}>PhishGuard</Text>
                    <Text style={styles.subtitle}>AI-Powered Protection</Text>
                </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Enter Website URL:</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
              editable={!loading}
            />

            <TouchableOpacity 
                style={[styles.blueButton, loading && {opacity: 0.7}]} 
                onPress={handleUrlScan} 
                disabled={loading}
            >
              <Text style={styles.btnText}>
                  {loading ? "SCANNING..." : "🔍 SCAN URL"}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} /><Text style={styles.orText}>OR</Text><View style={styles.line} />
            </View>

            <View style={styles.rowButtons}>
                <TouchableOpacity style={styles.orangeButton} onPress={() => onNavigate('Sms')}>
                <Ionicons name="clipboard" size={24} color="white" />
                <Text style={styles.smallBtnText}>SMS</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.greenButton} onPress={() => onNavigate('QR')}>
                <Ionicons name="qr-code" size={24} color="white" />
                <Text style={styles.smallBtnText}>QR</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.greyButton} onPress={() => onNavigate('History')}>
                <Ionicons name="time" size={24} color="white" />
                <Text style={styles.smallBtnText}>History</Text>
                </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeResult}
      >
        <View style={styles.modalOverlay}>
            <View style={[
                styles.modalCard, 
                scanResult === 'Safe' ? styles.safeBorder : styles.dangerBorder
            ]}>
                
                {/* 👇 TEMPORARY: Icon instead of Lottie */}
                <Ionicons 
                    name={scanResult === 'Safe' ? "checkmark-circle" : "warning"} 
                    size={100} 
                    color={scanResult === 'Safe' ? "#00b894" : "#d63031"} 
                />

                <Text style={[
                    styles.resultTitle, 
                    { color: scanResult === 'Safe' ? '#00b894' : '#d63031' }
                ]}>
                    {scanResult === 'Safe' ? "WEBSITE IS SAFE" : "⚠️ THREAT DETECTED"}
                </Text>
                
                <Text style={styles.resultDesc}>
                    {scanResult === 'Safe' 
                        ? "This website passed our security checks. It appears safe to visit." 
                        : "This URL shows signs of phishing or malware. Do not enter personal info!"}
                </Text>

                <TouchableOpacity 
                    style={[styles.closeButton, { backgroundColor: scanResult === 'Safe' ? '#00b894' : '#d63031' }]} 
                    onPress={closeResult}
                >
                    <Text style={styles.btnText}>CLOSE</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000' },
  backgroundVideo: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, width: width, height: height },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' }, 
  
  profileButton: { position: 'absolute', top: 50, right: 20, zIndex: 20, padding: 5 },
  backButton: { position: 'absolute', top: 55, left: 20, zIndex: 20, padding: 5 },

  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  
  title: { fontSize: 38, fontWeight: '800', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#00d2d3', marginTop: 5, fontWeight: '600' },
  
  card: { width: '100%', backgroundColor: 'rgba(255,255,255,0.95)', padding: 25, borderRadius: 20, elevation: 10 },
  label: { marginBottom: 10, fontWeight: 'bold', color: '#2d3436' },
  input: { borderWidth: 1, borderColor: '#dfe6e9', padding: 15, borderRadius: 12, marginBottom: 20, fontSize: 16, backgroundColor: '#fff' },
  
  blueButton: { backgroundColor: '#0984e3', padding: 18, borderRadius: 12, alignItems: 'center', shadowColor: "#000", shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  line: { flex: 1, height: 1, backgroundColor: '#b2bec3' },
  orText: { marginHorizontal: 10, color: '#636e72', fontWeight: 'bold' },
  
  rowButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  orangeButton: { backgroundColor: '#e67e22', padding: 15, borderRadius: 12, alignItems: 'center', width: '30%' },
  greenButton: { backgroundColor: '#00b894', padding: 15, borderRadius: 12, alignItems: 'center', width: '30%' },
  greyButton: { backgroundColor: '#636e72', padding: 15, borderRadius: 12, alignItems: 'center', width: '30%' },
  smallBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginTop: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', backgroundColor: '#fff', borderRadius: 25, padding: 30, alignItems: 'center', borderWidth: 4 },
  safeBorder: { borderColor: '#00b894' },
  dangerBorder: { borderColor: '#d63031' },
  resultTitle: { fontSize: 24, fontWeight: '900', marginTop: 20, textAlign: 'center' },
  resultDesc: { fontSize: 16, color: '#636e72', textAlign: 'center', marginVertical: 15, lineHeight: 22 },
  closeButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, marginTop: 10 }
});