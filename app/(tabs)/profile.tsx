import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { MockDB } from '../../services/mockDb';

export default function ProfileScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [nickname, setNickname] = useState('User');
  const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNewNickname] = useState('');

  useEffect(() => {
    // Refresh balance and nickname
    MockDB.getBalance().then(setBalance);
    MockDB.getNickname().then(nick => {
      setNickname(nick);
      setNewNickname(nick);
    });

    // Get Telegram User ID
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      setTelegramId((window as any).Telegram.WebApp.initDataUnsafe.user.id);
    }
  }, []);

  const handleUpdateNickname = async () => {
    if (!newNickname.trim()) return;
    const success = await MockDB.updateNickname(newNickname);
    if (success) {
      setNickname(newNickname);
      setIsEditing(false);
      if (Platform.OS === 'web') {
        window.alert('Никнейм успешно изменен!');
      } else {
        Alert.alert('Успех', 'Никнейм успешно изменен!');
      }
    } else {
      if (Platform.OS === 'web') {
        window.alert('Ошибка при смене никнейма');
      } else {
        Alert.alert('Ошибка', 'Не удалось изменить никнейм');
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{nickname.charAt(0).toUpperCase()}</Text>
        </View>
        
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.input}
              value={newNickname}
              onChangeText={setNewNickname}
              placeholder="Введите никнейм"
              maxLength={20}
            />
            <View style={styles.editButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleUpdateNickname}>
                <Text style={styles.saveButtonText}>Сохранить</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.nicknameContainer}>
            <Text style={styles.username}>{nickname} ✎</Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.userId}>ID: {telegramId || 'Unknown'}</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{balance.toFixed(2)} G</Text>
          <Text style={styles.statLabel}>Заработано всего</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Заданий</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/history')}>
        <Text style={styles.menuText}>История выплат</Text>
      </TouchableOpacity>
      
      {/* Support Button */}
      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/support')}>
        <View>
          <Text style={styles.menuText}>💬 Поддержка</Text>
          <Text style={styles.menuSubText}>(с идеями и предложениями сюда)</Text>
        </View>
      </TouchableOpacity>

      {/* Show Admin Panel for admins */}
      {(telegramId === 1562788488 || telegramId === 8565678796) && (
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
  nicknameContainer: { padding: 5 },
  username: { fontSize: 20, fontWeight: 'bold' },
  userId: { color: '#666', marginTop: 5 },
  editContainer: { width: '100%', alignItems: 'center' },
  input: { borderBottomWidth: 1, borderColor: '#007AFF', width: '80%', fontSize: 18, textAlign: 'center', marginBottom: 10, padding: 5 },
  editButtons: { flexDirection: 'row', gap: 10 },
  saveButton: { backgroundColor: '#007AFF', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 5 },
  saveButtonText: { color: 'white', fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#ccc', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 5 },
  cancelButtonText: { color: 'black' },
  statsCard: { backgroundColor: 'white', flexDirection: 'row', padding: 20, marginBottom: 10 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  statLabel: { color: '#666', marginTop: 5 },
  menuItem: { backgroundColor: 'white', padding: 20, marginBottom: 1, flexDirection: 'row', alignItems: 'center' },
  menuText: { fontSize: 16 },
  menuSubText: { fontSize: 12, color: '#666', marginTop: 2 },
  adminButton: { marginTop: 20, backgroundColor: '#f0f0f0' },
  adminText: { color: 'red', fontWeight: 'bold' },
});
