import React, { useEffect, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';

interface AdsgramProps {
  blockId: string;
  onReward: () => void;
  onError?: (err: any) => void;
  children?: React.ReactNode;
}

declare global {
  interface Window {
    Adsgram?: {
      init: (params: { blockId: string; debug?: boolean; debugBannerType?: 'FullscreenMedia' }) => {
        show: () => Promise<void>;
      };
    };
  }
}

export const AdsgramTask: React.FC<AdsgramProps> = ({ blockId, onReward, onError, children }) => {
  const showAd = useCallback(async () => {
    if (Platform.OS === 'web') {
      if (window.Adsgram) {
        const AdController = window.Adsgram.init({ blockId, debug: true, debugBannerType: 'FullscreenMedia' });
        try {
          await AdController.show();
          onReward();
        } catch (error) {
          console.error('Adsgram error:', error);
          if (onError) onError(error);
          else Alert.alert('Ошибка', 'Не удалось показать рекламу');
        }
      } else {
        Alert.alert('Ошибка', 'Библиотека рекламы не загружена');
      }
    } else {
      Alert.alert('Инфо', 'Реклама доступна только в Telegram Mini App');
      // For testing on mobile native, we might just grant reward
      // onReward(); 
    }
  }, [blockId, onReward, onError]);

  return (
    <TouchableOpacity style={styles.button} onPress={showAd}>
      {children || (
        <>
          <Text style={styles.text}>Смотреть рекламу</Text>
          <Text style={styles.reward}>0.4 - 0.8 G</Text>
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
