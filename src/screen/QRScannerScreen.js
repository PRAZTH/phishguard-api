import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const SERVER_URL = "https://phishguard-api-1-t6wy.onrender.com";
const { width, height } = Dimensions.get('window');

export default function QRScannerScreen({ onNavigate }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getCameraPermissions();
  }, []);

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    console.log(`🔗 QR Code Extracted Link: ${data}`);
    let targetUrl = data.trim();

    // Standardize URL protocol formatting for the AI engine
    if (!targetUrl.startsWith('http')) {
      targetUrl = 'https://' + targetUrl;
    }

    try {
      const response = await fetch(`${SERVER_URL}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      const resData = await response.json();
      setLoading(false);

      if (resData.error) {
        Alert.alert("Analysis Failure", resData.error);
      } else {
        // Log operation data to historical cache arrays
        const newLog = {
          id: Date.now().toString(),
          url: resData.url,
          result: resData.result,
          confidence: resData.confidence || "High",
          date: new Date().toLocaleString()
        };
        const existingHistory = await AsyncStorage.getItem('scanHistory');
        const historyArray = existingHistory ? JSON.parse(existingHistory) : [];
        historyArray.unshift(newLog);
        await AsyncStorage.setItem('scanHistory', JSON.stringify(historyArray));

        Alert.alert(
          resData.result === "Safe" ? "✅ SECURE MATRIX" : "⚠️ MALICIOUS REDIRECT",
          `Result: ${resData.result}\n\n${resData.explanation ? resData.explanation.join('\n') : ''}`,
          [{ text: "Dismiss Scan", onPress: () => setScanned(false) }]
        );
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Linkage Drop", "Could not touch backend API gateway nodes.");
      setScanned(false);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.fallbackContainer}><Text style={styles.text}>Requesting system hardware access...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.fallbackContainer}><Text style={styles.text}>Hardware camera permissions rejected.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlayContainer}>
        <Text style={styles.topInstruction}>Position QR code inside the viewfinder window</Text>
        <View style={styles.viewfinder} />
        
        {loading && <ActivityIndicator size="large" color="#e67e22" style={{ marginVertical: 20 }} />}

        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('Home')}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backText}> Dashboard Core</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  fallbackContainer: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontSize: 16 },
  overlayContainer: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 60 },
  topInstruction: { color: '#fff', backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 8, fontSize: 14, fontWeight: '600', overflow: 'hidden' },
  viewfinder: { width: width * 0.65, height: width * 0.65, borderWidth: 2, borderColor: '#2ecc71', backgroundColor: 'transparent', borderRadius: 15 },
  backButton: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});