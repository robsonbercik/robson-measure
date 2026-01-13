
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { DrawingData } from "../types";

export const analyzeDrawing = async (imageBase64: string): Promise<DrawingData> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    throw new Error("Brak klucza API. Wpisz go w Vercel i wykonaj ponowne wdrożenie (REDEPLOY) z opcją \"Clear Cache\".");
  }

  // Zgodnie z wytycznymi inicjalizujemy klienta przekazując obiekt z apiKey
  const ai = new GoogleGenAI({ apiKey });
  // Model gemini-3-flash-preview jest optymalny dla zadań analizy obrazów przy zachowaniu limitów darmowych
  const modelName = 'gemini-3-flash-preview';

  try {
    // Zastosowano zalecaną strukturę contents: { parts: [...] } dla zapytań multimodalnych (tekst + obraz)
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { text: "Jesteś ekspertem kontroli jakości w CBM Polska. Przeanalizuj rysunek techniczny. Podaj: numer rysunku (drawingNumber), nazwę części (partName). Wyodrębnij wszystkie bąbelki: numer (balloonId), charakterystyka (characteristic) i wygeneruj dla każdego 3 przykładowe wyniki (results). Zwróć JSON." },
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

    // Korzystamy z właściwości .text (nie metody .text()) obiektu GenerateContentResponse
    const text = response.text;
    if (!text) throw new Error("Odpowiedź AI jest pusta.");
    
    return JSON.parse(text.trim()) as DrawingData;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    // Obsługa limitów i błędów sieciowych API
    if (error.message?.includes("429") || error.message?.toLowerCase().includes("quota")) {
      throw new Error("PRZEKROCZONO LIMIT: Skorzystaj z modelu Flash lub podepnij kartę w Google AI Studio, aby zwiększyć limit zapytania.");
    }
    throw new Error(`Błąd połączenia z AI: ${error.message || "Błąd modelu"}`);
  }
};
