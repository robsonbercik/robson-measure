
import { GoogleGenAI, Type } from "@google/genai";
import { DrawingData } from "../types";

export const analyzeDrawing = async (imageBase64: string): Promise<DrawingData> => {
  // Direct use of process.env.API_KEY as per guidelines.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("KRYTYCZNY_BLAD: Brak klucza API_KEY w srodowisku Vercel.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-flash-preview';

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { text: "Wyodrebnij dane metrologiczne: numer rysunku (drawingNumber), nazwa czesci (partName). Wyodrebnij wszystkie bablelki (balloonId), ich opis (characteristic) i wygeneruj 3 wyniki mieszczace sie w normie. Zwroc JSON." },
            { inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] || imageBase64 } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            drawingNumber: { type: Type.STRING },
            partName: { type: Type.STRING },
            reportDate: { type: Type.STRING },
            dimensions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  balloonId: { type: Type.STRING },
                  characteristic: { type: Type.STRING },
                  nominal: { type: Type.STRING },
                  upperTol: { type: Type.STRING },
                  lowerTol: { type: Type.STRING },
                  unit: { type: Type.STRING },
                  isWeld: { type: Type.BOOLEAN },
                  isGDT: { type: Type.BOOLEAN },
                  results: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["balloonId", "characteristic", "results"]
              }
            }
          },
          required: ["drawingNumber", "partName", "dimensions"]
        }
      }
    });

    if (!response.text) throw new Error("AI_NO_DATA");
    return JSON.parse(response.text.trim()) as DrawingData;
  } catch (error: any) {
    console.error("AI Error:", error);
    throw new Error(`KOMUNIKACJA_AI_BLAD: ${error.message}`);
  }
};
