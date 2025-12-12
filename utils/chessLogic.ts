import { Chess, PieceSymbol, Color, Move } from 'chess.js';
import { SimulationRule, SimulationStep, SCORES } from '../types';
import { T, PIECE_NAMES, Language } from './translations';

export const calculateMaterial = (game: Chess) => {
  const board = game.board();
  let w = 0;
  let b = 0;

  const values: Record<string, number> = {
    p: SCORES.PAWN,
    n: SCORES.MINOR,
    b: SCORES.MINOR,
    r: SCORES.ROOK,
    q: SCORES.QUEEN,
    k: 0,
  };

  board.forEach(row => {
    row.forEach(piece => {
      if (piece) {
        if (piece.color === 'w') w += values[piece.type];
        else b += values[piece.type];
      }
    });
  });

  return { w, b };
};

export const getCapturedPieces = (game: Chess, lang: Language) => {
  const board = game.board();
  const currentCounts = { w: { p:0,n:0,b:0,r:0,q:0,k:0 }, b: { p:0,n:0,b:0,r:0,q:0,k:0 } };

  board.forEach(row => {
    row.forEach(piece => {
      if (piece) {
        // @ts-ignore
        currentCounts[piece.color][piece.type]++;
      }
    });
  });

  const initial = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
  
  const capturedByWhite: string[] = []; // Black pieces missing
  const capturedByBlack: string[] = []; // White pieces missing
  
  const names = PIECE_NAMES[lang];

  (['p', 'n', 'b', 'r', 'q'] as const).forEach(type => {
    const missingWhite = initial[type] - currentCounts.w[type];
    const missingBlack = initial[type] - currentCounts.b[type];

    for (let i = 0; i < missingBlack; i++) capturedByWhite.push(names[type]);
    for (let i = 0; i < missingWhite; i++) capturedByBlack.push(names[type]);
  });

  return { capturedByWhite, capturedByBlack };
};

export const simulateGame = (
  whiteMoves: string[],
  blackMoves: string[],
  mode: SimulationRule,
  lang: Language
): SimulationStep[] => {
  const game = new Chess();
  const steps: SimulationStep[] = [];
  const t = T[lang];
  
  // Initial state
  steps.push({
    fen: game.fen(),
    moveSan: null,
    description: t.gameStart,
    whiteScore: 0,
    blackScore: 0,
    whiteMaterial: 39,
    blackMaterial: 39,
    capturedWhite: [],
    capturedBlack: [],
    turnColor: 'w',
    isCheck: false,
    isMate: false,
  });

  let wIdx = 0;
  let bIdx = 0;
  let moveCounter = 1;
  let whiteScore = 0;
  let blackScore = 0;
  let whiteCheckCount = 0;
  let blackCheckCount = 0;

  while (!game.isGameOver() && (wIdx < whiteMoves.length || bIdx < blackMoves.length)) {
    const turn = game.turn();
    const isWhite = turn === 'w';
    const playerText = isWhite ? t.white : t.black;
    
    // Check if moves available
    if (isWhite && wIdx >= whiteMoves.length) break;
    if (!isWhite && bIdx >= blackMoves.length) break;

    let moveStr = isWhite ? whiteMoves[wIdx] : blackMoves[bIdx];
    // Increment index immediately as we attempt to use this move slot
    if (isWhite) wIdx++; else bIdx++;

    let move: Move | null = null;
    let description = "";
    let isIllegal = false;

    // Parse move
    try {
      move = game.move(moveStr); // This modifies game state if successful
      if (move) game.undo(); // Undo to keep state clean for custom logic handling
    } catch (e) {
      move = null;
    }

    // MODE LOGIC
    if (mode === SimulationRule.MODE_1) {
      if (move) {
        game.move(moveStr);
        description = `${playerText} ${t.madeMove} ${moveStr}`;
      } else {
        isIllegal = true;
        description = `${playerText}: ${moveStr} (${t.illegal})`;
        // Force turn switch by manipulating FEN
        const fenParts = game.fen().split(' ');
        fenParts[1] = isWhite ? 'b' : 'w';
        fenParts[3] = '-'; // Clear en passant
        game.load(fenParts.join(' '));
      }
    } else {
      // MODE 2
      if (move) {
        game.move(moveStr);
        description = `${playerText} ${t.madeMove} ${moveStr}`;
      } else {
        // Search next valid
        let found = false;
        let attemptStr = moveStr;
        
        while (!found) {
           // We already incremented index, so check if we can continue
           if (isWhite) {
             if (wIdx >= whiteMoves.length) break;
             attemptStr = whiteMoves[wIdx];
             wIdx++;
           } else {
             if (bIdx >= blackMoves.length) break;
             attemptStr = blackMoves[bIdx];
             bIdx++;
           }

           try {
             const m = game.move(attemptStr);
             if (m) {
               found = true;
               move = m;
               moveStr = attemptStr; // Update actual move string
             }
           } catch (e) {}
        }

        if (found) {
           description = `${playerText}: ${t.foundLegal} ${moveStr}`;
        } else {
           description = `${playerText}: ${t.noLegal}`;
           break; // Stop simulation
        }
      }
    }

    // Scoring updates (Only if move successful or game state advanced)
    if (!isIllegal || mode === SimulationRule.MODE_2) {
      if (game.isCheckmate()) {
        if (isWhite) whiteScore += SCORES.MATE;
        else blackScore += SCORES.MATE;
      } else if (game.inCheck()) {
        if (isWhite) { whiteScore += SCORES.CHECK; whiteCheckCount++; }
        else { blackScore += SCORES.CHECK; blackCheckCount++; }
      }
    }

    const { w: wMat, b: bMat } = calculateMaterial(game);
    const captured = getCapturedPieces(game, lang);

    steps.push({
      fen: game.fen(),
      moveSan: isIllegal && mode === SimulationRule.MODE_1 ? null : moveStr,
      description,
      whiteScore: whiteScore + wMat,
      blackScore: blackScore + bMat,
      whiteMaterial: wMat,
      blackMaterial: bMat,
      capturedWhite: captured.capturedByWhite,
      capturedBlack: captured.capturedByBlack,
      turnColor: turn,
      isCheck: game.inCheck(),
      isMate: game.isCheckmate(),
      isIllegalAttempt: isIllegal
    });

    if (isWhite) moveCounter++;
  }

  return steps;
};