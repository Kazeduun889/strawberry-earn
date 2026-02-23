import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { MockDB } from '../services/mockDb';
import { WithdrawalRequest } from '../services/types';

export default function AdminScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const data = await MockDB.getRequests();
    // Sort pending first
    data.sort((a, b) => (a.status === 'pending' ? -1 : 1));
    setRequests(data);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    Alert.alert('Подтверждение', 'Вы уверены, что купили скин?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Да, купил',
        onPress: async () => {
          await MockDB.approveRequest(id);
          loadRequests();
        },
      },
    ]);
  };

  const handleReject = async (id: string) => {
    Alert.alert('Отмена', 'Отменить заявку и вернуть средства?', [
      { text: 'Нет', style: 'cancel' },
      {
        text: 'Да, отменить',
        style: 'destructive',
        onPress: async () => {
          await MockDB.rejectRequest(id);
          loadRequests();
        },
      },
    ]);
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
        <Text style={styles.refreshText}>Обновить список</Text>
      </TouchableOpacity>

      {requests.length === 0 ? (
        <Text style={styles.emptyText}>Нет заявок</Text>
      ) : (
        requests.map((req) => (
          <View key={req.id} style={[styles.card, req.status !== 'pending' && styles.cardDone]}>
            <View style={styles.cardHeader}>
              <Text style={styles.amount}>{req.amount} G</Text>
              <Text style={[
                styles.status, 
                req.status === 'approved' ? styles.statusApproved : 
                req.status === 'rejected' ? styles.statusRejected : styles.statusPending
              ]}>
                {req.status === 'pending' ? 'ОЖИДАЕТ' : 
                 req.status === 'approved' ? 'ВЫПЛАЧЕНО' : 'ОТМЕНЕНО'}
              </Text>
            </View>
            
            <Text style={styles.date}>{new Date(req.createdAt).toLocaleString()}</Text>
            <Text style={styles.skinName}>Скин: {req.skinName}</Text>

            {req.screenshotUri && (
              <Image source={{ uri: req.screenshotUri }} style={styles.screenshot} />
            )}

            {req.status === 'pending' && (
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={() => handleReject(req.id)}>
                  <Text style={styles.btnText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnApprove]} onPress={() => handleApprove(req.id)}>
                  <Text style={styles.btnText}>Куплено</Text>
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
  status: { fontWeight: 'bold', fontSize: 12 },
  statusPending: { color: 'orange' },
  statusApproved: { color: 'green' },
  statusRejected: { color: 'red' },
  date: { color: '#999', fontSize: 12, marginBottom: 5 },
  skinName: { fontSize: 14, marginBottom: 10 },
  screenshot: { width: '100%', height: 150, borderRadius: 8, marginBottom: 15, resizeMode: 'cover', backgroundColor: '#eee' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnReject: { backgroundColor: '#FF3B30' },
  btnApprove: { backgroundColor: '#34C759' },
  btnText: { color: 'white', fontWeight: 'bold' },
});
