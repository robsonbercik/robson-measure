
import { GoogleGenAI, Type } from "@google/genai";
import { DrawingData } from "../types";

export const analyzeDrawing = async (imageBase64: string): Promise<DrawingData> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("KLUCZ_NIEAKTYWNY");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Model Flash-Lite jest idealny do szybkich zadań wizualnych
  const modelName = 'gemini-2.5-flash-lite-latest';

  const systemInstruction = `
    Jesteś ekspertem metrologii w CBM Polska. Twoim zadaniem jest sczytanie bąbelków z rysunku technicznego.
    
    ZADANIA:
    1. Znajdź numer rysunku i nazwę części.
    2. Wypisz każdy bąbelek (balloonId).
    3. Dla każdego wymiaru wygeneruj 3 realistyczne wyniki pomiarowe bliskie nominałowi.
    
    WAŻNE: 
    - Jeśli wymiar to np. 50 +/- 0.1, wyniki powinny być typu: 50.02, 49.98, 50.00.
    - Jeśli widzisz symbol spoiny, zaznacz isWeld: true.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { text: "Przeanalizuj rysunek i zwróć bąbelki w formacie JSON." },
            { inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] || imageBase64 } }
          ]
        }
      ],
      config: {
        systemInstruction: systemInstruction,
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
          required: ["drawingNumber", "dimensions"]
        }
      }
    });

    const result = response.text;
    if (!result) throw new Error("PUSTA_ODPOWIEDZ");
    return JSON.parse(result) as DrawingData;
  } catch (error: any) {
    console.error("Szczegóły błędu AI:", error);
    if (error.message?.includes("429")) throw new Error("LIMIT_PRZEKROCZONY");
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("401")) throw new Error("BŁĘDNY_KLUCZ");
    throw new Error("BŁĄD_ANALIZY");
  }
};
