import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  Alert,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons'; // 👈 Import Icon

export default function HistoryScreen({ onNavigate }) {
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setRefreshing(true);
      const storedHistory = await AsyncStorage.getItem('scanHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
      setRefreshing(false);
    } catch (e) {
      console.error(e);
      setRefreshing(false);
    }
  };

  const clearHistory = async () => {
    Alert.alert("Clear History", "Delete all records?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await AsyncStorage.removeItem('scanHistory');
          setHistory([]);
      }}
    ]);
  }

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View style={{flex: 1}}>
        <Text style={styles.url} numberOfLines={1}>{item.url}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      <View style={[styles.badge, item.result === 'Safe' ? styles.safe : styles.danger]}>
        <Text style={styles.badgeText}>{item.result}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      
      {/* 👇 Header Container with Back Button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => onNavigate('Home')} style={styles.backButton}>
             <Ionicons name="arrow-back" size={28} color="#2d3436" />
          </TouchableOpacity>
          <Text style={styles.title}>Scan History</Text>
        </View>

        {history.length > 0 && (
            <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearBtn}>Clear All</Text>
            </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
            <Text style={{color: '#b2bec3', fontSize: 18}}>No scans yet</Text>
        </View>
      ) : (
        <FlatList 
            data={history}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadHistory} />}
            contentContainerStyle={{padding: 20}}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', paddingTop: 20 },
  
  // 👇 Updated Header Styles
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 10,
    marginTop: Platform.OS === 'ios' ? 40 : 20 // Adjust for status bar
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },

  title: { fontSize: 28, fontWeight: 'bold', color: '#2d3436' },
  clearBtn: { color: '#e74c3c', fontWeight: 'bold', fontSize: 16 },
  item: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  url: { fontSize: 16, fontWeight: '600', color: '#2d3436', marginBottom: 4 },
  date: { fontSize: 12, color: '#b2bec3' },
  badge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  safe: { backgroundColor: '#00b894' },
  danger: { backgroundColor: '#d63031' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});