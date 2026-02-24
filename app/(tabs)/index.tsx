import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, ActivityIndicator, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { AdsgramTask } from '../../components/AdsgramTask';
import { MockDB } from '../../services/mockDb';

// Helper for Web Alerts
const safeAlert = (title: string, msg?: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${msg}`);
  } else {
    Alert.alert(title, msg);
  }
};

export default function EarnScreen() {
  const router = useRouter();
  const [points, setPoints] = useState(0);
  const [isCheckingSub, setIsCheckingSub] = useState(false);
  const [hasClickedSub, setHasClickedSub] = useState(false);
  const [debugStatus, setDebugStatus] = useState('Checking connection...');

  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Load initial balance
    MockDB.getBalance().then((bal) => {
      setPoints(bal);
      MockDB.getCurrentUser().then(uid => {
        setDebugStatus(`UID: ${uid.substring(0, 8)}... | Bal: ${bal}`);
      });
    }).catch(e => {
      setDebugStatus('DB Error: ' + e.message);
    });
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    const subscribed = await MockDB.checkTaskStatus('subscribe_channel');
    setIsSubscribed(subscribed);
  };

  const handleAdReward = async () => {
    // Random reward between 1.0 and 1.5
    const reward = parseFloat((Math.random() * (1.5 - 1.0) + 1.0).toFixed(2));
    const success = await MockDB.addBalance(reward);
    
    if (success) {
      const newBal = await MockDB.getBalance();
      setPoints(newBal);
      safeAlert('Успех', `Реклама просмотрена! +${reward} G`);
    } else {
      safeAlert('Ошибка', 'Не удалось начислить награду за рекламу');
    }
  };

  const handleSubscribe = async () => {
    if (Platform.OS === 'web') {
      window.open('https://t.me/officialWizzi', '_blank');
    } else {
      Linking.openURL('https://t.me/officialWizzi');
    }
    setHasClickedSub(true);
  };

  const handleCheckSubscription = async () => {
    if (!hasClickedSub) {
      safeAlert('Ошибка', 'Сначала подпишитесь на канал!');
      return;
    }

    setIsCheckingSub(true);
    
    // Simulate smart verification (delay)
    setTimeout(async () => {
      // Updated reward: 50 G
      const reward = 50.0;
      
      try {
        const success = await MockDB.completeTask('subscribe_channel', reward);
        
        setIsCheckingSub(false);
        
        if (success) {
          const newBal = await MockDB.getBalance();
          setPoints(newBal);
          safeAlert('Успех', `Подписка подтверждена! +${reward} G`);
          setIsSubscribed(true); // Mark as subscribed - will disappear from UI
        } else {
          // Double check if it was already done
          const isDone = await MockDB.checkTaskStatus('subscribe_channel');
          if (isDone) {
             setIsSubscribed(true);
             safeAlert('Инфо', 'Вы уже получили награду за это задание');
          } else {
             safeAlert('Ошибка', 'Не удалось проверить подписку. Попробуйте еще раз.');
          }
        }
      } catch (err) {
        setIsCheckingSub(false);
        safeAlert('Ошибка проверки', (err as Error).message);
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

      {/* Adsgram Task with Block ID 23633 */}
      <AdsgramTask blockId="23633" onReward={handleAdReward} />

      {/* Subscription Task with Smart Verification */}
      {!isSubscribed && (
        <View style={styles.taskCard}>
          <View style={{flex: 1}}>
            <Text style={styles.taskTitle}>Подписаться на канал</Text>
            <Text style={styles.taskReward}>+50.0 G</Text>
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

      {/* Version Indicator for Debugging */}
      <Text style={styles.versionText}>Версия: 1.2.1 (Build: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()})</Text>
      <Text style={[styles.versionText, { marginTop: 5, color: 'orange' }]}>Status: {debugStatus}</Text>

      <View style={{ height: 40 }} />
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
  reviewsButtonText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  versionText: { textAlign: 'center', color: '#ccc', fontSize: 10, marginTop: 20 }
});
