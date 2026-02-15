import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, 
  ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av'; 

// ✅ CORRECT: Removed the /scan from the base URL
const API_URL = "https://phishguard-api-1-t6wy.onrender.com"; 
const { width, height } = Dimensions.get('window');

export default function AuthScreen({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  // 👇 VALIDATION FUNCTIONS
  const isValidGmail = (email) => {
    // strict check for @gmail.com
    return email.toLowerCase().endsWith('@gmail.com');
  };

  const isStrongPassword = (password) => {
    // Min 8 chars, 1 number, 1 special character
    const strongRegex = new RegExp("^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})");
    return strongRegex.test(password);
  };

  const handleAuth = async () => {
    // 1. Basic Empty Check
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // 2. 🔒 STRICT GMAIL CHECK
    if (!isValidGmail(email)) {
      Alert.alert("Invalid Email");
      return;
    }

    // 3. 💪 STRONG PASSWORD CHECK (Only for Sign Up)
    if (!isLogin && !isStrongPassword(password)) {
      Alert.alert(
        "Weak Password", 
        "Password must be at least 8 characters long and include:\n- At least 1 number\n- At least 1 special character (!@#$)"
      );
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? "/login" : "/register";

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        // ✅ SAVE USER TO STORAGE
        await AsyncStorage.setItem('user_session', JSON.stringify(data.user));
        
        Alert.alert("Success", data.message);
        onLoginSuccess(); 
      } else {
        Alert.alert("Error", data.error || "Authentication failed");
      }

    } catch (error) {
      setLoading(false);
      Alert.alert("Connection Error", "Could not connect to server.");
    }
  };

  return (
    <View style={styles.container}>
      <Video
        source={require('../../assets/background.mp4')} 
        style={styles.backgroundVideo}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted={true}
      />
      <View style={styles.overlay} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.contentContainer}>
        <View style={styles.header}>
          <FontAwesome5 name="shield-alt" size={40} color="#fff" />
          <Text style={styles.appTitle}>PhishGuard</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isLogin ? "Welcome Back!" : "Create Account"}</Text>
          
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color="#fff" style={{marginRight:10}} />
            <TextInput 
                style={styles.input} 
                placeholder="Email" 
                placeholderTextColor="#ccc" 
                value={email} 
                onChangeText={setEmail} 
                autoCapitalize="none" 
                keyboardType="email-address"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color="#fff" style={{marginRight:10}} />
            <TextInput 
                style={styles.input} 
                placeholder="Password" 
                placeholderTextColor="#ccc" 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry 
            />
          </View>
          
          {!isLogin && (
            <Text style={{color: '#ccc', fontSize: 10, marginBottom: 10, textAlign:'center'}}>
              Must be 8+ chars with a number & symbol
            </Text>
          )}

          <TouchableOpacity style={styles.mainButton} onPress={handleAuth} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainButtonText}>{isLogin ? "LOG IN" : "SIGN UP"}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{marginTop: 20}}>
            <Text style={{color:'#ccc', textAlign: 'center'}}>
              {isLogin ? "No account? Sign Up" : "Have an account? Log In"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backgroundVideo: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, width: width, height: height },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  contentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 30 },
  appTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 10 },
  card: { width: width * 0.9, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 20, padding: 25, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  cardTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, marginBottom: 15, paddingHorizontal: 15, height: 50 },
  input: { flex: 1, fontSize: 16, color: '#fff' },
  mainButton: { backgroundColor: '#0984e3', borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  mainButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});