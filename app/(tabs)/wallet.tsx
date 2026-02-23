import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState } from 'react';

export default function WalletScreen() {
  const [amount, setAmount] = useState('');

  const handleWithdraw = () => {
    if (!amount) return;
    Alert.alert('Заявка создана', `Заявка на вывод ${amount} 🍓 создана!`);
    setAmount('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Вывод клубники</Text>
      
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Доступно для вывода:</Text>
        <Text style={styles.balanceValue}>1500 🍓</Text>
      </View>

      <Text style={styles.label}>Сумма вывода</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Введите сумму" 
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Способ вывода</Text>
      <View style={styles.methods}>
        <TouchableOpacity style={styles.method}><Text>USDT</Text></TouchableOpacity>
        <TouchableOpacity style={styles.method}><Text>Card</Text></TouchableOpacity>
        <TouchableOpacity style={styles.method}><Text>Qiwi</Text></TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleWithdraw}>
        <Text style={styles.buttonText}>Вывести</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  balanceContainer: { backgroundColor: 'white', padding: 20, borderRadius: 10, marginBottom: 20 },
  balanceLabel: { color: '#666' },
  balanceValue: { fontSize: 24, fontWeight: 'bold', marginTop: 5 },
  label: { fontSize: 16, marginBottom: 10, marginTop: 10 },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 10, fontSize: 16 },
  methods: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  method: { backgroundColor: 'white', padding: 15, borderRadius: 10, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
