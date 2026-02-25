import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { MockDB } from '../services/mockDb';
import { useRouter } from 'expo-router';

export default function LeaderboardScreen() {
  const router = useRouter();
  const [leaders, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    MockDB.getLeaderboard().then(data => {
      setLeaderboard(data);
      setLoading(false);
    });
  }, []);

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <View style={styles.leaderItem}>
      <View style={styles.rankContainer}>
        <Text style={[styles.rankText, index < 3 && styles.topRank]}>#{index + 1}</Text>
      </View>
      <Text style={styles.nickname}>{item.nickname || 'User'}</Text>
      <Text style={styles.balance}>{item.balance.toFixed(2)} G</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏆 Список лидеров</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={leaders}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Пока никого нет</Text>}
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
  leaderItem: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  rankContainer: { width: 40 },
  rankText: { fontSize: 16, fontWeight: 'bold', color: '#666' },
  topRank: { color: '#FFD700', fontSize: 18 }, // Gold for top 3
  nickname: { flex: 1, fontSize: 16, fontWeight: '500' },
  balance: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  empty: { textAlign: 'center', marginTop: 50, color: '#666' }
});
