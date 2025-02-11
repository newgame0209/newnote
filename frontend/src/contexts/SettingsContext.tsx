import React, { createContext, useContext, useState } from 'react';

type VoiceType = 'female' | 'male';

interface SettingsContextType {
  voiceType: VoiceType;
  setVoiceType: (type: VoiceType) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [voiceType, setVoiceType] = useState<VoiceType>('female');

  return (
    <SettingsContext.Provider value={{ voiceType, setVoiceType }}>
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
