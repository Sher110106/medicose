import React, { useRef, useState, useEffect } from 'react';
import { useElementSpeech } from '@/hooks/useElementSpeech';

// Global store for tracking component switching
interface SpeechSwitchState {
  isSwitching: boolean;
  lastSwitchTime: number;
  switchDelayMs: number;
}

// Create a singleton to track speech state across components
const speechSwitchState: SpeechSwitchState = {
  isSwitching: false,
  lastSwitchTime: 0,
  switchDelayMs: 200 // Delay before speaking after component switch
};

interface SpeakableElementProps {
  text?: string; // Text to speak (overrides inner content)
  children: React.ReactNode;
  className?: string;
  disable?: boolean;
}

export const SpeakableElement: React.FC<SpeakableElementProps> = ({
  text,
  children,
  className = "",
  disable = false
}) => {
  const { speakOnHover, resetSpeech, hasUserInteracted, isSpeechSupported } = useElementSpeech();
  const elementRef = useRef<HTMLDivElement>(null);
  const [hasSpoken, setHasSpoken] = useState(false);

  // Reset the switching state if enough time has passed
  useEffect(() => {
    const now = Date.now();
    if (speechSwitchState.isSwitching && 
       (now - speechSwitchState.lastSwitchTime) > speechSwitchState.switchDelayMs) {
      speechSwitchState.isSwitching = false;
    }
  }, []);
  
  useEffect(() => {
    // Cancel speech when component unmounts (component switch)
    return () => {
      try {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          // Mark as switching when component unmounts
          speechSwitchState.isSwitching = true;
          speechSwitchState.lastSwitchTime = Date.now();
        }
      } catch (e) {
        console.warn('Error canceling speech on component unmount:', e);
      }
    };
  }, []);
  
  useEffect(() => {
    console.log('SpeakableElement mounted:', { 
      isSpeechSupported, 
      hasUserInteracted,
      disable
    });
    
    return () => {
      console.log('SpeakableElement unmounted');
    };
  }, [isSpeechSupported, hasUserInteracted, disable]);
  
  const handleMouseEnter = () => {
    console.log('🖱️ Mouse enter:', { 
      disable, 
      hasSpoken, 
      isSpeechSupported,
      elementId: elementRef.current?.id || 'no-id',
      elementContent: elementRef.current?.textContent?.substring(0, 20) + '...' || 'no-content',
      isSwitching: speechSwitchState.isSwitching
    });
    
    // Don't speak if disabled, already spoken, speech not supported, or in component switch delay
    if (disable || hasSpoken || !isSpeechSupported || speechSwitchState.isSwitching) {
      const reason = disable ? 'disabled' : 
                    hasSpoken ? 'already spoken' : 
                    !isSpeechSupported ? 'speech not supported' : 
                    'component switching delay';
                    
      console.log(`⛔ Not speaking because: ${reason}`);
      return;
    }
    
    const element = elementRef.current;
    if (element) {
      // Check if enough time has passed since last component switch
      const now = Date.now();
      if ((now - speechSwitchState.lastSwitchTime) < speechSwitchState.switchDelayMs) {
        console.log(`⏱️ Delaying speech due to recent component switch`);
        setTimeout(() => {
          // Ensure we're still hovering over this element
          if (element.matches(':hover')) {
            speakElementContent(element);
          }
        }, speechSwitchState.switchDelayMs);
      } else {
        speakElementContent(element);
      }
    }
  };
  
  const speakElementContent = (element: HTMLDivElement) => {
    // Use provided text or get text from the element
    const contentToSpeak = text || element.textContent || '';
    if (contentToSpeak) {
      console.log('📢 Attempting to speak on hover:', contentToSpeak.substring(0, 30) + '...');
      speakOnHover(contentToSpeak, element);
      setHasSpoken(true);
      console.log('✅ hasSpoken set to true');
    } else {
      console.log('⚠️ No content to speak');
    }
  };
  
  const handleMouseLeave = () => {
    console.log('🖱️ Mouse leave event');
    resetSpeech();
    // Reset hasSpoken when mouse leaves so it can be spoken again on next hover
    setHasSpoken(false);
    console.log('✅ hasSpoken reset to false');
  };
  
  // Generate a unique ID for the element if it doesn't have one
  useEffect(() => {
    if (elementRef.current && !elementRef.current.id) {
      elementRef.current.id = `speakable-${Math.random().toString(36).substring(2, 9)}`;
      console.log('🆔 Generated ID:', elementRef.current.id);
    }
  }, []);
  
  return (
    <div 
      ref={elementRef}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-live={disable ? "off" : "polite"}
      data-speakable="true"
    >
      {children}
      
      {isSpeechSupported && !hasUserInteracted && !disable && (
        <div className="sr-only">
          Click anywhere on the page to enable speech synthesis
        </div>
      )}
    </div>
  );
};
