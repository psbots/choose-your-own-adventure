export enum GameState {
  ONBOARDING,
  LOADING,
  ADVENTURE,
  ENDING,
}

export type AgeGroup = '3-5' | '6-8' | '9-12';

export type Theme = 'Fantasy' | 'Space' | 'Mystery' | 'Animals' | 'Superheroes' | 'Pirates' | 'Dinosaurs' | 'Magic School';

export interface Choice {
  text: string;
  drawingPrompt: string | null;
}

export interface StoryNode {
  id: string;
  parentId: string | null;
  storyText: string;
  imageBase64: string;
  choices: Choice[];
  isEnding: boolean;
  audioBase64: string | null;
}

export interface StoryArc {
  scene: string;
  ruin: string;
  breakingPoint: string;
  cleanup: string;
  wrapUp: string;
}

export interface Adventure {
  ageGroup: AgeGroup | null;
  theme: Theme | null;
  storyArc: StoryArc | null;
  storyTree: StoryNode[];
  currentNodeId: string | null;
}