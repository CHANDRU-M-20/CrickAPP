
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMatchSummary = async (matchData: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a short, exciting cricket commentary style summary for this match situation: ${JSON.stringify(matchData)}. Include a prediction if live.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI insights currently unavailable.";
  }
};

export const getPlayerPerformanceAnalysis = async (playerStats: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these cricket player statistics and provide a brief professional scout report: ${JSON.stringify(playerStats)}`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Player analysis unavailable.";
  }
};
