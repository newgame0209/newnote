import React, { createContext, useContext, useState } from 'react';

type VoiceType = 'female' | 'male';
type SpeakingRate = 'slow' | 'normal' | 'fast';

interface SettingsContextType {
  voiceType: VoiceType;
  setVoiceType: (type: VoiceType) => void;
  speakingRate: SpeakingRate;
  setSpeakingRate: (rate: SpeakingRate) => void;
  getSpeakingRateValue: () => number; // 数値としての話速を返す
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [voiceType, setVoiceType] = useState<VoiceType>('female');
  const [speakingRate, setSpeakingRate] = useState<SpeakingRate>('normal');

  // 話速の文字列から数値に変換する関数
  const getSpeakingRateValue = (): number => {
    switch (speakingRate) {
      case 'slow':
        return 0.75;
      case 'fast':
        return 1.5;
      case 'normal':
      default:
        return 1.0;
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      voiceType, 
      setVoiceType,
      speakingRate,
      setSpeakingRate,
      getSpeakingRateValue
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
