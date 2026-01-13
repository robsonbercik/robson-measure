
export interface Dimension {
  balloonId: string;
  nominal?: string;
  upperTol?: string;
  lowerTol?: string;
  characteristic: string;
  unit?: string;
  isWeld?: boolean;
  isGDT?: boolean;
  results: string[]; // Zmieniono z [string, string, string] na string[] dla elastyczności
}

export interface DrawingData {
  drawingNumber: string;
  partName: string;
  reportDate?: string;
  dimensions: Dimension[];
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  READY = 'READY'
}
