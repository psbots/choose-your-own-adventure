import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { StoryNode } from '../types';
import ChoiceButton from './ChoiceButton';
import LoadingSpinner from './LoadingSpinner';
import DrawingCanvas from './DrawingCanvas';

interface AdventureScreenProps {
  node: StoryNode;
  onChoice: (choice: string, drawingDataUrl: string | null) => void;
  onReset: () => void;
  isLoading: boolean;
}

const AdventureScreen: React.FC<AdventureScreenProps> = ({ node, onChoice, onReset, isLoading }) => {
  const [drawingData, setDrawingData] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 512, height: 512 });
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement && node.audioBase64) {
      audioElement.src = `data:audio/mpeg;base64,${node.audioBase64}`;
      // Autoplay when a new node is loaded and audio is available.
      audioElement.play().catch(e => console.warn("Audio autoplay was prevented by the browser.", e));
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePauseOrEnd = () => setIsPlaying(false);

    audioElement?.addEventListener('play', handlePlay);
    audioElement?.addEventListener('pause', handlePauseOrEnd);
    audioElement?.addEventListener('ended', handlePauseOrEnd);

    return () => {
      audioElement?.removeEventListener('play', handlePlay);
      audioElement?.removeEventListener('pause', handlePauseOrEnd);
      audioElement?.removeEventListener('ended', handlePauseOrEnd);
    };
  }, [node.audioBase64]);

  const togglePlayPause = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
  };


  const handleChoice = (choiceText: string) => {
    onChoice(choiceText, drawingData);
    setDrawingData(null);
  };
  
  const memoizedImage = useMemo(() => {
    return <img 
      src={`data:image/jpeg;base64,${node.imageBase64}`} 
      alt="Story scene" 
      className="rounded-2xl shadow-lg object-contain w-full h-full"
      onLoad={(e) => {
          const img = e.currentTarget;
          setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      }}
    />;
  }, [node.imageBase64]);

  const drawingPrompt = useMemo(() => {
    return node.choices.find(c => c.drawingPrompt)?.drawingPrompt ?? null;
  }, [node.choices]);

  const showDrawingCanvas = !isLoading && drawingPrompt;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center p-4">
      <audio ref={audioRef} className="hidden" />
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Image and Drawing Column */}
            <div className="relative aspect-square w-full">
                {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-2xl">
                        <LoadingSpinner message="Imagining the next scene..." />
                    </div>
                ) : (
                    <>
                        {memoizedImage}
                        {showDrawingCanvas && (
                            <DrawingCanvas 
                                width={imageSize.width} 
                                height={imageSize.height}
                                onDrawingChange={setDrawingData}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Story and Choices Column */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Your Adventure</h2>
                  {node.audioBase64 && !isLoading && (
                    <button 
                      onClick={togglePlayPause} 
                      aria-label={isPlaying ? "Pause narration" : "Play narration"}
                      className="p-2 rounded-full text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-60 transition-colors"
                    >
                      {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
                <div className="prose max-w-none p-4 bg-blue-50/50 rounded-lg text-gray-700 text-lg leading-relaxed max-h-48 overflow-y-auto mb-4">
                  {isLoading ? (
                    <p className="animate-pulse">The next part of the story is being written...</p>
                  ) : (
                    <p>{node.storyText}</p>
                  )}
                </div>
                {showDrawingCanvas && (
                    <div className="my-4 p-4 bg-yellow-100/70 border-l-4 border-yellow-400 text-yellow-800 rounded-r-lg shadow-inner">
                        <p className="font-bold text-lg flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
                            </svg>
                            Time to Draw!
                        </p>
                        <p className="mt-1">{drawingPrompt}</p>
                    </div>
                )}
              </div>
              
              {isLoading ? (
                 <div className="flex-grow flex items-center justify-center">
                    <p className="text-purple-600 font-semibold">Waiting for your next move...</p>
                 </div>
              ) : (
                <div className="space-y-3 mt-auto">
                    {node.choices.map((choice, index) => (
                    <ChoiceButton
                        key={index}
                        text={choice.text}
                        onClick={() => handleChoice(choice.text)}
                        disabled={isLoading}
                    />
                    ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 text-center">
            <button onClick={onReset} className="text-sm text-gray-500 hover:text-red-500 transition">Start a New Adventure</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdventureScreen;