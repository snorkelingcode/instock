
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Pause, 
  StopCircle, 
  Volume2, 
  VolumeX 
} from "lucide-react";
import textToSpeech, { SpeechState } from "@/utils/textToSpeech";

interface ReadAloudProps {
  content: string;
  title: string;
  className?: string;
}

const ReadAloud = ({ content, title, className = "" }: ReadAloudProps) => {
  const [speechState, setSpeechState] = useState<SpeechState>(textToSpeech.getState());
  
  useEffect(() => {
    // Register for state changes
    textToSpeech.registerStateChangeCallback(setSpeechState);
    
    // Clean up when component unmounts
    return () => {
      textToSpeech.stop();
    };
  }, []);
  
  const handleStartReading = () => {
    const fullText = `${title}. ${content}`;
    textToSpeech.speak(fullText);
  };
  
  const handlePauseReading = () => {
    textToSpeech.pause();
  };
  
  const handleResumeReading = () => {
    textToSpeech.resume();
  };
  
  const handleStopReading = () => {
    textToSpeech.stop();
  };
  
  return (
    <div className={`flex items-center space-x-2 ${className}`} aria-live="polite">
      {speechState === 'idle' ? (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleStartReading}
          aria-label="Read article aloud"
          className="flex items-center"
        >
          <Volume2 className="mr-2 h-4 w-4" />
          Read Aloud
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          {speechState === 'speaking' ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePauseReading}
              aria-label="Pause reading"
            >
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResumeReading}
              aria-label="Resume reading"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleStopReading}
            aria-label="Stop reading"
          >
            <StopCircle className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-gray-500">
            {speechState === 'speaking' ? 'Reading...' : 'Paused'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ReadAloud;
