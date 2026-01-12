export interface Dimension {
  balloonId: string;
  characteristic: string;
  results: [string, string, string];
  isWeld?: boolean;
  isGDT?: boolean;
}

export interface DrawingData {
  drawingNumber: string;
  partName: string;
  reportDate: string;
  dimensions: Dimension[];
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  READY = 'READY'
}
