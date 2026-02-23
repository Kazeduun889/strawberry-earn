import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { AdsgramTask } from '../../components/AdsgramTask';

export default function EarnScreen() {
  const [points, setPoints] = useState(0);

  const handleAdReward = () => {
    Alert.alert('Успех', 'Реклама просмотрена! +10 клубники');
    setPoints(prev => prev + 10);
  };

  const handleTask = (reward: number) => {
    Alert.alert('Успех', `Задание выполнено! +${reward} клубники`);
    setPoints(prev => prev + reward);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.balanceTitle}>Ваш баланс</Text>
        <Text style={styles.balanceValue}>{points} 🍓</Text>
      </View>

      <Text style={styles.sectionTitle}>Доступные задания</Text>

      {/* Replace with your actual Block ID from Adsgram */}
      <AdsgramTask blockId="INT_PO_5678" onReward={handleAdReward} />

      <TouchableOpacity style={styles.taskCard} onPress={() => handleTask(50)}>
        <Text style={styles.taskTitle}>Пройти опрос "Любимые ягоды"</Text>
        <Text style={styles.taskReward}>+50 🍓</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.taskCard} onPress={() => handleTask(100)}>
        <Text style={styles.taskTitle}>Подписаться на канал</Text>
        <Text style={styles.taskReward}>+100 🍓</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  header: { backgroundColor: '#007AFF', padding: 20, borderRadius: 15, marginBottom: 20, alignItems: 'center' },
  balanceTitle: { color: 'white', fontSize: 16 },
  balanceValue: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  taskCard: { backgroundColor: 'white', padding: 20, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  taskTitle: { fontSize: 16, fontWeight: '500', flex: 1 },
  taskReward: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
});
