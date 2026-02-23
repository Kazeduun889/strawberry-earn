import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { MockDB } from '../../services/mockDb';

export default function ProfileScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [telegramId, setTelegramId] = useState<number | null>(null);

  useEffect(() => {
    // Refresh balance
    MockDB.getBalance().then(setBalance);

    // Get Telegram User ID
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      setTelegramId((window as any).Telegram.WebApp.initDataUnsafe.user.id);
    }
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>U</Text>
        </View>
        <Text style={styles.username}>User</Text>
        <Text style={styles.userId}>ID: {telegramId || 'Unknown'}</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{balance.toFixed(2)} G</Text>
          <Text style={styles.statLabel}>Заработано</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Заданий</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuText}>История выплат</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuText}>Поддержка</Text>
      </TouchableOpacity>

      {/* Show Admin Panel only for specific ID */}
      {telegramId === 1562788488 && (
        <TouchableOpacity style={[styles.menuItem, styles.adminButton]} onPress={() => router.push('/admin')}>
          <Text style={[styles.menuText, styles.adminText]}>Админ Панель</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: 'white', padding: 30, alignItems: 'center', marginBottom: 10 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#87CEEB', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 32, color: 'white', fontWeight: 'bold' },
  username: { fontSize: 20, fontWeight: 'bold' },
  userId: { color: '#666', marginTop: 5 },
  statsCard: { backgroundColor: 'white', flexDirection: 'row', padding: 20, marginBottom: 10 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  statLabel: { color: '#666', marginTop: 5 },
  menuItem: { backgroundColor: 'white', padding: 20, marginBottom: 1, flexDirection: 'row', alignItems: 'center' },
  menuText: { fontSize: 16 },
  adminButton: { marginTop: 20, backgroundColor: '#f0f0f0' },
  adminText: { color: 'red', fontWeight: 'bold' },
});
