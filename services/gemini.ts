
import { GoogleGenAI, Type } from "@google/genai";
import { DrawingData } from "../types";

export const analyzeDrawing = async (imageBase64: string): Promise<DrawingData> => {
  // SDK automatycznie użyje process.env.API_KEY zdefiniowanego w vite.config.ts
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  // Do rysunków technicznych używamy modelu PRO dla najwyższej dokładności
  const modelName = 'gemini-3-pro-preview';

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { text: "Jesteś ekspertem metrologii w CBM Polska. Twoim zadaniem jest precyzyjne wyodrębnienie wszystkich wymiarów zaznaczonych bąbelkami z rysunku technicznego. Dla każdego bąbelka (balloonId) podaj opis wymiaru (characteristic) oraz wygeneruj 3 przykładowe wyniki pomiarowe (results) mieszczące się w standardowej tolerancji. Wyodrębnij też numer rysunku i nazwę części. Zwróć dane w formacie JSON." },
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
            dimensions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  balloonId: { type: Type.STRING },
                  characteristic: { type: Type.STRING },
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

    const text = response.text;
    if (!text) throw new Error("Brak odpowiedzi od AI.");
    
    return JSON.parse(text.trim()) as DrawingData;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    // Jeśli błąd to 403/401, oznacza to problem z samym kluczem w Google Cloud
    if (error.message?.includes("API_KEY_INVALID")) {
      throw new Error("Nieprawidłowy klucz API. Sprawdź czy projekt w Google AI Studio jest aktywny.");
    }
    throw new Error(`Błąd analizy obrazu: ${error.message}`);
  }
};
