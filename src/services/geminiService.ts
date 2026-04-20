import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getSimThoughts(stats: any, currentAction: string | null) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are the inner voice of a "Sim" character in a life simulation game. 
      The character's current needs (0-100) are: 
      Hunger: ${stats.hunger}, Energy: ${stats.energy}, Fun: ${stats.fun}, Social: ${stats.social}.
      Current Action: ${currentAction || 'Doing nothing'}.
      
      Give a short, humorous one-sentence thought or diary entry from the character's perspective. 
      Use Simlish-style jargon if appropriate but translate it or make it understandable.`,
    });
    return response.text || "Sul sul! I'm just hanging out.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I wonder where the plumbob came from...";
  }
}

export async function useAIPoweredTelevision(query: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for this topic and give a "fun fact" for a video game character watching TV: ${query}`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text || "The TV is showing static.";
  } catch (error) {
    console.error("Search Grounding Error:", error);
    return "The channel seems to be down.";
  }
}
