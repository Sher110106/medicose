import { createContext } from 'react';

export interface SpeechSettings {
  enabled: boolean;
  delay: number;
  rate: number;
  pitch: number;
  volume: number;
  selectedVoice: string;
}

export const SpeechContext = createContext<SpeechSettings>({
  enabled: false,
  delay: 150,
  rate: 1,
  pitch: 1,
  volume: 1,
  selectedVoice: '',
});

export const SpeechProvider = ({ children, settings }: { 
  children: React.ReactNode;
  settings: SpeechSettings;
}) => (
  <SpeechContext.Provider value={settings}>
    {children}
  </SpeechContext.Provider>
);