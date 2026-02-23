import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { AdsgramTask } from '../../components/AdsgramTask';

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { AdsgramTask } from '../../components/AdsgramTask';
import { MockDB } from '../../services/mockDb';

export default function EarnScreen() {
  const [points, setPoints] = useState(0);

  useEffect(() => {
    // Load initial balance
    MockDB.getBalance().then(setPoints);
  }, []);

  const handleAdReward = async () => {
    // Random reward between 0.02 and 0.06
    const reward = parseFloat((Math.random() * (0.06 - 0.02) + 0.02).toFixed(2));
    await MockDB.addBalance(reward);
    const newBal = await MockDB.getBalance();
    setPoints(newBal);
    Alert.alert('Успех', `Реклама просмотрена! +${reward} G`);
  };

  const handleTask = async (reward: number) => {
    await MockDB.addBalance(reward);
    const newBal = await MockDB.getBalance();
    setPoints(newBal);
    Alert.alert('Успех', `Задание выполнено! +${reward} G`);
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

      <TouchableOpacity style={styles.taskCard} onPress={() => handleTask(0.50)}>
        <Text style={styles.taskTitle}>Пройти опрос "Любимые игры"</Text>
        <Text style={styles.taskReward}>+0.50 G</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.taskCard} onPress={() => handleTask(1.00)}>
        <Text style={styles.taskTitle}>Подписаться на канал</Text>
        <Text style={styles.taskReward}>+1.00 G</Text>
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
  taskTitle: { fontSize: 16, fontWeight: '500', flex: 1 },
  taskReward: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
});
  balanceTitle: { color: 'white', fontSize: 16 },
  balanceValue: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  taskCard: { backgroundColor: 'white', padding: 20, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  taskTitle: { fontSize: 16, fontWeight: '500', flex: 1 },
  taskReward: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
});
