/**
 * Utility function to test if speech synthesis is working correctly
 * @param text The text to speak as a test
 * @returns A promise that resolves when the speech is complete
 */
export function testSpeechSynthesis(text: string = "Testing speech synthesis"): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis is not supported in this browser');
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.onend = () => {
      console.log('Speech test completed successfully');
      resolve(true);
    };
    
    utterance.onerror = (event) => {
      console.error('Speech test failed:', event);
      reject(new Error('Speech synthesis error'));
    };
    
    console.log('Starting speech test...');
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Get all available voices for speech synthesis
 * @returns Array of available voices
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) {
    console.error('Speech synthesis is not supported in this browser');
    return [];
  }
  
  return window.speechSynthesis.getVoices();
}

/**
 * Check if speech synthesis is currently speaking
 * @returns Boolean indicating if speech is in progress
 */
export function isSpeaking(): boolean {
  if (!('speechSynthesis' in window)) {
    return false;
  }
  
  return window.speechSynthesis.speaking;
}
