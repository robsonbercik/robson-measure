
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { DrawingData } from "../types";

export const analyzeDrawing = async (imageBase64: string): Promise<DrawingData> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    throw new Error("Klucz API nie jest skonfigurowany.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-flash-preview';

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { text: "Jesteś ekspertem metrologii Robsonbercik. Przeanalizuj rysunek techniczny. Wyodrębnij: drawingNumber, partName oraz listę bąbelków (balloonId). Dla każdego bąbelka podaj pełną charakterystykę (characteristic) oraz wygeneruj TRZY różne wyniki pomiaru (results) mieszczące się w tolerancji (np. dla wymiaru 10 +/-0.1 wyniki mogą być 10,02, 9,98, 10,05). Zwróć JSON." },
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] || imageBase64 } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            drawingNumber: { type: Type.STRING },
            partName: { type: Type.STRING },
            dimensions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  balloonId: { type: Type.STRING },
                  characteristic: { type: Type.STRING },
                  results: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    minItems: 3,
                    maxItems: 3
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

    const text = response.text;
    if (!text) throw new Error("AI nie zwróciło danych.");
    
    return JSON.parse(text.trim()) as DrawingData;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(`Błąd AI: ${error.message || "Błąd komunikacji"}`);
  }
};
