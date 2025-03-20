
export type SpeechState = 'idle' | 'speaking' | 'paused';

class TextToSpeech {
  private speechSynthesis: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;
  private state: SpeechState = 'idle';
  private currentIndex: number = 0;
  private textChunks: string[] = [];
  private onStateChange: ((state: SpeechState) => void) | null = null;

  constructor() {
    this.speechSynthesis = window.speechSynthesis;
  }

  public setState(state: SpeechState) {
    this.state = state;
    if (this.onStateChange) {
      this.onStateChange(state);
    }
  }

  public registerStateChangeCallback(callback: (state: SpeechState) => void) {
    this.onStateChange = callback;
  }

  public speak(text: string) {
    // Stop any ongoing speech
    this.stop();
    
    // Split text into manageable chunks (paragraphs)
    this.textChunks = text.split('\n').filter(chunk => chunk.trim().length > 0);
    this.currentIndex = 0;
    
    if (this.textChunks.length > 0) {
      this.speakCurrentChunk();
    }
  }

  private speakCurrentChunk() {
    if (this.currentIndex >= this.textChunks.length) {
      this.setState('idle');
      return;
    }

    this.utterance = new SpeechSynthesisUtterance(this.textChunks[this.currentIndex]);
    
    // Set preferred voice (prioritizing American English voices)
    const voices = this.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // First try to find American English voices
      const americanVoice = voices.find(voice => 
        (voice.lang === 'en-US' || voice.name.includes('US English') || voice.name.includes('American')) &&
        (voice.name.includes('Google') || voice.name.includes('Natural') || 
        voice.name.includes('Premium') || voice.name.includes('Enhanced'))
      );
      
      // If American voice found, use it
      if (americanVoice) {
        this.utterance.voice = americanVoice;
        console.log('Using American voice:', americanVoice.name);
      } 
      // Fallback to other English voices if American not found
      else {
        const englishVoice = voices.find(voice => 
          voice.lang.startsWith('en') &&
          (voice.name.includes('Google') || voice.name.includes('Natural') || 
          voice.name.includes('Premium') || voice.name.includes('Enhanced'))
        );
        
        if (englishVoice) {
          this.utterance.voice = englishVoice;
          console.log('Using English voice:', englishVoice.name);
        }
      }
    }

    // Set properties
    this.utterance.rate = 1.0; // Speed: 1.0 is normal
    this.utterance.pitch = 1.0; // Pitch: 1.0 is normal
    this.utterance.volume = 1.0; // Volume: 1.0 is maximum
    this.utterance.lang = 'en-US'; // Set language to US English

    // Handle chunk completion
    this.utterance.onend = () => {
      this.currentIndex++;
      this.speakCurrentChunk();
    };

    // Handle errors
    this.utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.setState('idle');
    };

    // Start speaking
    this.speechSynthesis.speak(this.utterance);
    this.setState('speaking');
  }

  public pause() {
    if (this.state === 'speaking') {
      this.speechSynthesis.pause();
      this.setState('paused');
    }
  }

  public resume() {
    if (this.state === 'paused') {
      this.speechSynthesis.resume();
      this.setState('speaking');
    }
  }

  public stop() {
    this.speechSynthesis.cancel();
    this.utterance = null;
    this.setState('idle');
  }

  public getState(): SpeechState {
    return this.state;
  }
}

// Create a singleton instance
const textToSpeech = new TextToSpeech();
export default textToSpeech;
