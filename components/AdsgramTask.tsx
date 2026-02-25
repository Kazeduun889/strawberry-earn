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
  const [simulationActive, setSimulationActive] = React.useState(false);
  const [timer, setTimer] = React.useState(5);

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

  const startSimulation = useCallback(() => {
    setSimulationActive(true);
    setTimer(5);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSimulationActive(false);
          onReward();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onReward]);

  const showAd = useCallback(async () => {
    if (loading || simulationActive) return;
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
          } else {
            // If real ad fails but SDK is there, maybe still offer simulation?
            // For now just error
            safeAlert('Ошибка рекламы', 'Реклама временно недоступна (no_ads).');
          }
        }
      } else {
        // FALLBACK: SDK BLOCKED BY ISP
        safeAlert('Блокировка сети', 
          `Домен adsgram.ai заблокирован вашим провайдером или AdBlock.\n\n` +
          `ВКЛЮЧЕН РЕЖИМ СИМУЛЯЦИИ ДЛЯ ПРОВЕРКИ БАЛАНСА.`
        );
        startSimulation();
      }
    } else {
      safeAlert('Инфо', 'Реклама работает только в Telegram.');
    }
    setLoading(false);
  }, [blockId, onReward, onError, injectScript, loading, simulationActive, startSimulation]);

  return (
    <View>
      <TouchableOpacity 
        style={[styles.button, (loading || simulationActive) && { opacity: 0.5 }]} 
        onPress={showAd} 
        activeOpacity={0.7}
        disabled={loading || simulationActive}
      >
        {children || (
          <>
            <Text style={styles.text}>
              {simulationActive ? `Идет просмотр (${timer}с)...` : loading ? 'Загрузка...' : 'Смотреть рекламу'}
            </Text>
            <Text style={styles.reward}>+1.0 - 1.5 G</Text>
          </>
        )}
      </TouchableOpacity>
      
      {simulationActive && (
        <View style={{ padding: 10, backgroundColor: '#fffbe6', borderRadius: 8, marginTop: 5 }}>
          <Text style={{ fontSize: 12, color: '#856404', textAlign: 'center' }}>
            ⚠️ Это симуляция, так как реальная реклама заблокирована вашей сетью.
          </Text>
        </View>
      )}
    </View>
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
