import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Points directly to the base server url
const API_URL = "https://phishguard-api-1-t6wy.onrender.com";

export default function AuthScreen({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !username)) {
      Alert.alert("Missing Fields", "Please populate all structural credentials.");
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? `${API_URL}/login` : `${API_URL}/register`;
    const payload = isLogin ? { email, password } : { username, email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        Alert.alert("Authentication Failed", data.error || "An error occurred.");
        return;
      }

      if (isLogin) {
        // Persist session tokens locally to keep user signed in
        await AsyncStorage.setItem('user_session', JSON.stringify(data.user));
        onLoginSuccess();
      } else {
        Alert.alert("Success 🎉", "Account generated! Please log in.");
        setIsLogin(true);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Server Unreachable", "Could not handshake with the API. Try again.");
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <View style={styles.authCard}>
        <Text style={styles.title}>{isLogin ? "Welcome Back" : "Create Account"}</Text>
        <Text style={styles.subtitle}>PhishGuard Cybersecurity Gateway</Text>

        {!isLogin && (
          <TextInput 
            style={styles.input} 
            placeholder="Username" 
            placeholderTextColor="#95a5a6"
            value={username}
            onChangeText={setUsername}
          />
        )}

        <TextInput 
          style={styles.input} 
          placeholder="Email Address" 
          placeholderTextColor="#95a5a6"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput 
          style={styles.input} 
          placeholder="Password" 
          placeholderTextColor="#95a5a6"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isLogin ? "LOG IN" : "SIGN UP"}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchLink}>
          <Text style={styles.switchText}>
            {isLogin ? "New to PhishGuard? Create an account" : "Already have an account? Log in"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', justifyContent: 'center', padding: 20 },
  authCard: { backgroundColor: '#1e1e1e', padding: 30, borderRadius: 15, border強化: 1, borderColor: '#333' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 5, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#aaa', marginBottom: 25, textAlign: 'center' },
  input: { backgroundColor: '#2c2c2c', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  primaryButton: { backgroundColor: '#2980b9', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  switchLink: { marginTop: 20, alignItems: 'center' },
  switchText: { color: '#3498db', fontSize: 14 }
});