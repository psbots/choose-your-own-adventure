if (!process.env.ELEVENLABS_API_KEY) {
  console.warn("ELEVENLABS_API_KEY environment variable not set. Audio will be disabled.");
}

// A voice well-suited for storytelling.
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; 
const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

/**
 * Converts a Blob object to a base64 string.
 * @param blob The blob to convert.
 * @returns A promise that resolves with the base64 data URL.
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const elevenLabsService = {
  /**
   * Generates audio from text using the ElevenLabs API.
   * @param text The text to convert to speech.
   * @returns A promise that resolves with the base64-encoded audio data, or null if an error occurs.
   */
  async generateAudio(text: string): Promise<string | null> {
    if (!process.env.ELEVENLABS_API_KEY) return null;
    if (!text || text.trim().length === 0) return null;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API failed with status: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const base64 = await blobToBase64(audioBlob);
      // Remove the data URL prefix (e.g., "data:audio/mpeg;base64,") to store only the raw base64 data.
      return base64.substring(base64.indexOf(',') + 1);
    } catch (error) {
      console.error("Error generating audio from ElevenLabs:", error);
      return null;
    }
  },
};
