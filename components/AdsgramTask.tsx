import React, { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';

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
  const [isScriptLoaded, setIsScriptLoaded] = React.useState(!!window.Adsgram);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const injectScript = useCallback(() => {
    if (Platform.OS !== 'web') return;
    
    console.log('Adsgram: Injecting script...');
    setLoadError(null);
    
    const scriptId = 'adsgram-sdk-script';
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://adsgram.ai/js/adsgram.js?v=${Date.now()}`; // Add timestamp to bypass cache
    script.async = true;
    
    script.onload = () => {
      console.log('Adsgram: SDK loaded successfully');
      setIsScriptLoaded(true);
      setLoadError(null);
    };
    
    script.onerror = (e) => {
      console.error('Adsgram: SDK load failed', e);
      setIsScriptLoaded(false);
      setLoadError('Скрипт заблокирован (AdBlock/DNS)');
    };
    
    document.head.appendChild(script);
  }, []);

  // Manual script injection on mount
  React.useEffect(() => {
    injectScript();
  }, [injectScript]);

  const showAd = useCallback(async () => {
    console.log('Adsgram click, blockId:', blockId);
    
    if (Platform.OS === 'web') {
      if (window.Adsgram) {
        const AdController = window.Adsgram.init({ blockId });
        try {
          await AdController.show();
          console.log('Ad shown successfully');
          onReward();
        } catch (error: any) {
          console.error('Adsgram error:', error);
          
          if (error && error.error === 'ad_not_shown') {
            safeAlert('Инфо', 'Реклама не была досмотрена до конца.');
          } else {
            const errorMsg = error?.description || error?.message || 'Неизвестная ошибка';
            if (onError) onError(error);
            else safeAlert('Ошибка рекламы', `Ошибка: ${errorMsg}. Попробуйте позже.`);
          }
        }
      } else {
        console.error('Adsgram library not found on window');
        injectScript(); // Try to re-inject
        safeAlert('Ошибка', 'Рекламный сервис всё ещё не загружен. Попробуйте нажать ещё раз через 5 секунд. Если не поможет — выключите AdBlock или смените интернет.');
      }
    } else {
      safeAlert('Инфо', 'Реклама доступна только внутри Telegram.');
    }
  }, [blockId, onReward, onError, injectScript]);

  return (
    <View>
      <TouchableOpacity style={styles.button} onPress={showAd} activeOpacity={0.7}>
        {children || (
          <>
            <Text style={styles.text}>Смотреть рекламу</Text>
            <Text style={styles.reward}>+1.0 - 1.5 G</Text>
          </>
        )}
      </TouchableOpacity>
      {!isScriptLoaded && (
        <TouchableOpacity onPress={injectScript} style={{ marginTop: -5, marginBottom: 10, padding: 5 }}>
          <Text style={{ color: 'red', fontSize: 10, textAlign: 'center' }}>
            ⚠️ Реклама не загружена. Нажмите сюда, чтобы попробовать снова.
          </Text>
        </TouchableOpacity>
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
