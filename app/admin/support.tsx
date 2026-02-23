import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { MockDB } from '../../services/mockDb';

interface SupportUser {
  userId: string;
  lastMessage: string;
  lastDate: number;
}

export default function AdminSupportListScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<SupportUser[]>([]);

  useEffect(() => {
    loadUsers();
    const interval = setInterval(loadUsers, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const loadUsers = async () => {
    const data = await MockDB.getSupportUsers();
    setUsers(data);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Чаты поддержки</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.userCard}
            onPress={() => router.push({ pathname: '/admin/chat', params: { userId: item.userId } })}
          >
            <View style={styles.userInfo}>
              <Text style={styles.userId} numberOfLines={1}>User: {item.userId.substring(0, 8)}...</Text>
              <Text style={styles.lastDate}>{new Date(item.lastDate).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Нет активных чатов</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee', paddingTop: 40 },
  backButton: { marginRight: 15 },
  backButtonText: { fontSize: 18, color: '#007AFF' },
  title: { fontSize: 20, fontWeight: 'bold' },
  list: { padding: 15 },
  userCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  userInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  userId: { fontWeight: 'bold', fontSize: 16 },
  lastDate: { fontSize: 12, color: '#999' },
  lastMessage: { color: '#666', fontSize: 14 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});