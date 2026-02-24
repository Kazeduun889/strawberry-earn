import React, { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, View } from 'react-native';

declare global {
  interface Window {
    Adsgram?: {
      init: (params: { blockId: string; debug?: boolean }) => {
        show: () => Promise<void>;
      };
    };
  }
}

interface AdsgramProps {
  blockId: string;
  onReward: () => void;
  onError?: (error: any) => void;
  children?: React.ReactNode;
}

// Helper for Web Alerts
const safeAlert = (title: string, msg?: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${msg}`);
  } else {
    // In components we don't always have Alert from react-native here, 
    // but we can import it or use console.error
    console.error(title, msg);
  }
};

export const AdsgramTask: React.FC<AdsgramProps> = ({ blockId, onReward, onError, children }) => {
  const showAd = useCallback(async () => {
    console.log('Adsgram click, blockId:', blockId);
    
    // Detailed check of what's happening
    const isLoadedOnWindow = !!window.Adsgram;
    const loadErrorFlag = (window as any).adsgramLoadError;
    const loadedFlag = (window as any).adsgramLoaded;

    if (Platform.OS === 'web') {
      if (window.Adsgram) {
        const AdController = window.Adsgram.init({ blockId });
        try {
          await AdController.show();
          onReward();
        } catch (error: any) {
          console.error('Detailed Adsgram error:', error);
          
          if (error && error.error === 'ad_not_shown') {
            safeAlert('Инфо', 'Реклама не была досмотрена до конца.');
          } else if (error && error.error === 'no_ads') {
            safeAlert('Ошибка', 'В данный момент рекламы нет (no_ads). Попробуйте позже.');
          } else {
            const errorMsg = error?.description || error?.message || JSON.stringify(error);
            if (onError) onError(error);
            else safeAlert('Ошибка рекламы', `Ошибка: ${errorMsg}`);
          }
        }
      } else {
        safeAlert('Ошибка загрузки', 
          `Рекламный сервис не загружен.\n\n` +
          `Статус в HTML: ${loadedFlag ? 'OK' : 'FAIL'}\n` +
          `Ошибка сети: ${loadErrorFlag ? 'ДА' : 'НЕТ'}\n` +
          `Объект на window: ${isLoadedOnWindow ? 'ЕСТЬ' : 'НЕТ'}\n\n` +
          `Попробуйте выключить AdBlock/VPN или сменить Wi-Fi на 4G.`
        );
      }
    } else {
      safeAlert('Инфо', 'Реклама доступна только внутри Telegram.');
    }
  }, [blockId, onReward, onError]);

  return (
    <TouchableOpacity style={styles.button} onPress={showAd} activeOpacity={0.7}>
      {children || (
        <>
          <Text style={styles.text}>Смотреть рекламу</Text>
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
    color: '#007AFF', // Blue color
  },
});
