import React from 'react';
import { Color, PieceSymbol } from 'chess.js';

const PIECE_UNICODE: Record<string, string> = {
  p: '♟',
  n: '♞',
  b: '♝',
  r: '♜',
  q: '♛',
  k: '♚',
};

const PieceIcon: React.FC<{ type: PieceSymbol; color: Color; size?: string }> = ({ type, color, size = "text-xl" }) => {
  const symbol = PIECE_UNICODE[type] || '?';
  
  // Style for white pieces to look solid white with a dark outline/shadow
  const colorClass = color === 'w' 
    ? 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]' 
    : 'text-black';

  return (
    <span className={`inline-block ${size} ${colorClass} select-none leading-none mx-0.5 align-middle`}>
      {symbol}
    </span>
  );
};

export default PieceIcon;