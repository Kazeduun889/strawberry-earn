import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { AdsgramTask } from '../../components/AdsgramTask';
import { MockDB } from '../../services/mockDb';

export default function EarnScreen() {
  const router = useRouter();
  const [points, setPoints] = useState(0);
  const [isCheckingSub, setIsCheckingSub] = useState(false);
  const [hasClickedSub, setHasClickedSub] = useState(false);

  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Load initial balance
    MockDB.getBalance().then(setPoints);
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    const subscribed = await MockDB.checkTaskStatus('subscribe_channel');
    setIsSubscribed(subscribed);
  };

  const handleAdReward = async () => {
    // Random reward between 0.4 and 0.8
    const reward = parseFloat((Math.random() * (0.8 - 0.4) + 0.4).toFixed(2));
    await MockDB.addBalance(reward);
    const newBal = await MockDB.getBalance();
    setPoints(newBal);
    Alert.alert('Успех', `Реклама просмотрена! +${reward} G`);
  };

  const handleSubscribe = async () => {
    Linking.openURL('https://t.me/officialWizzi');
    setHasClickedSub(true);
  };

  const handleCheckSubscription = async () => {
    if (!hasClickedSub) {
      Alert.alert('Ошибка', 'Сначала подпишитесь на канал!');
      return;
    }

    setIsCheckingSub(true);
    
    // Simulate smart verification (delay)
    setTimeout(async () => {
      const reward = 50.00;
      const success = await MockDB.completeTask('subscribe_channel', reward);
      
      setIsCheckingSub(false);
      
      if (success) {
        const newBal = await MockDB.getBalance();
        setPoints(newBal);
        Alert.alert('Успех', `Подписка подтверждена! +${reward} G`);
        setIsSubscribed(true); // Mark as subscribed
      } else {
        // Double check if it was already done
        const isDone = await MockDB.checkTaskStatus('subscribe_channel');
        if (isDone) {
           setIsSubscribed(true);
           Alert.alert('Инфо', 'Вы уже получили награду за это задание');
        } else {
           Alert.alert('Ошибка', 'Не удалось проверить подписку. Попробуйте еще раз.');
        }
      }
    }, 3000); // 3 seconds delay for "verification"
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.balanceTitle}>Ваш баланс</Text>
        <Text style={styles.balanceValue}>{points.toFixed(2)} G</Text>
      </View>

      <Text style={styles.sectionTitle}>Доступные задания</Text>

      {/* Replace with your actual Block ID from Adsgram */}
      <AdsgramTask blockId="23585" onReward={handleAdReward} />

      {/* Subscription Task with Smart Verification */}
      {!isSubscribed && (
        <View style={styles.taskCard}>
          <View style={{flex: 1}}>
            <Text style={styles.taskTitle}>Подписаться на канал</Text>
            <Text style={styles.taskReward}>+50.00 G</Text>
          </View>
          
          {!hasClickedSub ? (
            <TouchableOpacity style={styles.actionButton} onPress={handleSubscribe}>
              <Text style={styles.actionButtonText}>Подписаться</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.checkButton]} 
              onPress={handleCheckSubscription}
              disabled={isCheckingSub}
            >
              {isCheckingSub ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.actionButtonText}>Проверить</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Reviews Button */}
      <TouchableOpacity style={styles.reviewsButton} onPress={() => router.push('/reviews')}>
        <Text style={styles.reviewsButtonText}>⭐ Отзывы о приложении</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  contentContainer: { padding: 20 },
  header: { backgroundColor: '#87CEEB', padding: 20, borderRadius: 15, marginBottom: 20, alignItems: 'center' }, // Sky Blue
  balanceTitle: { color: 'white', fontSize: 16 },
  balanceValue: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  taskCard: { backgroundColor: 'white', padding: 20, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  taskTitle: { fontSize: 16, fontWeight: '500', marginBottom: 5 },
  taskReward: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  actionButton: { backgroundColor: '#007AFF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  checkButton: { backgroundColor: '#34C759' },
  actionButtonText: { color: 'white', fontWeight: 'bold' },
  reviewsButton: { marginTop: 20, backgroundColor: 'white', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  reviewsButtonText: { fontSize: 16, fontWeight: 'bold', color: '#333' }
});
