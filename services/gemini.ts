
import { GoogleGenAI, Type } from "@google/genai";
import { DrawingData } from "../types";

export const analyzeDrawing = async (imageBase64: string): Promise<DrawingData> => {
  // Próbujemy pobrać klucz z wstrzykniętego process.env.API_KEY
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    throw new Error("Brak klucza API. Wpisz go w Vercel i wykonaj ponowne wdrożenie (REDEPLOY) z opcją \"Clear Cache\".");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-pro-preview';

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { text: "Jesteś ekspertem kontroli jakości w CBM Polska. Przeanalizuj rysunek techniczny. Podaj: numer rysunku (drawingNumber), nazwę części (partName). Wyodrębnij wszystkie bąbelki: numer (balloonId), charakterystyka (characteristic) i wygeneruj dla każdego 3 przykładowe wyniki (results). Zwróć JSON." },
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
    if (!text) throw new Error("Odpowiedź AI jest pusta.");
    
    return JSON.parse(text.trim()) as DrawingData;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(`Błąd połączenia z AI: ${error.message || "Błąd modelu"}`);
  }
};
