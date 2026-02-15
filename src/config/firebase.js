import { initializeApp } from 'firebase/app';
import { 
  initializeAuth, 
  getReactNativePersistence, 
  GoogleAuthProvider, 
  signInWithCredential,
  signOut
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Keys from your screenshot (image_1b195f.jpg)
const firebaseConfig = {
  apiKey: "AIzaSyB2Enzpou2NVrrAWJzhcTR3Mmme-cfv4Rw",
  authDomain: "pdsc-d3a45.firebaseapp.com",
  projectId: "pdsc-d3a45",
  storageBucket: "pdsc-d3a45.firebasestorage.app",
  messagingSenderId: "566122797917",
  appId: "1:566122797917:web:d106b309c5db2ba9f6a6b4",
  measurementId: "G-2XMRKT0V99"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with Persistence
// This fixes the "Auth (12.9.0)" warning and keeps you logged in
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { GoogleAuthProvider, signInWithCredential, signOut };