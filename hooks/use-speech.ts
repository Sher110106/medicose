import { useState, useCallback, useEffect, useRef } from 'react';

interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  delay?: number;
}

export function useSpeech(options: SpeechOptions = {}) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef(false);

  const getElementText = (element: HTMLElement): string => {
    // Get only the direct text of this element, not its children
    let text = '';
    
    // Get aria-label if available
    if (element.getAttribute('aria-label')) {
      return element.getAttribute('aria-label') || '';
    }
    
    // Get alt text for images
    if (element.tagName.toLowerCase() === 'img' && element.getAttribute('alt')) {
      return element.getAttribute('alt') || '';
    }

    // Get direct text content, excluding child elements
    for (let i = 0; i < element.childNodes.length; i++) {
      const node = element.childNodes[i];
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent?.trim() || '';
      }
    }

    // If no direct text was found, check for button/input values
    if (!text) {
      if (element.tagName.toLowerCase() === 'input') {
        text = (element as HTMLInputElement).value || element.getAttribute('placeholder') || '';
      } else if (element.tagName.toLowerCase() === 'button') {
        text = element.textContent?.trim() || '';
      }
    }

    // If still no text, use the accessible name from aria attributes
    if (!text && element.getAttribute('aria-label')) {
      text = element.getAttribute('aria-label') || '';
    }

    // If still no text found but the element has a role, include that in the spoken text
    if (!text && element.getAttribute('role')) {
      const role = element.getAttribute('role');
      text = `${role} element`;
    }

    return text || '';
  };
  
  const speak = useCallback((text: string) => {
    if (!isEnabled || !isInitialized || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    
    isSpeakingRef.current = true;
    
    utterance.onend = () => {
      isSpeakingRef.current = false;
    };
    
    window.speechSynthesis.speak(utterance);
  }, [isEnabled, isInitialized, options]);

  const initializeSpeech = useCallback(() => {
    if (!isInitialized && window.speechSynthesis) {
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const handleMouseEnter = useCallback((event: MouseEvent) => {
    if (!isEnabled || !isInitialized) return;
    
    const element = event.target as HTMLElement;
    
    // Skip if this is the same element
    if (hoveredElement === element) return;
    
    // Only process elements within the accessibility controls
    const isWithinAccessibilityControls = element.closest('[role="region"][aria-label="Accessibility Controls"]');
    if (!isWithinAccessibilityControls && !isInitialized) return;

    setHoveredElement(element);
    
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    
    if (isSpeakingRef.current) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
    }
    
    hoverTimerRef.current = setTimeout(() => {
      const textContent = getElementText(element);
      if (textContent) {
        speak(textContent);
      }
    }, options.delay || 400);
  }, [isEnabled, isInitialized, speak, hoveredElement, options.delay]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoveredElement(null);
  }, []);

  const handleFocusCapture = useCallback((event: FocusEvent) => {
    if (!isEnabled || !isInitialized) return;
    
    const element = event.target as HTMLElement;
    const textContent = getElementText(element);
    
    // Cancel any ongoing speech
    if (isSpeakingRef.current) {
      window.speechSynthesis.cancel();
    }
    
    if (textContent) {
      speak(textContent);
    }
  }, [isEnabled, isInitialized, speak]);

  useEffect(() => {
    if (isEnabled) {
      document.addEventListener('mouseenter', handleMouseEnter, true);
      document.addEventListener('mouseleave', handleMouseLeave, true);
      document.addEventListener('focusin', handleFocusCapture, true);
    }

    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
      document.removeEventListener('focusin', handleFocusCapture, true);
      
      // Clean up any pending timers
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      
      // Cancel any ongoing speech
      if (isSpeakingRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isEnabled, handleMouseEnter, handleMouseLeave, handleFocusCapture]);

  return {
    isEnabled,
    setEnabled: setIsEnabled,
    speak,
    hoveredElement,
    initializeSpeech
  };
}