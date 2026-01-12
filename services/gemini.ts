
import { GoogleGenAI, Type } from "@google/genai";
import { DrawingData } from "../types";

export const analyzeDrawing = async (imageBase64: string): Promise<DrawingData> => {
  // Pobieranie klucza z bezpiecznego środowiska Vercel
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("KRYTYCZNY_BRAK_KLUCZA: Vercel nie przekazał klucza API do aplikacji.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Najnowszy model Gemini 3 Flash
  const modelName = 'gemini-3-flash-preview';

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { text: "Działaj jako ekspert metrologii CBM Polska. Wyodrębnij numery bąbelków, wymiary nominalne i tolerancje. Wygeneruj 3 przykładowe wyniki pomiarów mieszczące się w tolerancji. Zwróć dane w formacie JSON." },
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
                  isWeld: { type: Type.BOOLEAN },
                  results: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["balloonId", "characteristic", "results"]
              }
            }
          },
          required: ["drawingNumber", "dimensions"]
        }
      }
    });

    if (!response.text) throw new Error("AI_EMPTY_RESPONSE: Model nie zwrócił danych.");
    return JSON.parse(response.text) as DrawingData;
  } catch (error: any) {
    console.error("Szczegóły błędu AI:", error);
    if (error.message?.includes("403")) throw new Error("BŁĄD_UPRAWNIEŃ: Twój klucz API nie ma dostępu do modelu Gemini 3.");
    if (error.message?.includes("401")) throw new Error("BŁĄD_AUTORYZACJI: Klucz API jest nieprawidłowy.");
    throw new Error(`BŁĄD_SYSTEMU: ${error.message || "Nieznany błąd komunikacji"}`);
  }
};
