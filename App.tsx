import React, { useState } from 'react';
import { AppMode } from './types';
import Recorder from './components/Recorder';
import Simulator from './components/Simulator';
import Help from './components/Help';
import PieceIcon from './components/PieceIcon';
import { T, Language } from './utils/translations';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>(AppMode.HOME);
  const [lang, setLang] = useState<Language>('ru');
  
  const t = T[lang];

  if (appMode === AppMode.RECORDER) {
    return <Recorder lang={lang} onBack={() => setAppMode(AppMode.HOME)} />;
  }

  if (appMode === AppMode.SIMULATOR) {
    return <Simulator lang={lang} onBack={() => setAppMode(AppMode.HOME)} />;
  }

  if (appMode === AppMode.HELP) {
    return <Help lang={lang} onBack={() => setAppMode(AppMode.HOME)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4 relative">
      
      {/* Language Toggle & Help Button in Top Right */}
      <div className="absolute top-4 right-4 flex gap-3">
         <button 
           onClick={() => setAppMode(AppMode.HELP)}
           className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-bold text-sm transition"
         >
           {t.howToPlay}
         </button>
         <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
            <button 
              onClick={() => setLang('ru')}
              className={`px-3 py-1 rounded text-sm font-bold transition ${lang === 'ru' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              RU
            </button>
            <button 
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded text-sm font-bold transition ${lang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              EN
            </button>
         </div>
      </div>

      <div className="max-w-4xl w-full pt-12">
        <div className="text-center mb-12">
           <div className="flex justify-center mb-6 gap-4">
              <span className="text-8xl drop-shadow-2xl text-white">♔</span>
              <span className="text-8xl drop-shadow-2xl text-black">♚</span>
           </div>
           <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">{t.appTitle}</h1>
           <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
             {t.appDesc}
           </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
           {/* Card 1: Recorder */}
           <div 
             onClick={() => setAppMode(AppMode.RECORDER)}
             className="group bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-indigo-500 rounded-2xl p-8 cursor-pointer transition-all hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 relative overflow-hidden"
           >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                 <svg className="w-40 h-40 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-indigo-400 transition">{t.recorder}</h2>
              <p className="text-slate-400 text-base leading-relaxed mt-4">
                 {t.recorderDesc}
              </p>
              <div className="mt-8 flex items-center text-indigo-400 font-bold text-lg uppercase tracking-wider">
                 {t.startRecord} <span className="ml-2">→</span>
              </div>
           </div>

           {/* Card 2: Simulator */}
           <div 
             onClick={() => setAppMode(AppMode.SIMULATOR)}
             className="group bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-purple-500 rounded-2xl p-8 cursor-pointer transition-all hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1 relative overflow-hidden"
           >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                 <svg className="w-40 h-40 text-purple-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-purple-400 transition">{t.simulator}</h2>
              <p className="text-slate-400 text-base leading-relaxed mt-4">
                 {t.simulatorDesc}
              </p>
              <div className="mt-8 flex items-center text-purple-400 font-bold text-lg uppercase tracking-wider">
                 {t.startGame} <span className="ml-2">→</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;