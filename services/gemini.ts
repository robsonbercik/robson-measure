
import { GoogleGenAI, Type } from "@google/genai";
import { DrawingData } from "../types";

export const analyzeDrawing = async (imageBase64: string): Promise<DrawingData> => {
  // Klucz jest wstrzykiwany przez Vite w procesie budowania
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey.length < 5) {
    throw new Error("BRAK_KLUCZA: Klucz API nie został dostarczony do aplikacji podczas budowania (Build Time). Sprawdź zmienne środowiskowe na Vercel.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-pro-preview';

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { text: "Działaj jako ekspert metrologii w firmie CBM Polska. Przeanalizuj rysunek techniczny i wyodrębnij: numer rysunku (drawingNumber), nazwę części (partName). Następnie znajdź wszystkie bąbelki (balloonId), ich opisy (characteristic) oraz zaproponuj 3 przykładowe wyniki (results) mieszczące się w typowych tolerancjach dla tych wymiarów. Zwróć dane wyłącznie w formacie JSON." },
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
    if (!text) throw new Error("AI zwróciło pustą odpowiedź.");
    
    return JSON.parse(text.trim()) as DrawingData;
  } catch (error: any) {
    console.error("Gemini Critical Error:", error);
    
    if (error.status === 403 || error.message?.includes("API_KEY_INVALID")) {
      throw new Error("Klucz API jest nieprawidłowy lub zablokowany. Sprawdź projekt w Google AI Studio.");
    }
    
    throw new Error(`Błąd analizy Gemini: ${error.message || "Nieznany błąd serwera AI"}`);
  }
};
