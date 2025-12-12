import React, { useState, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import ChessBoard from './ChessBoard';
import PieceIcon from './PieceIcon';
import { T, Language } from '../utils/translations';

interface RecorderProps {
  lang: Language;
  onBack: () => void;
}

const Recorder: React.FC<RecorderProps> = ({ lang, onBack }) => {
  const [game, setGame] = useState(new Chess());
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [moves, setMoves] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  
  const t = T[lang];

  // Init custom FEN based on color
  useEffect(() => {
    initGame(playerColor);
  }, [playerColor]);

  const initGame = (color: 'w' | 'b') => {
    const newGame = new Chess();
    // Custom FEN: Hide opponent pieces (except King for engine validity), maintain castling rights
    if (color === 'w') {
      newGame.load("7k/8/8/8/8/8/PPPPPPPP/RNBQKBNR w KQ - 0 1");
    } else {
      newGame.load("rnbqkbnr/pppppppp/8/8/8/8/8/K7 b kq - 0 1");
    }
    setGame(newGame);
    setMoves([]);
    setSelectedSquare(null);
    setValidMoves([]);
  };

  const getBlindPawnMoves = (currentFen: string, square: Square, color: 'w' | 'b'): Square[] => {
    const tempGame = new Chess(currentFen);
    const piece = tempGame.get(square);
    if (!piece || piece.type !== 'p') return [];

    const file = square.charCodeAt(0);
    const rank = parseInt(square[1]);
    const moves: Square[] = [];
    
    const direction = color === 'w' ? 1 : -1;
    const targetRank = rank + direction;

    if (targetRank < 1 || targetRank > 8) return [];

    // Left diagonal (file - 1)
    if (file > 'a'.charCodeAt(0)) {
        const targetSquare = (String.fromCharCode(file - 1) + targetRank) as Square;
        // Only if empty (validMoves handles standard captures, this handles blind empty captures)
        if (!tempGame.get(targetSquare)) {
            moves.push(targetSquare);
        }
    }
    // Right diagonal (file + 1)
    if (file < 'h'.charCodeAt(0)) {
        const targetSquare = (String.fromCharCode(file + 1) + targetRank) as Square;
         if (!tempGame.get(targetSquare)) {
            moves.push(targetSquare);
        }
    }
    return moves;
  };

  const handleSquareClick = (square: Square) => {
    // If selecting own piece
    const piece = game.get(square);
    
    if (piece && piece.color === playerColor) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setValidMoves([]);
      } else {
        setSelectedSquare(square);
        
        // Standard moves (includes Castling if legal)
        const standardMoves = game.moves({ square, verbose: true }).map(m => m.to);
        
        // Blind Pawn moves
        const blindMoves = getBlindPawnMoves(game.fen(), square, playerColor);
        
        // Combine unique
        setValidMoves([...new Set([...standardMoves, ...blindMoves])]);
      }
      return;
    }

    // 2. Move to Target
    if (selectedSquare) {
      const source = selectedSquare;
      const target = square;
      
      // Attempt move if it is in validMoves
      if (validMoves.includes(target)) {
        tryMakeMove(source, target);
      }
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const tryMakeMove = (from: Square, to: Square) => {
    const gameCopy = new Chess(game.fen());
    let phantomAdded = false;

    // Check for Pawn attacking empty square (Phantom Capture)
    const piece = gameCopy.get(from);
    if (piece && piece.type === 'p' && !gameCopy.get(to) && from[0] !== to[0]) {
       // It's a diagonal move to an empty square.
       // Add an enemy piece there to make chess.js happy
       gameCopy.put({ type: 'p', color: playerColor === 'w' ? 'b' : 'w' }, to);
       phantomAdded = true;
    }

    try {
      const move = gameCopy.move({ from, to, promotion: 'q' });
      if (!move) throw new Error("Invalid");
      
      setMoves(prev => [...prev, move.san]);
      
      // Force turn back to player
      const fenParts = gameCopy.fen().split(' ');
      fenParts[1] = playerColor; 
      fenParts[3] = '-'; // Clear en passant
      gameCopy.load(fenParts.join(' '));
      
      setGame(gameCopy);
    } catch (e) {
      // If failed, and we added phantom, it was just invalid.
      // Do nothing.
    }
  };

  const undo = () => {
    if (moves.length === 0) return;
    const newMoves = moves.slice(0, -1);
    setMoves(newMoves);
    // Replay from start is safest due to FEN manipulation
    const replayGame = new Chess();
    if (playerColor === 'w') {
      replayGame.load("7k/8/8/8/8/8/PPPPPPPP/RNBQKBNR w KQ - 0 1");
    } else {
      replayGame.load("rnbqkbnr/pppppppp/8/8/8/8/8/K7 b kq - 0 1");
    }
    
    newMoves.forEach(san => {
       try {
         replayGame.move(san);
       } catch (e) {
         // Try phantom fix
         if (san.includes('x')) {
            // Find target square from SAN (e.g. exd5 -> d5)
            const target = san.match(/[a-h][1-8]/);
            if (target) {
               replayGame.put({ type: 'p', color: playerColor === 'w' ? 'b' : 'w'}, target[0] as Square);
               replayGame.move(san);
            }
         }
       }
       
       const fenParts = replayGame.fen().split(' ');
       fenParts[1] = playerColor; 
       fenParts[3] = '-';
       replayGame.load(fenParts.join(' '));
    });
    setGame(replayGame);
  };

  const downloadMoves = () => {
    const blob = new Blob([moves.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = playerColor === 'w' ? 'white.txt' : 'black.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-4">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700">
         <div className="flex items-center gap-4 mb-4 md:mb-0">
            <button onClick={onBack} className="text-slate-400 hover:text-white transition">← {t.menu}</button>
            <h2 className="text-xl font-bold text-white">{t.recMode}</h2>
         </div>
         
         <div className="flex bg-slate-900 rounded-lg p-1">
            <button 
              onClick={() => setPlayerColor('w')}
              className={`px-4 py-2 rounded-md font-semibold transition flex items-center gap-2 ${playerColor === 'w' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              <PieceIcon type="k" color="w" size="text-lg" /> {t.white}
            </button>
            <button 
              onClick={() => setPlayerColor('b')}
              className={`px-4 py-2 rounded-md font-semibold transition flex items-center gap-2 ${playerColor === 'b' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              <PieceIcon type="k" color="b" size="text-lg" /> {t.black}
            </button>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Board Area */}
        <div className="flex-1 flex justify-center bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
           <ChessBoard 
              fen={game.fen()} 
              orientation={playerColor} 
              onSquareClick={handleSquareClick}
              validMoves={validMoves}
              selectedSquare={selectedSquare}
              lastMove={null}
              hideOpponentPieces={true} 
           />
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-[600px] shadow-xl">
           <div className="p-4 border-b border-slate-700 bg-slate-900/50 rounded-t-xl">
              <h3 className="text-indigo-400 font-bold uppercase text-sm tracking-wider">{t.history}</h3>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
              {moves.length === 0 ? (
                <div className="text-center text-slate-500 mt-10 italic">{t.firstMove}</div>
              ) : (
                <ol className="list-decimal pl-5 text-slate-300 font-mono space-y-1">
                  {moves.map((m, i) => <li key={i}><span className="text-white font-bold">{m}</span></li>)}
                </ol>
              )}
           </div>

           <div className="p-4 bg-slate-900/50 border-t border-slate-700 rounded-b-xl grid grid-cols-2 gap-3">
              <button 
                onClick={undo}
                disabled={moves.length === 0}
                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white py-2 rounded font-medium transition"
              >
                {t.undo}
              </button>
              <button 
                onClick={() => initGame(playerColor)}
                className="bg-red-900/50 hover:bg-red-900/80 text-red-200 py-2 rounded font-medium transition border border-red-900"
              >
                {t.reset}
              </button>
              <button 
                onClick={downloadMoves}
                disabled={moves.length === 0}
                className="col-span-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-3 rounded-lg font-bold shadow-lg transition flex justify-center items-center gap-2"
              >
                 {t.download}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Recorder;