import { DrawingData } from "../types";

/**
 * Generator został wyłączony na rzecz ręcznego panelu kopiowania w App.tsx.
 * Zapobiega to błędom budowania na serwerze Vercel.
 */
export const generateCBMReports = async (data: DrawingData) => {
  console.log("Generator DOCX wyłączony. Użyj panelu kopiowania w UI.");
  return null;
};
