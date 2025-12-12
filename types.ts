import { Square, PieceSymbol, Color } from 'chess.js';

export enum AppMode {
  HOME = 'HOME',
  RECORDER = 'RECORDER',
  SIMULATOR = 'SIMULATOR',
  HELP = 'HELP',
}

export enum SimulationRule {
  MODE_1 = 1, // Illegal move -> Skip turn
  MODE_2 = 2, // Illegal move -> Find next legal in list
}

export interface SimulationStep {
  fen: string;
  moveSan: string | null;
  description: string;
  whiteScore: number;
  blackScore: number;
  whiteMaterial: number;
  blackMaterial: number;
  capturedWhite: string[]; // Translated names of pieces captured BY white (i.e. black pieces)
  capturedBlack: string[]; // Translated names of pieces captured BY black
  turnColor: Color;
  isCheck: boolean;
  isMate: boolean;
  isIllegalAttempt?: boolean;
}

export interface MoveLogEntry {
  san: string;
  color: Color;
}

export const SCORES = {
  PAWN: 1,
  MINOR: 3,
  ROOK: 5,
  QUEEN: 9,
  CHECK: 10,
  MATE: 500,
};