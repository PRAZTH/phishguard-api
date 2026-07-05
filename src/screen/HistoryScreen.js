import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen({ onNavigate }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistoryData();
  }, []);

  const loadHistoryData = async () => {
    try {
      const storedLogs = await AsyncStorage.getItem('scanHistory');
      if (storedLogs) setHistory(JSON.parse(storedLogs));
    } catch (e) {
      console.log("Failed reading flash diagnostic array records.");
    }
  };

  const flushStorageRecords = () => {
    Alert.alert(
      "Purge Cache Logs",
      "Permanently eliminate all indexed security metrics files locally?",
      [
        { text: "Abort" },
        { 
          text: "Confirm Pure Clear", 
          onPress: async () => {
            await AsyncStorage.removeItem('scanHistory');
            setHistory([]);
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isThreat = item.result !== "Safe";
    return (
      <View style={styles.logItem}>
        <View style={styles.logMeta}>
          <Ionicons 
            name={isThreat ? "shield-alert-outline" : "shield-checkmark-outline"} 
            size={24} 
            color={isThreat ? "#e74c3c" : "#2ecc71"} 
          />
          <View style={styles.textContainer}>
            <Text style={styles.urlText} numberOfLines={1}>{item.url}</Text>
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
        </View>
        <Text style={[styles.statusBadge, { color: isThreat ? '#e74c3c' : '#2ecc71' }]}>
          {item.result.toUpperCase()}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Audit Logs Ledger</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={flushStorageRecords}>
            <Ionicons name="trash-bin-outline" size={24} color="#e74c3c" />
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyView}>
          <Ionicons name="documents-outline" size={60} color="#444" />
          <Text style={styles.emptyText}>No vulnerabilities filed yet</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('Home')}>
        <Ionicons name="arrow-back" size={20} color="#fff" />
        <Text style={styles.backButtonText}> Dashboard Core</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 20 },
  header: { marginTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  listContainer: { paddingBottom: 100 },
  logItem: { backgroundColor: '#1e1e1e', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#2c2c2c' },
  logMeta: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  textContainer: { marginLeft: 12, flex: 0.85 },
  urlText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  dateText: { color: '#7f8c8d', fontSize: 12, marginTop: 3 },
  statusBadge: { fontSize: 14, fontWeight: 'bold' },
  emptyView: { flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 100 },
  emptyText: { color: '#555', marginTop: 15, fontSize: 16, fontWeight: '600' },
  backButton: { backgroundColor: '#2980b9', padding: 16, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: 30, left: 20, right: 20 },
  backButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});