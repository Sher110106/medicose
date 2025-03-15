import { useState, useRef, useCallback, useEffect } from 'react';

export function useElementSpeech() {
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentElementRef = useRef<HTMLElement | null>(null);
  const spokenElementsRef = useRef<Set<HTMLElement>>(new Set());
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Load available voices and handle voice changed events
  useEffect(() => {
    const loadVoices = () => {
      console.log('🎙️ Loading voices...');
      const availableVoices = window.speechSynthesis.getVoices();
      console.log('🎙️ Voices loaded:', availableVoices.length);
      setVoices(availableVoices);
      return availableVoices;
    };
    
    if ('speechSynthesis' in window) {
      // Load voices on mount
      const initialVoices = loadVoices();
      console.log('Initial voices:', initialVoices.length);
      
      // Set up event for voice changes
      window.speechSynthesis.onvoiceschanged = () => {
        console.log('🎙️ Voices changed event triggered');
        loadVoices();
      };
    }
  }, []);
  
  useEffect(() => {
    // Check if speech synthesis is supported
    const supported = 'speechSynthesis' in window;
    console.log('🔊 Speech synthesis supported:', supported);
    setIsSpeechSupported(supported);
    
    if (!supported) {
      console.warn('Speech synthesis is not supported in this browser');
    }
    
    // Add user interaction listeners to set the hasUserInteracted flag
    const handleUserInteraction = () => {
      console.log('🖱️ User interaction detected');
      setHasUserInteracted(true);
      
      // On Safari/iOS, we may need to try initializing speech on user interaction
      if (supported && voices.length === 0) {
        try {
          console.log('🔊 Trying to initialize voices after user interaction');
          const newVoices = window.speechSynthesis.getVoices();
          if (newVoices.length > 0) {
            console.log('🎙️ Found voices after user interaction:', newVoices.length);
            setVoices(newVoices);
          }
        } catch (e) {
          console.error('Error getting voices after user interaction:', e);
        }
      }
    };
    
    // These events indicate user interaction with the page
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    
    // Try to initialize speech synthesis
    if (supported) {
      try {
        // Some browsers need this initialization call
        window.speechSynthesis.cancel();
        console.log('🔊 Speech synthesis initialized');
      } catch (e) {
        console.error('Error initializing speech synthesis:', e);
      }
    }
    
    // Clean up function to cancel any pending speech when component unmounts
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
    if (!text || text.trim() === '') {
      console.warn('🔊 Empty text provided, not speaking');
      return;
    }
    
    console.log('🗣️ Attempting to speak:', text);
    console.log('Speech support status:', isSpeechSupported);
    console.log('Has user interacted:', hasUserInteracted);
    
    if (!isSpeechSupported) {
      console.warn('Speech not supported, cannot speak');
      return;
    }
    
    // If user hasn't interacted yet, don't try to speak
    if (!hasUserInteracted) {
      console.warn('Speech synthesis requires user interaction first. Click anywhere on the page to enable speech.');
      return;
    }
    
    // Check if the speech synthesis is paused and resume it before trying to speak
    if (window.speechSynthesis.paused) {
      console.log('🔊 Speech synthesis was paused, resuming...');
      try {
        window.speechSynthesis.resume();
      } catch (e) {
        console.error('Error resuming speech synthesis:', e);
      }
    }
    
    // Safe cancellation of any ongoing speech
    if (isSpeakingRef.current && currentUtteranceRef.current) {
      console.log('Canceling previous speech');
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.log("Error canceling previous speech", e);
      }
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice to a default system voice if available
    try {
      console.log('Available voices:', voices.length);
      
      // Try to find and use a voice
      if (voices.length > 0) {
        // Prefer an English voice if available
        const englishVoice = voices.find(voice => voice.lang.includes('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
          console.log('Using voice:', englishVoice.name);
        } else {
          utterance.voice = voices[0];
          console.log('Using default voice:', voices[0].name);
        }
      } else {
        // Fallback: try getting voices directly
        const directVoices = window.speechSynthesis.getVoices();
        console.log('Direct check - available voices:', directVoices.length);
        
        if (directVoices.length > 0) {
          utterance.voice = directVoices[0];
          console.log('Using fallback direct voice:', directVoices[0].name);
        }
      }
      
      // Set additional utterance properties
      utterance.volume = 1; // Full volume
      utterance.rate = 1; // Normal speed
      utterance.pitch = 1; // Normal pitch
      
    } catch (e) {
      console.warn('Error setting voice:', e);
    }
    
    currentUtteranceRef.current = utterance;
    
    utterance.onstart = () => {
      isSpeakingRef.current = true;
      console.log('🔊 Speaking started:', text);
    };
    
    utterance.onend = () => {
      console.log('🔊 Speaking ended');
      isSpeakingRef.current = false;
      currentUtteranceRef.current = null;
    };
    
    utterance.onerror = (event) => {
      // Handle specific error types
      if (event.error === 'not-allowed') {
        console.warn('Speech synthesis permission denied. User must interact with the page first.');
        setHasUserInteracted(false); // Reset flag as the browser is indicating interaction requirements
      } else if (event.error !== 'canceled') {
        // Improved error logging with more details
        console.warn(`Speech error (${event.error}):`, {
          errorType: event.error,
          errorMessage: 'Speech synthesis error',
          utteranceText: utterance.text.substring(0, 30) + (utterance.text.length > 30 ? '...' : ''),
          elapsedTime: event.elapsedTime || 0
        });
      }
      isSpeakingRef.current = false;
      currentUtteranceRef.current = null;
    };
    
    try {
      console.log('💬 Calling speechSynthesis.speak()');
      window.speechSynthesis.speak(utterance);
      
      // If browser is Chrome, work around a bug where utterances over ~15 seconds get cut off
      const isChrome = window.navigator.userAgent.indexOf("Chrome") !== -1;
      if (isChrome) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
        console.log('Applied Chrome workaround for speech synthesis');
      }
    } catch (e) {
      console.error("Error speaking text:", e);
      isSpeakingRef.current = false;
      currentUtteranceRef.current = null;
    }
  }, [isSpeechSupported, hasUserInteracted, voices]);
  
  const speakOnHover = useCallback((text: string, element: HTMLElement) => {
    console.log('🖱️ Element hovered:', element.tagName, text.substring(0, 20) + (text.length > 20 ? '...' : ''));
    
    // If we've already spoken this element during this hover session, don't speak again
    if (spokenElementsRef.current.has(element)) {
      console.log('⏭️ Element already spoken, skipping');
      return;
    }
    
    // Clear any existing timeouts
    if (timeoutRef.current) {
      console.log('⏱️ Clearing previous hover timeout');
      clearTimeout(timeoutRef.current);
    }
    
    // Set a timeout to speak the text (to avoid speaking on quick hover-passes)
    console.log('⏱️ Setting hover timeout');
    timeoutRef.current = setTimeout(() => {
      console.log('⏱️ Hover timeout completed, attempting to speak');
      speakText(text);
      
      // Mark this element as having been spoken during this hover session
      console.log('✓ Marking element as spoken');
      spokenElementsRef.current.add(element);
      currentElementRef.current = element;
    }, 150); // 150ms delay to prevent accidental hover triggers
  }, [speakText]);
  
  const resetSpeech = useCallback(() => {
    console.log('🔄 Resetting speech state');
    
    // Clear timeout to prevent pending speech
    if (timeoutRef.current) {
      console.log('⏱️ Clearing hover timeout during reset');
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Reset the list of spoken elements when leaving an element
    if (currentElementRef.current) {
      console.log('🗑️ Removing element from spoken elements list');
      spokenElementsRef.current.delete(currentElementRef.current);
      currentElementRef.current = null;
    }
  }, []);
  
  return { 
    speakOnHover, 
    resetSpeech, 
    speakText, 
    isSpeechSupported,
    hasUserInteracted 
  };
}
