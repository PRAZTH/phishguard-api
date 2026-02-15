import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Alert, 
  Animated, Easing, Vibration, Modal, ActivityIndicator, Dimensions
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 👇 UPDATED IP: Ensure this matches your HomeScreen.js
const SERVER_URL = "https://phishguard-api-1-t6wy.onrender.com/scan"; 
const { width } = Dimensions.get('window');

export default function QRScannerScreen({ onNavigate }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Animation for the scanning line
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimation();
  }, []);

  const startAnimation = () => {
    slideAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ])
    ).start();
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 250], // Moves down 250 pixels (size of the frame)
  });

  if (!permission) return <View style={styles.container} />;
  
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permText}>Camera access is needed to scan QR codes.</Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
            <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButtonSimple} onPress={() => onNavigate('Home')}>
            <Text style={{color: '#aaa', marginTop: 20}}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    
    setScanned(true);
    Vibration.vibrate(100); // Haptic feedback

    // Check if it looks like a URL
    if (!data.startsWith('http')) {
        Alert.alert("Not a Website", "The scanned code is not a website URL:\n" + data, [
            { text: "Scan Again", onPress: () => setScanned(false) }
        ]);
        return;
    }

    // Determine Result
    setLoading(true);
    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: data }),
        });
        const resultData = await response.json();
        
        setLoading(false);
        setScanResult(resultData.result); // "Safe" or "Phishing"
        setModalVisible(true);
        
        // Save to History
        const newLog = {
            id: Date.now().toString(),
            url: data,
            result: resultData.result,
            confidence: resultData.confidence,
            date: new Date().toLocaleString()
        };
        const existingHistory = await AsyncStorage.getItem('scanHistory');
        const historyArray = existingHistory ? JSON.parse(existingHistory) : [];
        historyArray.unshift(newLog);
        await AsyncStorage.setItem('scanHistory', JSON.stringify(historyArray));

        // Vibration for Danger
        if (resultData.result !== 'Safe') {
            Vibration.vibrate([0, 500, 200, 500]);
        }

    } catch (error) {
        setLoading(false);
        Alert.alert("Error", "Could not connect to scanner server.", [
            { text: "OK", onPress: () => setScanned(false) }
        ]);
    }
  };

  const resetScan = () => {
    setModalVisible(false);
    setScanned(false);
    setScanResult(null);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchOn}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      
      {/* Dark Overlay with Transparent Hole */}
      <View style={styles.overlay}>
        <View style={styles.topOverlay} />
        <View style={styles.middleRow}>
            <View style={styles.sideOverlay} />
            <View style={styles.scanFrame}>
                {/* 🔴 Animated Laser Line */}
                {!scanned && (
                    <Animated.View style={[styles.laserLine, { transform: [{ translateY }] }]} />
                )}
                {/* Corner Markers */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <View style={styles.sideOverlay} />
        </View>
        <View style={styles.bottomOverlay}>
            <Text style={styles.instructionText}>
                {loading ? "Analyzing..." : "Align QR code within the frame"}
            </Text>
            {loading && <ActivityIndicator size="large" color="#00d2d3" style={{marginTop: 10}} />}
        </View>
      </View>

      {/* 🔦 Flashlight Toggle */}
      <TouchableOpacity style={styles.flashButton} onPress={() => setTorchOn(!torchOn)}>
        <Ionicons name={torchOn ? "flash" : "flash-off"} size={26} color="#fff" />
      </TouchableOpacity>

      {/* 🔙 Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('Home')}>
        <Ionicons name="close" size={30} color="#fff" />
      </TouchableOpacity>

      {/* 🛑 RESULT MODAL (Identical to Home Screen style) */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={resetScan}>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, scanResult === 'Safe' ? styles.safeBorder : styles.dangerBorder]}>
                <Ionicons 
                    name={scanResult === 'Safe' ? "checkmark-circle" : "warning"} 
                    size={80} 
                    color={scanResult === 'Safe' ? "#00b894" : "#d63031"} 
                />
                
                <Text style={[styles.resultTitle, { color: scanResult === 'Safe' ? '#00b894' : '#d63031' }]}>
                    {scanResult === 'Safe' ? "WEBSITE IS SAFE" : "⚠️ THREAT DETECTED"}
                </Text>

                <Text style={styles.resultDesc}>
                    {scanResult === 'Safe' 
                        ? "This QR code leads to a verified safe website." 
                        : "Warning! This QR code leads to a potentially malicious site."}
                </Text>
                
                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: scanResult === 'Safe' ? '#00b894' : '#d63031' }]} 
                    onPress={resetScan}
                >
                    <Text style={styles.btnText}>SCAN NEXT</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { setModalVisible(false); onNavigate('Home'); }}>
                    <Text style={{color: '#aaa', marginTop: 15, fontWeight: 'bold'}}>Back to Home</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </View>
  );
}

const overlayColor = 'rgba(0,0,0,0.7)';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  // Overlay System
  overlay: { flex: 1 },
  topOverlay: { flex: 1, backgroundColor: overlayColor },
  middleRow: { flexDirection: 'row', height: 250 },
  sideOverlay: { flex: 1, backgroundColor: overlayColor },
  bottomOverlay: { flex: 1, backgroundColor: overlayColor, alignItems: 'center', paddingTop: 20 },
  
  // Scan Frame
  scanFrame: { width: 250, height: 250, overflow: 'hidden', position: 'relative' },
  
  // Laser Animation
  laserLine: { width: '100%', height: 4, backgroundColor: '#ff3f34', shadowColor: "#ff3f34", shadowOpacity: 0.8, shadowRadius: 10, elevation: 5 },

  // Fancy Corners
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#00d2d3', borderWidth: 4 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

  instructionText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  // Controls
  flashButton: { position: 'absolute', top: 50, right: 20, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 25 },
  backButton: { position: 'absolute', top: 50, left: 20, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 25 },

  // Permission Screen
  permText: { color: '#fff', textAlign: 'center', marginTop: '50%', fontSize: 18, padding: 20 },
  permButton: { backgroundColor: '#0984e3', padding: 15, borderRadius: 10, alignSelf: 'center' },
  backButtonSimple: { alignSelf: 'center' },

  // Result Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 30, alignItems: 'center', borderWidth: 4 },
  safeBorder: { borderColor: '#00b894' },
  dangerBorder: { borderColor: '#d63031' },
  resultTitle: { fontSize: 22, fontWeight: '900', marginTop: 15, textAlign: 'center' },
  resultDesc: { fontSize: 15, color: '#636e72', textAlign: 'center', marginVertical: 10, lineHeight: 20 },
  actionButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, marginTop: 10, width: '100%', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});