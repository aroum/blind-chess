import React, { useState, useRef, useEffect } from 'react';
import ChessBoard from './ChessBoard';
import { simulateGame } from '../utils/chessLogic';
import { SimulationStep, SimulationRule } from '../types';
import { PieceSymbol, Color } from 'chess.js';
import PieceIcon from './PieceIcon';
import { T, Language } from '../utils/translations';

interface SimulatorProps {
  lang: Language;
  onBack: () => void;
}

const Simulator: React.FC<SimulatorProps> = ({ lang, onBack }) => {
  const [whiteFile, setWhiteFile] = useState<File | null>(null);
  const [blackFile, setBlackFile] = useState<File | null>(null);
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [mode, setMode] = useState<SimulationRule>(SimulationRule.MODE_2);
  const [isSimulated, setIsSimulated] = useState(false);
  const [showMobileLog, setShowMobileLog] = useState(false); // Mobile Log Toggle

  const scrollRef = useRef<HTMLDivElement>(null);
  const t = T[lang];

  // Auto-scroll log only if we are at the latest step
  useEffect(() => {
    if (scrollRef.current && currentStepIndex === steps.length - 1) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentStepIndex, steps.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, color: 'w' | 'b') => {
    if (e.target.files && e.target.files[0]) {
      if (color === 'w') setWhiteFile(e.target.files[0]);
      else setBlackFile(e.target.files[0]);
    }
  };

  const runSimulation = async () => {
    if (!whiteFile || !blackFile) return;

    const readMoves = async (file: File) => {
      const text = await file.text();
      return text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    };

    const wMoves = await readMoves(whiteFile);
    const bMoves = await readMoves(blackFile);

    const resultSteps = simulateGame(wMoves, bMoves, mode, lang);
    setSteps(resultSteps);
    setIsSimulated(true);
    setCurrentStepIndex(0);
  };

  const changeStep = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < steps.length) {
      setCurrentStepIndex(newIndex);
    }
  };

  const currentStep = steps[currentStepIndex];

  // Helper to determine winner based on score
  const getWinner = () => {
    const finalStep = steps[steps.length - 1];
    if (finalStep.whiteScore > finalStep.blackScore) return { text: t.winnerWhite, color: "text-white" };
    if (finalStep.blackScore > finalStep.whiteScore) return { text: t.winnerBlack, color: "text-slate-900" };
    return { text: t.draw, color: "text-gray-400" };
  };

  if (!isSimulated) {
    return (
      <div className="max-w-xl mx-auto bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 mt-10">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">{t.setupGame}</h2>
        
        <div className="space-y-6">
          <div>
             <label className="block text-slate-400 mb-2 font-medium">{t.fileWhite}</label>
             <input type="file" accept=".txt" onChange={(e) => handleFileChange(e, 'w')} className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 transition"/>
          </div>

          <div>
             <label className="block text-slate-400 mb-2 font-medium">{t.fileBlack}</label>
             <input type="file" accept=".txt" onChange={(e) => handleFileChange(e, 'b')} className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-600 file:text-white hover:file:bg-slate-500 transition"/>
          </div>

          <div>
             <label className="block text-slate-400 mb-2 font-medium">{t.errorMode}</label>
             <div className="grid grid-cols-1 gap-3">
               <button 
                 onClick={() => setMode(SimulationRule.MODE_1)}
                 className={`p-3 rounded-lg border text-left transition ${mode === SimulationRule.MODE_1 ? 'bg-indigo-900/50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
               >
                 <div className="font-bold text-white">{t.modeStrict}</div>
                 <div className="text-xs text-slate-400 mt-1">{t.modeStrictDesc}</div>
               </button>
               <button 
                 onClick={() => setMode(SimulationRule.MODE_2)}
                 className={`p-3 rounded-lg border text-left transition ${mode === SimulationRule.MODE_2 ? 'bg-indigo-900/50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
               >
                 <div className="font-bold text-white">{t.modeSmart}</div>
                 <div className="text-xs text-slate-400 mt-1">{t.modeSmartDesc}</div>
               </button>
             </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button onClick={onBack} className="px-6 py-3 rounded-lg text-slate-300 hover:bg-slate-700 font-bold transition">{t.back}</button>
            <button 
              onClick={runSimulation}
              disabled={!whiteFile || !blackFile}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold shadow-lg transition"
            >
               {t.launch}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper to render log entry with icons
  const renderLogEntry = (step: SimulationStep, idx: number) => {
    const isCurrent = idx === currentStepIndex;
    const san = step.moveSan || "";
    const isCapture = san.includes('x');
    const isIllegal = step.isIllegalAttempt;
    
    // Determine piece from SAN
    let pieceType: PieceSymbol = 'p';
    if (san.length > 0) {
      const firstChar = san[0];
      if (['N', 'B', 'R', 'Q', 'K'].includes(firstChar)) {
        pieceType = firstChar.toLowerCase() as PieceSymbol;
      }
    }
    
    // Color
    const playerWhoMoved = step.turnColor === 'w' ? 'b' : 'w'; 
    const playerText = playerWhoMoved === 'w' ? t.white : t.black;
    const textColor = playerWhoMoved === 'w' ? 'text-white' : 'text-slate-400';

    // Parse Destination
    const destMatch = san.match(/[a-h][1-8]/);
    const dest = destMatch ? destMatch[0] : '';
    const isCastle = san === 'O-O' || san === 'O-O-O';
    const castleText = san === 'O-O' ? t.castleShort : t.castleLong;

    if (isIllegal) {
      return (
        <span className="text-red-400 flex items-center gap-1 text-xs sm:text-sm">
          ⛔ {step.description}
        </span>
      );
    }
    
    return (
       <div className="flex flex-wrap items-center gap-1 text-sm">
          <span className={`${textColor} font-bold mr-1`}>{playerText}</span>
          {step.moveSan ? (
             <>
               {isCastle ? (
                 <span className="text-slate-200 font-bold">{castleText}</span>
               ) : (
                 <>
                   <PieceIcon type={pieceType} color={playerWhoMoved} size="text-lg" />
                   <span className="text-slate-500 mx-1">{t.wentTo}</span>
                   <span className="font-bold text-indigo-300 text-base">{dest.toUpperCase()}</span>
                 </>
               )}
             </>
          ) : (
            <span className="text-slate-500 italic">{step.description}</span>
          )}

          {isCapture && <span className="text-[10px] bg-red-900/40 text-red-300 px-1 rounded ml-1 uppercase font-bold tracking-wider">{t.capture}</span>}
          {step.isCheck && <span className="text-[10px] bg-yellow-900/40 text-yellow-300 px-1 rounded ml-1 uppercase font-bold tracking-wider">{t.check}</span>}
          {step.isMate && <span className="text-[10px] bg-red-600 text-white px-1 rounded ml-1 font-bold uppercase tracking-wider">{t.mate}</span>}
       </div>
    );
  };

  const winner = getWinner();

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-slate-900 text-white relative">
      {/* Top Bar */}
      <div className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shrink-0 z-20">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-slate-400 hover:text-white transition font-bold">← {t.back}</button>
            <div className="h-6 w-px bg-slate-600 hidden md:block"></div>
            <h1 className="font-bold text-lg hidden md:block">{t.game}: <span className="text-indigo-400">{mode === SimulationRule.MODE_1 ? 'Strict' : 'Smart'}</span></h1>
         </div>
         <div className="flex items-center gap-4 text-xs sm:text-sm">
            <div className="flex flex-col items-end">
               <span className="text-slate-400">{t.scoreWhite}</span>
               <span className="font-bold text-green-400">{currentStep.whiteScore}</span>
            </div>
             <div className="flex flex-col items-end border-l border-slate-600 pl-4">
               <span className="text-slate-400">{t.scoreBlack}</span>
               <span className="font-bold text-red-400">{currentStep.blackScore}</span>
            </div>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left: Board & Controls (Always visible on mobile) */}
        <div className="flex-1 flex flex-col p-2 md:p-8 items-center justify-center relative overflow-hidden bg-slate-900">
           
           {/* Board Container */}
           <div className="relative w-full max-w-[640px] flex justify-center items-center">
             <ChessBoard 
               fen={currentStep.fen} 
               orientation="w" 
               lastMove={null}
               checkSquare={currentStep.isCheck ? (currentStep.turnColor === 'w' ? 'e1' : 'e8') : null}
               className="w-full max-w-[640px]"
             />
             {currentStep.isMate && (
               <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <h1 className="text-4xl md:text-6xl font-black text-red-500 uppercase tracking-widest drop-shadow-lg border-8 border-red-500 p-4 rotate-12">{t.mate}</h1>
               </div>
             )}
           </div>

           {/* Controls */}
           <div className="w-full max-w-[640px] mt-4 bg-slate-800 p-3 rounded-xl border border-slate-700 shadow-xl z-10">
              <input 
                type="range" 
                min={0} 
                max={steps.length - 1} 
                value={currentStepIndex} 
                onChange={(e) => changeStep(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer mb-3 accent-indigo-500"
              />
              <div className="flex justify-between items-center gap-2">
                 <button 
                    onClick={() => changeStep(0)} 
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 font-bold"
                 >
                    &lt;&lt;
                 </button>
                 <button 
                   onClick={() => changeStep(currentStepIndex - 1)}
                   disabled={currentStepIndex === 0}
                   className="flex-1 px-2 py-2 bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-50 font-bold transition"
                 >
                   PREV
                 </button>
                 
                 <div className="text-mono font-bold text-indigo-300 text-sm whitespace-nowrap px-1">
                    {currentStepIndex} / {steps.length - 1}
                 </div>
                 
                 <button 
                   onClick={() => changeStep(currentStepIndex + 1)}
                   disabled={currentStepIndex === steps.length - 1}
                   className="flex-1 px-2 py-2 bg-indigo-600 hover:bg-indigo-500 rounded disabled:opacity-50 font-bold transition"
                 >
                   NEXT
                 </button>
                 <button 
                    onClick={() => changeStep(steps.length - 1)} 
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 font-bold"
                 >
                    &gt;&gt;
                 </button>
              </div>
              
              <div className="flex gap-2 mt-2">
                  {/* Mobile Toggle Button */}
                  <button 
                    onClick={() => setShowMobileLog(true)}
                    className="md:hidden flex-1 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded font-bold uppercase text-xs tracking-wider"
                  >
                    {t.log}
                  </button>
                  <button 
                    onClick={() => changeStep(steps.length - 1)}
                    className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-600/50 rounded font-bold uppercase text-xs tracking-wider transition"
                  >
                    {t.results}
                  </button>
              </div>
           </div>
        </div>

        {/* Right: Logs & Details (Hidden on mobile unless toggled) */}
        <div className={`
            fixed inset-0 z-50 bg-slate-900 md:static md:bg-slate-800 md:w-96 md:border-l md:border-slate-700 md:flex md:flex-col md:h-full
            ${showMobileLog ? 'flex flex-col' : 'hidden'}
        `}>
           {/* Mobile Header for Log */}
           <div className="md:hidden p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
              <h3 className="font-bold text-white">{t.log}</h3>
              <button onClick={() => setShowMobileLog(false)} className="text-slate-400 hover:text-white px-3 py-1 bg-slate-700 rounded">{t.close}</button>
           </div>
           
           {/* Active Log */}
           <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide" ref={scrollRef}>
              <h3 className="hidden md:block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 sticky top-0 bg-slate-800 py-2 px-2 z-10">{t.events}</h3>
              {steps.map((step, idx) => {
                 if (idx === 0) return null; // Skip init step
                 const isCurrent = idx === currentStepIndex;
                 return (
                   <div 
                     key={idx} 
                     onClick={() => { changeStep(idx); setShowMobileLog(false); }}
                     className={`p-2 rounded cursor-pointer transition flex items-start gap-2 border ${isCurrent ? 'bg-indigo-900/40 border-indigo-500/50' : 'bg-slate-900/50 border-transparent hover:bg-slate-700'} ${step.isIllegalAttempt ? 'border-red-500/30 bg-red-900/10' : ''}`}
                   >
                      <span className="text-slate-600 font-mono text-xs mt-1 w-6 text-right">{idx}.</span>
                      <div className="flex-1">
                         {renderLogEntry(step, idx)}
                      </div>
                   </div>
                 );
              })}
           </div>

           {/* Captured & Stats Panel */}
           <div className="p-4 bg-slate-900 border-t border-slate-700 shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.3)] safe-area-bottom">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">{t.losses}</h4>
              
              <div className="mb-3">
                 <div className="text-xs text-slate-400 mb-1 flex justify-between">
                    <span>{t.lostByWhite}:</span>
                    <span className="text-red-400 font-mono">-{39 - currentStep.whiteMaterial}</span>
                 </div>
                 <div className="flex flex-wrap gap-1 min-h-[28px] bg-slate-800 p-1 rounded border border-slate-700">
                    {currentStep.capturedWhite.length === 0 && <span className="text-slate-600 text-xs p-1">-</span>}
                    {currentStep.capturedWhite.map((name, i) => (
                       <span key={i} title={name} className="text-lg leading-none select-none">
                         <PieceIcon 
                           type={name === 'Пешка' || name === 'Pawn' ? 'p' : name === 'Конь' || name === 'Knight' ? 'n' : name === 'Слон' || name === 'Bishop' ? 'b' : name === 'Ладья' || name === 'Rook' ? 'r' : name === 'Ферзь' || name === 'Queen' ? 'q' : 'k'} 
                           color='w' 
                           size="text-xl"
                         />
                       </span>
                    ))}
                 </div>
              </div>

              <div>
                 <div className="text-xs text-slate-400 mb-1 flex justify-between">
                    <span>{t.lostByBlack}:</span>
                    <span className="text-green-400 font-mono">-{39 - currentStep.blackMaterial}</span>
                 </div>
                 <div className="flex flex-wrap gap-1 min-h-[28px] bg-slate-800 p-1 rounded border border-slate-700">
                    {currentStep.capturedBlack.length === 0 && <span className="text-slate-600 text-xs p-1">-</span>}
                    {currentStep.capturedBlack.map((name, i) => (
                       <span key={i} title={name} className="text-lg leading-none select-none">
                          <PieceIcon 
                           type={name === 'Пешка' || name === 'Pawn' ? 'p' : name === 'Конь' || name === 'Knight' ? 'n' : name === 'Слон' || name === 'Bishop' ? 'b' : name === 'Ладья' || name === 'Rook' ? 'r' : name === 'Ферзь' || name === 'Queen' ? 'q' : 'k'} 
                           color='b' 
                           size="text-xl"
                         />
                       </span>
                    ))}
                 </div>
              </div>
           </div>

        </div>
      </div>

      {/* Winner Banner - Moved to root to be on top of everything */}
      <div className={`absolute top-[4.5rem] md:top-24 left-0 right-0 flex justify-center pointer-events-none transition-opacity duration-500 z-[60] ${currentStepIndex === steps.length - 1 ? 'opacity-100' : 'opacity-0'}`}>
        <div className={`inline-block px-4 py-1 md:px-8 md:py-2 rounded-full font-black text-xl md:text-3xl shadow-xl border-4 border-slate-700 bg-slate-200 ${winner.color}`}>
          {winner.text}
        </div>
      </div>
    </div>
  );
};

export default Simulator;