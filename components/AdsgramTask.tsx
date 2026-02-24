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
  const [loading, setLoading] = React.useState(false);

  const injectScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Adsgram) return resolve(true);
      
      const scriptId = 'adsgram-sdk-script';
      const existing = document.getElementById(scriptId);
      if (existing) existing.remove();

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://adsgram.ai/js/adsgram.js?ts=${Date.now()}`;
      script.async = true;
      
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      
      document.head.appendChild(script);
    });
  }, []);

  const showAd = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    
    console.log('Adsgram click, blockId:', blockId);
    
    // Attempt to load SDK dynamically
    const isReady = await injectScript();

    if (Platform.OS === 'web') {
      if (window.Adsgram) {
        const AdController = window.Adsgram.init({ blockId });
        try {
          await AdController.show();
          onReward();
        } catch (error: any) {
          console.error('Adsgram error:', error);
          if (error && error.error === 'ad_not_shown') {
            safeAlert('Инфо', 'Реклама не была досмотрена.');
          } else if (error && error.error === 'no_ads') {
            safeAlert('Ошибка', 'В вашем регионе сейчас нет доступной рекламы. Попробуйте через час.');
          } else {
            safeAlert('Ошибка рекламы', error?.description || 'Ошибка загрузки ролика.');
          }
        }
      } else {
        safeAlert('Блокировка сети', 
          `Ваше устройство или провайдер блокируют доступ к рекламе (adsgram.ai).\n\n` +
          `КАК ИСПРАВИТЬ:\n` +
          `1. Выключите VPN (или смените страну).\n` +
          `2. Выключите Private DNS в настройках телефона.\n` +
          `3. Попробуйте зайти через Мобильный интернет.`
        );
      }
    } else {
      safeAlert('Инфо', 'Реклама работает только в Telegram.');
    }
    setLoading(false);
  }, [blockId, onReward, onError, injectScript, loading]);

  return (
    <TouchableOpacity 
      style={[styles.button, loading && { opacity: 0.5 }]} 
      onPress={showAd} 
      activeOpacity={0.7}
      disabled={loading}
    >
      {children || (
        <>
          <Text style={styles.text}>{loading ? 'Загрузка...' : 'Смотреть рекламу'}</Text>
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
