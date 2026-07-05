import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ onNavigate }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveSession();
  }, []);

  const fetchActiveSession = async () => {
    try {
      const activeSession = await AsyncStorage.getItem('user_session');
      if (activeSession) {
        setUser(JSON.parse(activeSession));
      }
    } catch (e) {
      console.log("Error staging user credentials.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.fallbackContainer}>
        <ActivityIndicator size="large" color="#9b59b6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Identity Core</Text>
        <Text style={styles.subtitle}>Secured Local Profile Settings</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#9b59b6" />
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>USERNAME</Text>
          <Text style={styles.value}>{user?.username || 'Not Available'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <Text style={styles.value}>{user?.email || 'Not Available'}</Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={() => onNavigate('Auth')}>
          <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>TERMINATE SESSION</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('Home')}>
          <Ionicons name="arrow-back" size={20} color="#636e72" />
          <Text style={styles.backText}>Dashboard Core</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 20, justifyContent: 'space-between' },
  fallbackContainer: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  header: { marginTop: 60, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#7f8c8d', marginTop: 5 },
  profileCard: { backgroundColor: '#1e1e1e', padding: 25, borderRadius: 15, borderWidth: 1, borderColor: '#2c2c2c', marginVertical: 40 },
  avatarContainer: { alignItems: 'center', marginBottom: 20 },
  infoRow: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#2c2c2c', paddingBottom: 10 },
  label: { color: '#7f8c8d', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  value: { color: '#fff', fontSize: 16, marginTop: 5, fontWeight: '600' },
  actionContainer: { marginBottom: 40 },
  logoutButton: { backgroundColor: '#c0392b', padding: 16, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  backButton: { padding: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  backText: { color: '#636e72', fontSize: 16, fontWeight: '600', marginLeft: 5 }
});