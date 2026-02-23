import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { MockDB } from '../../services/mockDb';

export default function WalletScreen() {
  const [balance, setBalance] = useState(0);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = () => MockDB.getBalance().then(setBalance);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setScreenshot(result.assets[0].uri);
    }
  };

  const handleWithdraw = async () => {
    if (balance < 1000) {
      Alert.alert('Ошибка', 'Минимальная сумма вывода: 1000 G');
      return;
    }
    if (!screenshot) {
      Alert.alert('Ошибка', 'Пожалуйста, прикрепите скриншот скина из Project Evolution');
      return;
    }

    setIsSubmitting(true);
    try {
      // Withdraw full balance
      const success = await MockDB.createWithdrawal(balance, screenshot, 'Project Evolution Skin');
      if (success) {
        Alert.alert('Успех', 'Заявка отправлена на проверку!');
        setScreenshot(null);
        loadBalance();
      } else {
        Alert.alert('Ошибка', 'Недостаточно средств');
      }
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось создать заявку');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Баланс</Text>
        <Text style={styles.headerValue}>{balance.toFixed(2)} G</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Вывод средств</Text>
        <Text style={styles.instruction}>
          1. Накопите минимум 1000 G.{'\n'}
          2. Выставьте скин в Project Evolution за {balance >= 1000 ? balance.toFixed(2) : 'XXXX.XX'} G.{'\n'}
          3. Загрузите скриншот выставленного скина.
        </Text>

        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Text style={styles.uploadButtonText}>
            {screenshot ? 'Скриншот загружен (изменить)' : 'Загрузить скриншот'}
          </Text>
        </TouchableOpacity>

        {screenshot && (
          <Image source={{ uri: screenshot }} style={styles.previewImage} />
        )}

        <TouchableOpacity 
          style={[styles.withdrawButton, (balance < 1000 || isSubmitting) && styles.disabledButton]} 
          onPress={handleWithdraw}
          disabled={balance < 1000 || isSubmitting}
        >
          <Text style={styles.withdrawButtonText}>
            {isSubmitting ? 'Отправка...' : `Вывести ${balance.toFixed(2)} G`}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  contentContainer: { padding: 20 },
  header: { backgroundColor: '#87CEEB', padding: 30, borderRadius: 20, marginBottom: 20, alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 18, opacity: 0.9 },
  headerValue: { color: 'white', fontSize: 36, fontWeight: 'bold' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  instruction: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 20 },
  uploadButton: { backgroundColor: '#f0f0f0', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  uploadButtonText: { color: '#007AFF', fontWeight: '600' },
  previewImage: { width: '100%', height: 200, borderRadius: 10, marginBottom: 15, resizeMode: 'cover' },
  withdrawButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  disabledButton: { backgroundColor: '#ccc' },
  withdrawButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
