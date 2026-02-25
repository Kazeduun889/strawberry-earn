import React, { useCallback, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, View, ActivityIndicator } from 'react-native';

interface MonetagProps {
  zoneId: string;
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

export const MonetagTask: React.FC<MonetagProps> = ({ zoneId, onReward, children }) => {
  const [loading, setLoading] = useState(false);

  const showAd = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    if (Platform.OS !== 'web') {
      safeAlert('Инфо', 'Реклама доступна только в веб-версии Telegram.');
      setLoading(false);
      return;
    }

    try {
      // Monetag logic usually involves opening a SmartLink or triggering a Tag
      // For Telegram Mini Apps, the most reliable way is using their SmartLink system
      // or a Direct Link if you have one.
      
      // If you have a specific SmartLink URL from Monetag, we should use it here.
      // Since we only have a zoneId, we'll simulate the "In-Page Push" or "Vignette" check.
      
      console.log('Monetag: Triggering zone', zoneId);
      
      // We will use a standard delay to simulate ad loading/viewing
      // In a real production setup with Monetag, you would use their 'onclick' or 'interstitial' tag.
      setTimeout(() => {
        setLoading(false);
        onReward();
      }, 3000);

    } catch (error) {
      console.error('Monetag error:', error);
      safeAlert('Ошибка', 'Не удалось загрузить рекламу. Попробуйте позже.');
      setLoading(false);
    }
  }, [zoneId, onReward, loading]);

  return (
    <TouchableOpacity 
      style={[styles.button, loading && { opacity: 0.7 }]} 
      onPress={showAd} 
      activeOpacity={0.7}
      disabled={loading}
    >
      {children || (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.text}>Смотреть рекламу (Monetag)</Text>
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
