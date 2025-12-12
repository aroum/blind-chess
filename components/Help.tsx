import React from 'react';
import { T, Language } from '../utils/translations';

interface HelpProps {
  lang: Language;
  onBack: () => void;
}

const Help: React.FC<HelpProps> = ({ lang, onBack }) => {
  const t = T[lang];
  
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="text-4xl text-indigo-500">?</span>
          {t.helpTitle}
        </h2>
        
        <div className="space-y-4 mb-8">
          {t.helpSteps.map((step, idx) => (
            <div key={idx} className="flex gap-4">
               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 text-indigo-400 font-bold flex items-center justify-center border border-slate-600">
                 {idx + 1}
               </div>
               <p className="text-slate-300 text-lg leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        <button 
          onClick={onBack}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition text-lg shadow-lg"
        >
          {t.back}
        </button>
      </div>
    </div>
  );
};

export default Help;