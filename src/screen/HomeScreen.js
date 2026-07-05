import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function HomeScreen({ onNavigate }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PhishGuard Platform</Text>
        <Text style={styles.subtitle}>Unified Threat Intelligence Core</Text>
      </View>

      <View style={styles.menuGrid}>
        <TouchableOpacity style={styles.menuCard} onPress={() => onNavigate('Sms')}>
          <Ionicons name="chatbubble-ellipses-outline" size={40} color="#e67e22" />
          <Text style={styles.cardTitle}>SMS Guard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuCard} onPress={() => onNavigate('QR')}>
          <Ionicons name="qr-code-outline" size={40} color="#2ecc71" />
          <Text style={styles.cardTitle}>QR Scanner</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuCard} onPress={() => onNavigate('History')}>
          <Ionicons name="time-outline" size={40} color="#3498db" />
          <Text style={styles.cardTitle}>Scan Logs</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuCard} onPress={() => onNavigate('Profile')}>
          <Ionicons name="person-outline" size={40} color="#9b59b6" />
          <Text style={styles.cardTitle}>Identity Core</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={() => onNavigate('Auth')}>
        <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>TERMINATE SESSION</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 20, justifyContent: 'space-between' },
  header: { marginTop: 60, alignItems: 'center' },
  title: { fontSize: 30, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#7f8c8d', marginTop: 5 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginVertical: 40 },
  menuCard: { backgroundColor: '#1e1e1e', width: width * 0.42, height: 140, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#2c2c2c' },
  cardTitle: { color: '#fff', marginTop: 12, fontSize: 16, fontWeight: '600' },
  logoutButton: { backgroundColor: '#c0392b', padding: 16, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});