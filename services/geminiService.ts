import { GoogleGenAI, Modality } from "@google/genai";
import type { GenerateContentResponse, Part } from "@google/genai";
import type { AgeGroup, Theme, StoryArc, Choice } from '../types';
import { elevenLabsService } from './elevenLabsService';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const parseResponseText = (text: string): { storyText: string; choices: Choice[]; isEnding: boolean; } => {
  const storyMatch = text.match(/<STORY>(.*?)<\/STORY>/s);
  const choicesMatch = text.match(/<CHOICES>(.*?)<\/CHOICES>/s);
  
  const storyText = storyMatch ? storyMatch[1].trim() : "The storyteller seems to be quiet... maybe try again?";
  const choicesText = choicesMatch ? choicesMatch[1].trim() : "";
  
  const choiceStrings = choicesText.split('||').map(choice => choice.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);

  const choices: Choice[] = choiceStrings.map(choiceStr => {
    const drawingMatch = choiceStr.match(/<DRAWING>(.*?)<\/DRAWING>/s);
    if (drawingMatch && drawingMatch[1]) {
        return {
            text: choiceStr.replace(/<DRAWING>(.*?)<\/DRAWING>/s, '').trim(),
            drawingPrompt: drawingMatch[1].trim()
        };
    }
    return {
        text: choiceStr.trim(),
        drawingPrompt: null
    };
  });

  const isEnding = /<ENDING>/.test(text) || choices.length === 0;

  return { storyText, choices, isEnding };
};

const parseStoryArc = (text: string): StoryArc => {
    const sceneMatch = text.match(/<ARC_SCENE>(.*?)<\/ARC_SCENE>/s);
    const ruinMatch = text.match(/<ARC_RUIN>(.*?)<\/ARC_RUIN>/s);
    const breakingPointMatch = text.match(/<ARC_BREAKING_POINT>(.*?)<\/ARC_BREAKING_POINT>/s);
    const cleanupMatch = text.match(/<ARC_CLEANUP>(.*?)<\/ARC_CLEANUP>/s);
    const wrapUpMatch = text.match(/<ARC_WRAPUP>(.*?)<\/ARC_WRAPUP>/s);

    if (!sceneMatch || !ruinMatch || !breakingPointMatch || !cleanupMatch || !wrapUpMatch) {
      console.warn("Failed to parse full story arc, using fallback values.");
    }

    return {
        scene: sceneMatch ? sceneMatch[1].trim() : "Once upon a time...",
        ruin: ruinMatch ? ruinMatch[1].trim() : "But then, something went wrong.",
        breakingPoint: breakingPointMatch ? breakingPointMatch[1].trim() : "Everything seemed lost.",
        cleanup: cleanupMatch ? cleanupMatch[1].trim() : "But our hero had a plan.",
        wrapUp: wrapUpMatch ? wrapUpMatch[1].trim() : "And they all lived happily ever after."
    };
};

export const geminiService = {
  async generateInitialStory(ageGroup: AgeGroup, theme: Theme): Promise<{ storyText: string; choices: Choice[]; imageBase64: string, isEnding: boolean, storyArc: StoryArc, audioBase64: string | null }> {
    const textPrompt = `You are an AI storyteller for a child aged ${ageGroup}. The theme is ${theme}.
First, create a 5-part story arc. Each part should be 50-70 words.
1. SET THE SCENE: Introduce the world and character.
2. RUIN THINGS: Introduce a problem or conflict.
3. THE BREAKING POINT: The problem gets worse, a moment of crisis.
4. CLEAN UP THE MESS: The hero starts to solve the problem.
5. WRAP IT UP: The resolution and happy ending.

Then, based on the "SET THE SCENE" part of the arc, write an exciting first paragraph for the story.
Finally, create three equally tempting and creative choices for the player. Make the choices sound really fun. Optionally, for ONE of the choices, ask the player to draw something relevant to that choice by adding "<DRAWING>Your drawing prompt here.</DRAWING>" right after the choice text.

Format your response EXACTLY like this:
<ARC_SCENE>Scene text here.</ARC_SCENE>
<ARC_RUIN>Ruin text here.</ARC_RUIN>
<ARC_BREAKING_POINT>Breaking point text here.</ARC_BREAKING_POINT>
<ARC_CLEANUP>Cleanup text here.</ARC_CLEANUP>
<ARC_WRAPUP>Wrap up text here.</ARC_WRAPUP>
<STORY>Your story text for the first scene here.</STORY>
<CHOICES>1. First choice.||2. Second choice. <DRAWING>Draw the magic key!</DRAWING>||3. Third choice.</CHOICES>`;

    // 1. Generate story text, choices, and story arc
    const textResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: textPrompt
    });
    
    const textResult = textResponse.text;
    if (!textResult) {
      throw new Error("Failed to generate story text from API.");
    }
    
    const storyArc = parseStoryArc(textResult);
    const { storyText, choices, isEnding } = parseResponseText(textResult);

    if (!storyText || choices.length === 0) {
        throw new Error("Parsed story text or choices are empty.");
    }
    
    // 2. Generate an image based on the story text
    const imagePrompt = `A vibrant, colorful, and friendly cartoon scene for a ${theme} story for a child aged ${ageGroup}. The scene should illustrate: ${storyText}`;
    
    const imageResponse = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: imagePrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });
    
    const imageBase64 = imageResponse.generatedImages?.[0]?.image?.imageBytes;

    if (!imageBase64) {
      throw new Error("Failed to generate initial image from API.");
    }

    // 3. Generate audio for the story text
    const audioBase64 = await elevenLabsService.generateAudio(storyText);
    
    return { storyText, choices, imageBase64, isEnding, storyArc, audioBase64 };
  },

  async generateNextStoryNode(
    storyHistory: string,
    currentImageBase64: string,
    userChoice: string,
    drawingBase64: string | null,
    storyArc: StoryArc,
    turnCount: number
  ): Promise<{ storyText: string; choices: Choice[]; imageBase64: string, isEnding: boolean, audioBase64: string | null }> {

    // Step 1: Generate the next part of the story text.
    let textGenPrompt = `You are an AI storyteller continuing a story for a child. Maintain a consistent, positive, and safe tone.
    
Here is the overall story plan we are following:
- Scene: ${storyArc.scene}
- Conflict: ${storyArc.ruin}
- Crisis: ${storyArc.breakingPoint}
- Solution: ${storyArc.cleanup}
- Ending: ${storyArc.wrapUp}

The story so far: "${storyHistory}"
The user chose: "${userChoice}".
This is turn number ${turnCount} out of a maximum of 10.`;

    if (drawingBase64) {
      textGenPrompt += "\nThe user has provided a drawing. Please incorporate the subject of their drawing into the next part of the story in a creative and fun way.";
    }

    textGenPrompt += `
Continue the story based on their choice, keeping our story plan in mind and moving the plot forward.
Provide the next story paragraph and three new, equally exciting and adventurous choices. The choices should be distinct paths that sound really fun.
Optionally, for ONE of the choices, ask the player to draw something relevant to that choice by adding "<DRAWING>Your drawing prompt here.</DRAWING>" right after the choice text.
If this is a natural ending to the story (based on the "WRAP IT UP" part of the arc), add "<ENDING>" to your response and provide no choices.

Format your response EXACTLY like this:
<STORY>Your continuing story text here.</STORY>
<CHOICES>1. First choice.||2. Second choice. <DRAWING>Draw what you see through the periscope!</DRAWING>||3. Third choice.</CHOICES>`;

    const textResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: textGenPrompt,
    });
    
    const textResult = textResponse.text;
    if (!textResult) {
      throw new Error("Failed to generate next story text from API.");
    }
    
    const { storyText, choices, isEnding } = parseResponseText(textResult);
    if (!storyText) {
        throw new Error("Parsed next story text is empty.");
    }

    // Step 2: Generate/edit the image based on the new story text.
    let newImageBase64: string;

    if (drawingBase64) {
      // Edit the existing image with the user's drawing
      const parts: Part[] = [
        { inlineData: { data: currentImageBase64, mimeType: 'image/jpeg' } },
      ];
      // remove 'data:image/png;base64,'
      const cleanDrawingBase64 = drawingBase64.substring(drawingBase64.indexOf(',') + 1);
      parts.push({ inlineData: { data: cleanDrawingBase64, mimeType: 'image/png' } });
      
      const imageEditPrompt = `Incorporate the user's drawing (on the transparent layer) into a new scene that illustrates the following story: "${storyText}". Keep the art style consistent.`;
      parts.push({ text: imageEditPrompt });

      const imageEditResponse: GenerateContentResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image-preview',
          contents: { parts },
          config: {
              responseModalities: [Modality.IMAGE, Modality.TEXT],
          },
      });
      
      const imagePart = imageEditResponse.candidates?.[0]?.content?.parts.find(part => part.inlineData);
      if (!imagePart?.inlineData?.data) {
        throw new Error("Failed to edit image with drawing from API.");
      }
      newImageBase64 = imagePart.inlineData.data;

    } else {
      // Generate a new image from scratch
      const imageGenPrompt = `A vibrant, colorful, and friendly cartoon scene illustrating: ${storyText}`;
    
      const imageGenResponse = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: imageGenPrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
          },
      });
      
      const generatedImage = imageGenResponse.generatedImages?.[0]?.image?.imageBytes;
      if (!generatedImage) {
        throw new Error("Failed to generate new image from API.");
      }
      newImageBase64 = generatedImage;
    }

    if (!newImageBase64) {
        throw new Error("Failed to generate next story node from API."); // Fallback error
    }

    // Step 3. Generate audio for the new story text
    const audioBase64 = await elevenLabsService.generateAudio(storyText);

    return { storyText, choices, imageBase64: newImageBase64, isEnding, audioBase64 };
  },
};