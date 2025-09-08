import React, { useState, useCallback } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import { GameState } from './types';
import type { Adventure, StoryNode, AgeGroup, Theme } from './types';
import OnboardingScreen from './components/OnboardingScreen';
import AdventureScreen from './components/AdventureScreen';
import LoadingSpinner from './components/LoadingSpinner';
import Confetti from './components/Confetti';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [adventure, setAdventure] = useLocalStorage<Adventure>('adventure-game', {
    ageGroup: null,
    theme: null,
    storyArc: null,
    storyTree: [],
    currentNodeId: null,
  });

  const [gameState, setGameState] = useState<GameState>(
    adventure.currentNodeId ? GameState.ADVENTURE : GameState.ONBOARDING
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleStartAdventure = useCallback(async () => {
    if (!adventure.ageGroup || !adventure.theme) return;
    setGameState(GameState.LOADING);
    setError(null);
    try {
      const { storyText, choices, imageBase64, isEnding, storyArc, audioBase64 } = await geminiService.generateInitialStory(
        adventure.ageGroup,
        adventure.theme
      );
      const firstNode: StoryNode = {
        id: crypto.randomUUID(),
        parentId: null,
        storyText,
        choices,
        imageBase64,
        isEnding,
        audioBase64,
      };
      setAdventure(prev => ({ ...prev, storyTree: [firstNode], currentNodeId: firstNode.id, storyArc }));
      setGameState(GameState.ADVENTURE);
    } catch (err) {
      console.error(err);
      setError('Oh no! The storyteller got lost. Please try again.');
      setGameState(GameState.ONBOARDING);
    }
  }, [adventure.ageGroup, adventure.theme, setAdventure]);

  const handleMakeChoice = useCallback(async (choice: string, drawingDataUrl: string | null) => {
    if (!adventure.currentNodeId || !adventure.storyArc) return;
    
    setIsLoading(true);
    setError(null);

    const currentNode = adventure.storyTree.find(n => n.id === adventure.currentNodeId);
    if (!currentNode) {
      setError("Couldn't find the current part of the story!");
      setIsLoading(false);
      return;
    }

    // Build a simple text history
    const storyHistory = adventure.storyTree
      .map(node => node.storyText)
      .join('\n\n');
      
    const turnCount = adventure.storyTree.length;

    try {
      const { storyText, choices, imageBase64, isEnding, audioBase64 } = await geminiService.generateNextStoryNode(
        storyHistory,
        currentNode.imageBase64,
        choice,
        drawingDataUrl,
        adventure.storyArc,
        turnCount
      );

      const nextNode: StoryNode = {
        id: crypto.randomUUID(),
        parentId: currentNode.id,
        storyText,
        choices,
        imageBase64,
        isEnding,
        audioBase64,
      };

      setAdventure(prev => {
        const newStoryTree = [...prev.storyTree];

        // Find the index of the node that WAS current.
        const lastNodeIndex = newStoryTree.findIndex(n => n.id === prev.currentNodeId);

        // To save space in localStorage, we remove the image and audio data from the previous node.
        // We only need the assets for the scene we are currently viewing.
        if (lastNodeIndex !== -1) {
          newStoryTree[lastNodeIndex] = { ...newStoryTree[lastNodeIndex], imageBase64: '', audioBase64: null };
        }
        
        // Add the new node with its asset data.
        newStoryTree.push(nextNode);

        return {
          ...prev,
          storyTree: newStoryTree,
          currentNodeId: nextNode.id,
        };
      });


      if (isEnding) {
        setGameState(GameState.ENDING);
      }
    } catch (err) {
      console.error(err);
      setError('The magic ink seems to have run out. Please try making a choice again!');
    } finally {
      setIsLoading(false);
    }
  }, [adventure.currentNodeId, adventure.storyTree, adventure.storyArc, setAdventure]);

  const handleReset = () => {
    setAdventure({ ageGroup: null, theme: null, storyArc: null, storyTree: [], currentNodeId: null });
    setGameState(GameState.ONBOARDING);
    setError(null);
  };

  const setAgeGroup = (age: AgeGroup) => setAdventure(prev => ({ ...prev, ageGroup: age }));
  const setTheme = (theme: Theme) => setAdventure(prev => ({ ...prev, theme: theme }));

  const renderContent = () => {
    switch (gameState) {
      case GameState.ONBOARDING:
        return (
          <OnboardingScreen
            ageGroup={adventure.ageGroup}
            setAgeGroup={setAgeGroup}
            theme={adventure.theme}
            setTheme={setTheme}
            onStart={handleStartAdventure}
          />
        );
      case GameState.LOADING:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <LoadingSpinner message="Brewing up a new adventure..." />
          </div>
        );
      case GameState.ADVENTURE: {
        const currentNode = adventure.storyTree.find(n => n.id === adventure.currentNodeId);
        if (currentNode) {
          return (
            <AdventureScreen 
              node={currentNode} 
              onChoice={handleMakeChoice} 
              onReset={handleReset} 
              isLoading={isLoading} 
            />
          );
        }
        // Fallback if node is not found
        handleReset();
        return null;
      }
      case GameState.ENDING: {
        const currentNode = adventure.storyTree.find(n => n.id === adventure.currentNodeId);
        return (
          <div className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-100 to-yellow-100">
            <Confetti />
            <div className="text-center bg-white/80 backdrop-blur-md rounded-3xl p-12 shadow-2xl z-10">
              <h1 className="text-5xl font-bold text-yellow-500 mb-4">You did it!</h1>
              <p className="text-xl text-gray-700 max-w-lg mb-8">{currentNode?.storyText}</p>
              <button onClick={handleReset} className="px-8 py-3 text-lg font-bold text-white bg-purple-500 rounded-full shadow-lg hover:bg-purple-600 transform hover:scale-105 transition-all">
                Play a New Adventure!
              </button>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <main>
      {error && (
        <div className="bg-red-500 text-white p-4 text-center fixed top-0 w-full z-50">
          {error} <button onClick={() => setError(null)} className="font-bold ml-4">X</button>
        </div>
      )}
      {renderContent()}
    </main>
  );
};

export default App;