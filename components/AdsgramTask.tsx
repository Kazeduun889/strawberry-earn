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
  const injectScript = useCallback(() => {
    if (Platform.OS !== 'web' || window.Adsgram) return;
    
    console.log('Adsgram: Silent injection...');
    const scriptId = 'adsgram-sdk-script';
    const existingScript = document.getElementById(scriptId);
    if (existingScript) existingScript.remove();

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://adsgram.ai/js/adsgram.js`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // Manual script injection on mount
  React.useEffect(() => {
    injectScript();
  }, [injectScript]);

  const showAd = useCallback(async () => {
    console.log('Adsgram click, blockId:', blockId);
    
    if (Platform.OS === 'web') {
      // Try to re-inject if missing
      if (!window.Adsgram) {
        injectScript();
        // Wait a tiny bit for script to potentially load
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (window.Adsgram) {
        const AdController = window.Adsgram.init({ blockId });
        try {
          await AdController.show();
          onReward();
        } catch (error: any) {
          console.error('Adsgram error:', error);
          if (error && error.error === 'ad_not_shown') {
            safeAlert('Инфо', 'Реклама не была досмотрена до конца.');
          } else {
            if (onError) onError(error);
            else safeAlert('Ошибка рекламы', 'Реклама временно недоступна. Попробуйте нажать еще раз через пару секунд.');
          }
        }
      } else {
        safeAlert('Ошибка', 'Рекламный сервис загружается. Попробуйте нажать еще раз через пару секунд.');
      }
    } else {
      safeAlert('Инфо', 'Реклама доступна только внутри Telegram.');
    }
  }, [blockId, onReward, onError, injectScript]);

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
