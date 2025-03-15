import { useState, useRef, useCallback, useEffect, useContext } from 'react';
import { SpeechContext } from '@/contexts/SpeechContext';

export function useElementSpeech() {
  const settings = useContext(SpeechContext);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentElementRef = useRef<HTMLElement | null>(null);
  const spokenElementsRef = useRef<Set<HTMLElement>>(new Set());
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    
    if ('speechSynthesis' in window) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);
  
  useEffect(() => {
    const supported = 'speechSynthesis' in window;
    setIsSpeechSupported(supported);
    
    const handleUserInteraction = () => {
      setHasUserInteracted(true);
      if (supported && voices.length === 0) {
        const newVoices = window.speechSynthesis.getVoices();
        if (newVoices.length > 0) {
          setVoices(newVoices);
        }
      }
    };
    
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    
    if (supported) {
      window.speechSynthesis.cancel();
    }
    
    return () => {
      if (window.speechSynthesis && isSpeakingRef.current) {
        window.speechSynthesis.cancel();
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [voices.length]);
  
  const speakText = useCallback((text: string) => {
    if (!text || text.trim() === '' || !settings.enabled) {
      return;
    }
    
    if (!isSpeechSupported) {
      return;
    }
    
    if (!hasUserInteracted) {
      return;
    }
    
    if (window.speechSynthesis.paused) {
      try {
        window.speechSynthesis.resume();
      } catch (e) {
        console.error('Error resuming speech synthesis:', e);
      }
    }
    
    if (isSpeakingRef.current && currentUtteranceRef.current) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.error("Error canceling previous speech", e);
      }
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    try {
      // Apply speech settings
      if (settings.selectedVoice && voices.length > 0) {
        const selectedVoice = voices.find(voice => voice.name === settings.selectedVoice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }
      
      utterance.volume = settings.volume;
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      
    } catch (e) {
      console.warn('Error setting voice:', e);
    }
    
    currentUtteranceRef.current = utterance;
    
    utterance.onstart = () => {
      isSpeakingRef.current = true;
      console.log('Started speaking:', text);
    };
    
    utterance.onend = () => {
      isSpeakingRef.current = false;
      currentUtteranceRef.current = null;
      console.log('Finished speaking');
    };
    
    utterance.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setHasUserInteracted(false);
      }
      isSpeakingRef.current = false;
      currentUtteranceRef.current = null;
      console.error('Speech error:', event);
    };
    
    try {
      window.speechSynthesis.speak(utterance);
      
      const isChrome = window.navigator.userAgent.indexOf("Chrome") !== -1;
      if (isChrome) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    } catch (e) {
      console.error("Error speaking text:", e);
      isSpeakingRef.current = false;
      currentUtteranceRef.current = null;
    }
  }, [isSpeechSupported, hasUserInteracted, voices, settings]);
  
  const speakOnHover = useCallback((text: string, element: HTMLElement) => {
    if (!settings.enabled) return;
    
    if (spokenElementsRef.current.has(element)) {
      return;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      console.log('Speaking on hover:', text);
      speakText(text);
      spokenElementsRef.current.add(element);
      currentElementRef.current = element;
    }, settings.delay);
  }, [speakText, settings]);
  
  const resetSpeech = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (currentElementRef.current) {
      spokenElementsRef.current.delete(currentElementRef.current);
      currentElementRef.current = null;
    }

    // Cancel any ongoing speech when resetting
    if (isSpeakingRef.current && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
      currentUtteranceRef.current = null;
    }
  }, []);
  
  return { 
    speakOnHover, 
    resetSpeech, 
    speakText, 
    isSpeechSupported,
    hasUserInteracted,
    voices 
  };
}
