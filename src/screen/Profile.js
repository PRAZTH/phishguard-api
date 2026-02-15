import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Image, Alert, ScrollView, Switch, TextInput, ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; 

// 👇 DOUBLE CHECK: Is this IP correct? (Run 'ipconfig' in CMD)
const SERVER_URL = "https://phishguard-api-1-t6wy.onrender.com";

export default function ProfileScreen({ onNavigate }) {
  const [user, setUser] = useState({ name: '', email: '', photo: '' });
  const [stats, setStats] = useState({ total: 0, threats: 0 });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
        // 1. Get User Data from AsyncStorage
        const sessionData = await AsyncStorage.getItem('user_session');
        
        console.log("Session Data:", sessionData); // 👈 Debug Log

        if (sessionData) {
            const userData = JSON.parse(sessionData);
            setUser({
                name: userData.name || "PhishGuard User",
                email: userData.email, // This MUST exist
                photo: userData.photo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
            });
            setNewName(userData.name || "");
        } else {
            // If no session found, force logout logic
            Alert.alert("Session Expired", "Please log out and log in again.");
        }

        // 2. Get Stats
        const history = await AsyncStorage.getItem('scanHistory');
        if (history) {
            const parsed = JSON.parse(history);
            const threats = parsed.filter(item => item.result !== 'Safe').length;
            setStats({ total: parsed.length, threats: threats });
        }
    } catch (e) {
        console.log("Error loading profile", e);
    }
  };

  const pickImage = async () => {
    if (!isEditing) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Need photo access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setUser({ ...user, photo: result.assets[0].uri });
    }
  };

  // 👇 IMPROVED SAVE FUNCTION
  const handleSaveChanges = async () => {
    console.log("Attempting to save...");

    // 1. Validation Check
    if (!user.email) {
        Alert.alert("Error", "User email is missing. Please Log Out and Log In again.");
        return;
    }

    setSaving(true);

    try {
        console.log("Sending data to:", `${SERVER_URL}/update-profile`);
        
        // 2. Send to Backend
        const response = await fetch(`${SERVER_URL}/update-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: user.email,
                name: newName,
                photo: user.photo
            })
        });

        // 3. Check for Server Errors
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        console.log("Server Response:", data);

        // 4. Update Local Storage
        const updatedUser = { ...user, name: newName };
        await AsyncStorage.setItem('user_session', JSON.stringify(updatedUser));

        Alert.alert("Success", "Profile updated successfully!");
        setIsEditing(false);
        setUser(updatedUser);

    } catch (error) {
        console.error("Save Error:", error);
        Alert.alert("Save Failed", "Could not connect to server.\nCheck your IP and Wifi.");
    } finally {
        setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure?", [
        { text: "Cancel" },
        { text: "Log Out", style: "destructive", onPress: async () => {
            await AsyncStorage.removeItem('user_session');
            onNavigate('Auth');
        }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('Home')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editBtn}>
            <Ionicons name={isEditing ? "close" : "pencil"} size={24} color="#0984e3" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={pickImage} activeOpacity={isEditing ? 0.7 : 1}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: user.photo }} style={styles.avatar} />
              {isEditing && (
                  <View style={styles.cameraIconOverlay}>
                      <Ionicons name="camera" size={20} color="#fff" />
                  </View>
              )}
            </View>
          </TouchableOpacity>

          {isEditing ? (
              <TextInput 
                  style={styles.nameInput}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Enter Name"
                  placeholderTextColor="#666"
                  autoFocus
              />
          ) : (
              <Text style={styles.userName}>{user.name}</Text>
          )}

          <Text style={styles.userEmail}>{user.email || "No Email Found"}</Text>

          {isEditing && (
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff"/> : <Text style={styles.saveText}>Save Changes</Text>}
              </TouchableOpacity>
          )}

          {!isEditing && (
            <View style={styles.badge}>
                <Text style={styles.badgeText}>🛡️ PRO MEMBER</Text>
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
            <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Scans</Text>
            </View>
            <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#333' }]}>
                <Text style={[styles.statNumber, { color: '#e74c3c' }]}>{stats.threats}</Text>
                <Text style={styles.statLabel}>Threats</Text>
            </View>
            <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#2ecc71' }]}>100%</Text>
                <Text style={styles.statLabel}>Protected</Text>
            </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>SETTINGS</Text>
            <View style={styles.optionRow}>
                <View style={[styles.optionIcon, {backgroundColor: '#e67e22'}]}>
                    <Ionicons name="notifications" size={20} color="#fff" />
                </View>
                <Text style={styles.optionText}>Notifications</Text>
                <Switch 
                    trackColor={{ false: "#767577", true: "#2ecc71" }}
                    thumbColor={notificationsEnabled ? "#fff" : "#f4f3f4"}
                    onValueChange={() => setNotificationsEnabled(!notificationsEnabled)}
                    value={notificationsEnabled}
                />
            </View>
            <TouchableOpacity style={styles.optionRow} onPress={() => AsyncStorage.removeItem('scanHistory')}>
                <View style={[styles.optionIcon, {backgroundColor: '#3498db'}]}>
                    <Ionicons name="trash" size={20} color="#fff" />
                </View>
                <Text style={styles.optionText}>Clear Scan History</Text>
            </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#111' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  editBtn: { padding: 5 },
  profileCard: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#0984e3' },
  cameraIconOverlay: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0984e3', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#000' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  nameInput: { fontSize: 24, fontWeight: 'bold', color: '#fff', borderBottomWidth: 1, borderBottomColor: '#0984e3', minWidth: 200, textAlign: 'center', marginBottom: 10 },
  userEmail: { fontSize: 16, color: '#aaa', marginBottom: 15 },
  saveButton: { backgroundColor: '#0984e3', paddingHorizontal: 30, paddingVertical: 10, borderRadius: 20, marginTop: 10 },
  saveText: { color: '#fff', fontWeight: 'bold' },
  badge: { backgroundColor: 'rgba(9, 132, 227, 0.2)', paddingVertical: 5, paddingHorizontal: 15, borderRadius: 15 },
  badgeText: { color: '#0984e3', fontWeight: 'bold', fontSize: 12 },
  statsContainer: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 15, marginHorizontal: 20, paddingVertical: 20, marginBottom: 30 },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  statLabel: { fontSize: 12, color: '#666', textTransform: 'uppercase' },
  section: { marginHorizontal: 20, marginBottom: 25 },
  sectionTitle: { color: '#666', fontSize: 13, fontWeight: 'bold', marginBottom: 10, paddingLeft: 10 },
  optionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 15, borderRadius: 12, marginBottom: 10 },
  optionIcon: { width: 35, height: 35, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  optionText: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '500' },
  logoutButton: { marginHorizontal: 20, backgroundColor: 'rgba(231, 76, 60, 0.15)', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  logoutText: { color: '#e74c3c', fontSize: 16, fontWeight: 'bold' },
  versionText: { textAlign: 'center', color: '#444', marginTop: 30, fontSize: 12 }
});