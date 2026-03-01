import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { MockDB } from '../services/mockDb';

export default function AdminScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [nicknames, setNicknames] = useState<Record<string, string>>({});

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const data = await MockDB.getRequests();
    // Sort pending first
    data.sort((a, b) => (a.status === 'pending' ? -1 : 1));
    setRequests(data);

    // Load nicknames for all unique users
    const uniqueUserIds = [...new Set(data.map(r => r.userId))];
    const nicks: Record<string, string> = {};
    for (const uid of uniqueUserIds) {
      nicks[uid] = await MockDB.getNicknameById(uid);
    }
    setNicknames(nicks);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    Alert.alert('Подтверждение', 'Вы уверены, что отправили голду?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Да, отправил',
        onPress: async () => {
          const success = await MockDB.approveRequest(id);
          if (success) {
            loadRequests();
          } else {
            Alert.alert('Ошибка', 'Не удалось обновить статус заявки');
          }
        },
      },
    ]);
  };

  const handleReject = async (id: string) => {
    if (Platform.OS === 'web') {
      const reason = window.prompt('Причина отклонения (необязательно):', 'Неверный скриншот');
      if (reason !== null) {
        const success = await MockDB.rejectRequest(id, reason);
        if (success) {
          loadRequests();
        } else {
          window.alert('Ошибка при отклонении заявки');
        }
      }
    } else {
      Alert.alert('Отмена', 'Отменить заявку и вернуть средства?', [
        { text: 'Нет', style: 'cancel' },
        {
          text: 'Да, отменить',
          style: 'destructive',
          onPress: async () => {
            const success = await MockDB.rejectRequest(id, 'Заявка отклонена администратором');
            if (success) {
              loadRequests();
            } else {
              Alert.alert('Ошибка', 'Не удалось отклонить заявку');
            }
          },
        },
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Админ Панель</Text>
      </View>

      <TouchableOpacity onPress={loadRequests} style={styles.refreshButton}>
        <Text style={styles.refreshText}>{loading ? 'Загрузка...' : 'Обновить список'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/admin/support')} style={styles.supportButton}>
        <Text style={styles.supportButtonText}>Чат поддержки</Text>
      </TouchableOpacity>

      {requests.length === 0 ? (
        <Text style={styles.emptyText}>Нет заявок</Text>
      ) : (
        requests.map((req) => (
          <View key={req.id} style={[styles.card, req.status !== 'pending' && styles.cardDone]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.amount}>{req.amount} G</Text>
                <Text style={styles.userNickname}>Пользователь: {nicknames[req.userId] || 'Загрузка...'}</Text>
              </View>
              <Text style={[
                styles.status, 
                req.status === 'approved' ? styles.statusApproved : 
                req.status === 'rejected' ? styles.statusRejected : styles.statusPending
              ]}>
                {req.status === 'pending' ? 'ОЖИДАЕТ' : 
                 req.status === 'approved' ? 'ОТПРАВЛЕНО' : 'ОТКЛОНЕНО'}
              </Text>
            </View>
            
            <Text style={styles.date}>{new Date(req.createdAt).toLocaleString()}</Text>
            <Text style={styles.skinName}>Скин: {req.skinName}</Text>

            {req.rejectionReason && (
              <Text style={styles.rejectionReason}>Причина: {req.rejectionReason}</Text>
            )}

            {req.screenshotUri && (
              <Image source={{ uri: req.screenshotUri }} style={styles.screenshot} />
            )}

            {req.status === 'pending' && (
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={() => handleReject(req.id)}>
                  <Text style={styles.btnText}>Отклонить</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnApprove]} onPress={() => handleApprove(req.id)}>
                  <Text style={styles.btnText}>Отправил</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  contentContainer: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { marginRight: 15, padding: 5 },
  backButtonText: { fontSize: 18, color: '#007AFF' },
  title: { fontSize: 24, fontWeight: 'bold' },
  refreshButton: { backgroundColor: '#007AFF', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  refreshText: { color: 'white', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  supportButton: { backgroundColor: '#5856D6', padding: 15, borderRadius: 10, marginBottom: 20, alignItems: 'center' },
  supportButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  cardDone: { opacity: 0.7, backgroundColor: '#f9f9f9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  amount: { fontSize: 18, fontWeight: 'bold' },
  userNickname: { fontSize: 12, color: '#666' },
  status: { fontWeight: 'bold', fontSize: 12 },
  statusPending: { color: 'orange' },
  statusApproved: { color: 'green' },
  statusRejected: { color: 'red' },
  date: { color: '#999', fontSize: 12, marginBottom: 5 },
  skinName: { fontSize: 14, marginBottom: 5 },
  rejectionReason: { fontSize: 12, color: 'red', marginBottom: 10, fontStyle: 'italic' },
  screenshot: { width: '100%', height: 150, borderRadius: 8, marginBottom: 15, resizeMode: 'cover', backgroundColor: '#eee' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnReject: { backgroundColor: '#FF3B30' },
  btnApprove: { backgroundColor: '#34C759' },
  btnText: { color: 'white', fontWeight: 'bold' },
});
