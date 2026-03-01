import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { MockDB } from '../services/mockDb';
import { useRouter } from 'expo-router';

export default function HistoryScreen() {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    MockDB.getWithdrawals().then(data => {
      setWithdrawals(data);
      setLoading(false);
    });
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.historyItem}>
      <View style={styles.itemHeader}>
        <Text style={styles.amount}>{item.amount.toFixed(2)} G</Text>
        <Text style={[styles.status, { color: item.status === 'approved' ? '#34C759' : item.status === 'rejected' ? '#FF3B30' : '#FFCC00' }]}>
          {item.status === 'approved' ? 'Выполнено' : item.status === 'rejected' ? 'Отклонено' : 'В обработке'}
        </Text>
      </View>
      <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
      <Text style={styles.method}>Метод: {item.method}</Text>
      {item.status === 'rejected' && item.rejection_reason && (
        <Text style={styles.reason}>Причина: {item.rejection_reason}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📜 История выплат</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={withdrawals}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>История пуста</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: 'white', padding: 20, paddingTop: 50, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backButton: { marginRight: 15 },
  backButtonText: { color: '#007AFF', fontSize: 16 },
  title: { fontSize: 20, fontWeight: 'bold' },
  list: { padding: 15 },
  historyItem: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  amount: { fontSize: 18, fontWeight: 'bold' },
  status: { fontSize: 14, fontWeight: '600' },
  date: { fontSize: 12, color: '#666', marginBottom: 5 },
  method: { fontSize: 14, color: '#333', marginBottom: 5 },
  reason: { fontSize: 13, color: '#FF3B30', fontStyle: 'italic', marginTop: 5 },
  empty: { textAlign: 'center', marginTop: 50, color: '#666' }
});
