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
    
    console.log('Adsgram: Loading SDK...');
    const scriptId = 'adsgram-sdk-script';
    
    // Remove if already exists to retry fresh
    const existing = document.getElementById(scriptId);
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://adsgram.ai/js/adsgram.js`;
    script.async = false; // Disable async to force immediate execution
    
    script.onload = () => {
      console.log('Adsgram: Script loaded into DOM and executed');
    };
    
    script.onerror = () => {
      console.error('Adsgram: Network error while loading script');
    };

    document.body.appendChild(script); // Append to body instead of head
  }, []);

  // Manual script injection on mount
  React.useEffect(() => {
    injectScript();
  }, [injectScript]);

  const showAd = useCallback(async () => {
    console.log('Adsgram click, blockId:', blockId);
    
    if (Platform.OS === 'web') {
      if (!window.Adsgram) {
        // Try one more time to inject
        injectScript();
        
        safeAlert('Инфо', 'Рекламный сервис подгружается. Пожалуйста, подождите 3 секунды и нажмите еще раз.');
        return;
      }

      const AdController = window.Adsgram.init({ blockId });
      try {
        await AdController.show();
        onReward();
      } catch (error: any) {
        console.error('Detailed Adsgram error object:', JSON.stringify(error));
        
        if (error && error.error === 'ad_not_shown') {
          safeAlert('Инфо', 'Реклама не была досмотрена до конца.');
        } else if (error && error.error === 'no_ads') {
          safeAlert('Ошибка', 'В данный момент рекламы нет. Попробуйте через пару минут.');
        } else {
          const errorType = error?.error || 'Unknown';
          const errorDesc = error?.description || 'No description';
          if (onError) onError(error);
          else safeAlert('Ошибка рекламы', `Тип: ${errorType}\nОписание: ${errorDesc}\n\nПопробуйте нажать еще раз.`);
        }
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
