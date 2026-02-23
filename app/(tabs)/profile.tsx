import { View, Text, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder} />
        <Text style={styles.name}>Пользователь #1234</Text>
        <Text style={styles.email}>user@example.com</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>150</Text>
          <Text style={styles.statLabel}>Заданий</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>5000 🍓</Text>
          <Text style={styles.statLabel}>Заработано</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ddd', marginBottom: 15 },
  name: { fontSize: 20, fontWeight: 'bold' },
  email: { color: '#666' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'white', padding: 20, borderRadius: 15 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#007AFF' },
  statLabel: { color: '#666' },
});
