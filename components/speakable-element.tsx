import React, { useCallback, useContext } from 'react';
import { useElementSpeech } from '@/hooks/useElementSpeech';
import { SpeechContext } from '@/contexts/SpeechContext';

interface SpeakableElementProps {
  children: React.ReactNode;
  text?: string;
  disabled?: boolean;
  className?: string;
}

export function SpeakableElement({ 
  children, 
  text, 
  disabled = false,
  className = '',
}: SpeakableElementProps) {
  const settings = useContext(SpeechContext);
  const { speakOnHover, resetSpeech } = useElementSpeech();

  const extractText = useCallback((element: HTMLElement): string => {
    // First check for ARIA label or alt text
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    const altText = element.getAttribute('alt');
    if (altText) return altText;

    // For form controls, check for associated label
    if (element instanceof HTMLInputElement || 
        element instanceof HTMLSelectElement || 
        element instanceof HTMLTextAreaElement) {
      const id = element.id;
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) return label.textContent || '';
      }
    }

    // Get text content, handling special cases
    if (element instanceof HTMLInputElement) {
      if (element.type === 'button' || element.type === 'submit') {
        return element.value;
      }
      return element.placeholder || element.type;
    }

    // For interactive elements, add context
    if (element instanceof HTMLButtonElement) {
      return `Button: ${element.textContent || ''}`;
    }
    if (element instanceof HTMLAnchorElement) {
      return `Link: ${element.textContent || ''}`;
    }

    // Default to regular text content
    return element.textContent || '';
  }, []);

  const handleSpeakElement = useCallback((element: HTMLElement) => {
    if (!settings.enabled || disabled) return;
    
    const textToSpeak = text || extractText(element);
    
    if (textToSpeak) {
      console.log('Speaking text:', textToSpeak);
      speakOnHover(textToSpeak, element);
    }
  }, [settings.enabled, disabled, text, extractText, speakOnHover]);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    handleSpeakElement(e.currentTarget);
  }, [handleSpeakElement]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    handleSpeakElement(e.currentTarget);
  }, [handleSpeakElement]);

  const handleMouseLeave = useCallback(() => {
    if (!settings.enabled || disabled) return;
    resetSpeech();
  }, [settings.enabled, disabled, resetSpeech]);

  const handleBlur = useCallback(() => {
    if (!settings.enabled || disabled) return;
    resetSpeech();
  }, [settings.enabled, disabled, resetSpeech]);

  return (
    <div 
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      role={settings.enabled ? "button" : "none"}
      tabIndex={settings.enabled ? 0 : undefined}
      aria-label={text}
    >
      {children}
    </div>
  );
}