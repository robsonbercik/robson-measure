
import { GoogleGenAI, Type } from "@google/genai";
import { DrawingData } from "../types";

export const analyzeDrawing = async (imageBase64: string): Promise<DrawingData> => {
  const apiKey = process.env.API_KEY;

  // Diagnostyka na start
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("KLUCZ_API_NIE_ZOSTAŁ_WYKRYTY_W_SYSTEMIE_VERCEL");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash-lite-latest'; // Najszybszy model dostępny

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          parts: [
            { text: "Przeanalizuj rysunek techniczny. Znajdź bąbelki i wymiary. Wygeneruj 3 wyniki pomiarowe dla każdego. Zwróć JSON." },
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

    const text = response.text;
    if (!text) throw new Error("MODEL_ZWRÓCIŁ_PUSTĄ_ODPOWIEDŹ");
    return JSON.parse(text) as DrawingData;
  } catch (error: any) {
    console.error("Błąd krytyczny AI:", error);
    if (error.message?.includes("API_KEY_INVALID")) throw new Error("TWÓJ_KLUCZ_API_JEST_NIEPRAWIDŁOWY_LUB_WYGASŁ");
    throw new Error(error.message || "NIEZNANY_BŁĄD_SERWERA_AI");
  }
};
