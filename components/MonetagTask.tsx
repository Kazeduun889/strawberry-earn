import React, { useCallback, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, View, ActivityIndicator } from 'react-native';

interface MonetagProps {
  adUrl: string; // The Direct Link from Monetag
  onReward: () => void;
  children?: React.ReactNode;
}

const safeAlert = (title: string, msg?: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${msg}`);
  } else {
    console.error(title, msg);
  }
};

export const MonetagTask: React.FC<MonetagProps> = ({ adUrl, onReward, children }) => {
  const [loading, setLoading] = useState(false);

  const showAd = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    if (Platform.OS !== 'web') {
      safeAlert('Инфо', 'Реклама доступна только в Telegram.');
      setLoading(false);
      return;
    }

    try {
      // 1. Open the Direct Link in a new tab
      // This is the most reliable way to earn with Monetag
      window.open(adUrl, '_blank');

      // 2. Start a countdown to give reward
      // We give reward after 10 seconds to ensure they saw the ad
      let timeLeft = 10;
      const interval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          clearInterval(interval);
          setLoading(false);
          onReward();
        }
      }, 1000);

    } catch (error) {
      console.error('Monetag error:', error);
      safeAlert('Ошибка', 'Не удалось открыть рекламу.');
      setLoading(false);
    }
  }, [adUrl, onReward, loading]);

  return (
    <TouchableOpacity 
      style={[styles.button, loading && { opacity: 0.7 }]} 
      onPress={showAd} 
      activeOpacity={0.7}
      disabled={loading}
    >
      {children || (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={styles.text}>
              {loading ? 'Проверка просмотра...' : 'Смотреть рекламу (Monetag)'}
            </Text>
            {loading && <ActivityIndicator size="small" color="#007AFF" style={{ marginLeft: 10 }} />}
          </View>
          <Text style={styles.reward}>+1.0 - 1.5 G</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  reward: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
