import React from 'react';
import { Chess, Square, PieceSymbol, Color } from 'chess.js';

interface ChessBoardProps {
  fen: string;
  orientation: 'w' | 'b';
  onSquareClick?: (square: Square) => void;
  lastMove?: { from: string; to: string } | null;
  validMoves?: string[]; // Squares
  selectedSquare?: Square | null;
  checkSquare?: string | null;
  hideOpponentPieces?: boolean;
  className?: string; // Allow overriding size
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

const PIECE_UNICODE: Record<string, string> = {
  p: '♟',
  n: '♞',
  b: '♝',
  r: '♜',
  q: '♛',
  k: '♚',
};

const ChessBoard: React.FC<ChessBoardProps> = ({ 
  fen, 
  orientation, 
  onSquareClick, 
  lastMove,
  validMoves = [],
  selectedSquare,
  checkSquare,
  hideOpponentPieces = false,
  className = "w-full max-w-[480px]"
}) => {
  const game = new Chess(fen);
  const board = game.board();

  const renderSquare = (rankIndex: number, fileIndex: number) => {
    // Adjust logic based on orientation
    const r = orientation === 'w' ? 7 - rankIndex : rankIndex;
    const f = orientation === 'w' ? fileIndex : 7 - fileIndex;
    
    const rank = RANKS[r];
    const file = FILES[f];
    const square = `${file}${rank}` as Square;
    const piece = board[7 - r][f]; // board array is always rank 8 to 1
    
    const isLight = (r + f) % 2 !== 0;
    const isLastMoveSource = lastMove?.from === square;
    const isLastMoveDest = lastMove?.to === square;
    const isValidDest = validMoves.includes(square);
    const isCheck = checkSquare === square;
    const isSelected = selectedSquare === square;

    let bgClass = isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]';
    
    // Highlight logic
    if (isLastMoveSource || isLastMoveDest) {
       bgClass = isLight ? 'bg-[#F6F669]' : 'bg-[#BACA2B]';
    }
    if (isSelected) {
       bgClass = 'bg-[#7B61FF]'; // Bright highlight for selection
    }
    if (isCheck) {
       bgClass = 'bg-red-500'; // Hard red for King in check
    }

    // Visibility Logic
    let showPiece = false;
    if (piece) {
       if (hideOpponentPieces) {
         // Only show pieces that match the orientation (player's color)
         if (piece.color === orientation) showPiece = true;
       } else {
         showPiece = true;
       }
    }

    return (
      <div
        key={square}
        onClick={() => onSquareClick && onSquareClick(square)}
        className={`w-full h-full relative flex items-center justify-center overflow-hidden ${bgClass} ${onSquareClick ? 'cursor-pointer' : ''}`}
      >
        {/* Rank/File Notation */}
        {orientation === 'w' ? (
             <>
                {f === 0 && <span className={`absolute top-[2%] left-[4%] text-[0.6rem] sm:text-xs font-bold select-none leading-none ${isLight ? 'text-[#b58863]' : 'text-[#f0d9b5]'}`}>{rank}</span>}
                {r === 0 && <span className={`absolute bottom-[2%] right-[4%] text-[0.6rem] sm:text-xs font-bold select-none leading-none ${isLight ? 'text-[#b58863]' : 'text-[#f0d9b5]'}`}>{file}</span>}
             </>
        ) : (
             <>
                {f === 7 && <span className={`absolute top-[2%] left-[4%] text-[0.6rem] sm:text-xs font-bold select-none leading-none ${isLight ? 'text-[#b58863]' : 'text-[#f0d9b5]'}`}>{rank}</span>}
                {r === 7 && <span className={`absolute bottom-[2%] right-[4%] text-[0.6rem] sm:text-xs font-bold select-none leading-none ${isLight ? 'text-[#b58863]' : 'text-[#f0d9b5]'}`}>{file}</span>}
             </>
        )}

        {/* Piece */}
        {showPiece && piece && (
          <div 
            className={`w-full h-full flex items-center justify-center pb-[5%] select-none z-10
              ${piece.color === 'w' 
                ? 'text-white drop-shadow-[0_2px_1px_rgba(0,0,0,0.8)]' 
                : 'text-black drop-shadow-[0_1px_0px_rgba(255,255,255,0.4)]'
              }`}
          >
             {/* Responsive font size logic: Use viewport relative units (vw/vmin) or strictly fitted size 
                 to ensure it fits within the square grid cell. */}
            <span className="text-[10vw] sm:text-[9vmin] md:text-[50px] lg:text-[60px] leading-none">{PIECE_UNICODE[piece.type]}</span>
          </div>
        )}
        
        {/* Valid Move Marker */}
        {isValidDest && (
          <div className={`absolute rounded-full ${showPiece ? 'border-4 border-slate-800/40 w-full h-full rounded-none' : 'bg-slate-800/30 w-[30%] h-[30%]'}`}></div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={`${className} grid grid-cols-8 grid-rows-8 border-4 border-slate-700 shadow-2xl bg-slate-600 shrink-0 select-none aspect-square`}
    >
      {Array.from({ length: 8 }).map((_, r) =>
        Array.from({ length: 8 }).map((_, f) => renderSquare(r, f))
      )}
    </div>
  );
};

export default ChessBoard;