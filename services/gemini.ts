
import { GoogleGenAI, Type } from "@google/genai";
import { DrawingData } from "../types";

export const analyzeDrawing = async (imageBase64: string): Promise<DrawingData> => {
  // Tworzymy nową instancję za każdym razem, aby pobrać najświeższy klucz z process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Jesteś ekspertem metrologii w CBM Polska. Twoim zadaniem jest sczytanie bąbelków z rysunku i odwzorowanie charakterystyk 1:1 w formacie tekstowym/graficznym do raportu F-NP 016.
    
    ZASADY REKONSTRUKCJI SYMBOLI (1:1):
    1. ZŁOŻONE SYMBOLE SPOIN (RYGORYSTYCZNIE):
       - Buduj symbole spoin wieloliniowo, aby oddać ich układ z rysunku.
       - Przykład spoiny z wymiarem 4 i 45 oraz ogonem 28:
         "  4 △ 45"
         "---------- < 28"
         "  4 △ 45"
       - Używaj znaków Unicode: △ (pachwinowa), ▽ (czołowa), ⎾ (brzegowa).
       - Ogon: " < [tekst]". Linia: "----------".
       - USUŃ JEDNOSTKI "mm" (np. "a3 △" zamiast "a3 mm △").
    
    2. RAMKI GDT (POZYCJA, BICIE ITP.):
       - Odwzoruj ramkę tekstowo: "| ⌖ | Ø 0.2 Ⓜ | A | B |"
       - Symbole: ⌖ (pozycja), ↗ (bicie), ⊥ (prostopadłość), ∥ (równoległość), ⏥ (płaskość), Ⓜ (MMC).
       - Nigdy nie dodawaj "mm" wewnątrz ramek.
    
    3. WYMIARY I TOLERANCJE:
       - Zapisuj dokładnie jak na rysunku: np. "Ø 10.5 ±0.1" lub "20 +0.2/-0.1".
       - Jeśli wymiar na rysunku ma "mm", USUŃ GO. Pracujemy tylko w mm, więc zapis jest zbędny.
    
    4. KOLUMNA WYNIK:
       - Wygeneruj 3 realistyczne wyniki (Próbka 1, 2, 3) bliskie nominałowi.
       - Dla spoin i symboli GDT wynik to zawsze "OK" lub "ACCEPTED".
    
    WYMAGANIA TECHNICZNE:
    - Zidentyfikuj numer rysunku (zazwyczaj prawy dolny róg, format KKXXXXXX lub AKKXXXXXX).
    - Zwróć dane dla maksymalnie 23 bąbelków na stronę.
    
    Zwróć czysty JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      {
        parts: [
          { text: prompt },
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
                isGDT: { type: Type.BOOLEAN },
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
        required: ["drawingNumber", "dimensions"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Brak odpowiedzi z serwera.");
  return JSON.parse(text) as DrawingData;
};
