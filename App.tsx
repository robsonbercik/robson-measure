
import React, { useState, useRef } from 'react';
import { analyzeDrawing } from './services/gemini';
import { AppState, DrawingData } from './types';

const App: React.FC = () => {
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [drawingData, setDrawingData] = useState<DrawingData | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getApiKey = () => {
    try { return process.env.API_KEY; } catch (e) { return undefined; }
  };

  const currentKey = getApiKey();
  const isKeyValid = !!currentKey && currentKey !== "undefined" && currentKey.length > 10;

  const processFile = async (file: File) => {
    if (!isKeyValid) {
      setErrorMessage("Brak klucza API w systemie Vercel.");
      return;
    }
    
    setErrorMessage(null);
    setState(AppState.UPLOADING);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
      try {
        setState(AppState.ANALYZING);
        const data = await analyzeDrawing(base64);
        setDrawingData(data);
        setState(AppState.READY);
      } catch (err: any) {
        setErrorMessage(err.message || "Błąd analizy AI.");
        setState(AppState.IDLE);
      }
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("SKOPIOWANO DO SCHOWKA!");
  };

  const formatDataForTable = () => {
    if (!drawingData) return "";
    return drawingData.dimensions
      .map((d, i) => `${d.balloonId}\t${d.characteristic}\t${d.results?.[0] || 'O.K.'}`)
      .join('\n');
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-yellow-400 flex items-center justify-center p-6 font-mono border-[20px] border-black text-black">
        <div className="max-w-2xl w-full bg-black text-white p-12 shadow-[30px_30px_0px_0px_rgba(0,0,0,0.2)] border-4 border-white">
          <div className="border-b-8 border-yellow-400 pb-6 mb-8">
            <h1 className="text-6xl font-black uppercase tracking-tighter italic leading-none">
              <span className="text-yellow-400">ROBSON</span><br/>BERCIK
            </h1>
            <p className="text-zinc-500 font-bold mt-4 tracking-[0.3em] uppercase text-xs">Metrology System V4.20 // NO-WORD MODE</p>
          </div>

          <div className="space-y-8">
            <button 
              onClick={() => setIsStarted(true)}
              className="w-full bg-yellow-400 hover:bg-white text-black font-black py-10 text-3xl uppercase border-4 border-black transition-all shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              URUCHOM PANEL
            </button>
            <div className="text-[10px] text-zinc-500 uppercase font-bold text-center">
              SYSTEM GOTOWY DO ANALIZY BĄBELKÓW ISO 2768-M
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col font-mono text-white">
      <header className="bg-black p-6 flex justify-between items-center border-b-8 border-yellow-400">
        <div className="flex items-center gap-6">
           <div className="bg-yellow-400 text-black px-4 py-2 font-black text-2xl skew-x-[-10deg]">ROBSON</div>
           <h1 className="font-black uppercase italic text-xl tracking-tighter text-yellow-400">
             Drawing Reader <span className="text-white">v4.20</span>
           </h1>
        </div>
        <button 
          onClick={() => { setDrawingData(null); setIsStarted(false); }} 
          className="bg-red-600 hover:bg-white hover:text-red-600 text-white px-6 py-2 font-black text-xs uppercase transition-all border-2 border-transparent hover:border-red-600"
        >
          ZAMKNIJ
        </button>
      </header>

      <main className="flex-1 p-8 overflow-y-auto">
        {errorMessage && (
          <div className="bg-red-600 text-white p-6 mb-8 border-4 border-white font-black uppercase animate-pulse">
            BŁĄD SYSTEMU: {errorMessage}
          </div>
        )}

        {!drawingData ? (
          <div className="flex flex-col items-center justify-center mt-20">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-3xl bg-yellow-400 border-[10px] border-black p-24 cursor-pointer hover:bg-white transition-all text-center group shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="text-8xl mb-6 group-hover:rotate-12 transition-transform inline-block">📋</div>
              <h2 className="text-5xl font-black uppercase mb-4 tracking-tighter text-black italic">Wgraj rysunek</h2>
              <p className="text-black font-bold uppercase text-xs tracking-widest bg-black/10 inline-block px-4 py-1">Kliknij tutaj aby wybrać JPG/PNG</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} 
              />
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
             <div className="bg-black p-2 border-4 border-yellow-400 shadow-2xl">
                <img src={previewImage!} className="w-full h-auto grayscale contrast-125" alt="Podgląd" />
             </div>
             
             <div className="bg-white text-black p-8 border-8 border-black shadow-[15px_15px_0px_0px_rgba(250,204,21,1)]">
                <div className="border-b-4 border-black pb-4 mb-6">
                   <h2 className="text-4xl font-black uppercase italic leading-none">{drawingData.partName}</h2>
                   <p className="font-bold text-zinc-500 mt-2 uppercase">Rysunek: {drawingData.drawingNumber}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                   <button 
                     onClick={() => copyToClipboard(formatDataForTable())}
                     className="bg-black text-yellow-400 p-4 font-black uppercase text-sm hover:bg-yellow-400 hover:text-black transition-all border-4 border-black"
                   >
                     Kopiuj Całą Tabelę
                   </button>
                   <button 
                     onClick={() => setDrawingData(null)}
                     className="bg-zinc-200 text-black p-4 font-black uppercase text-sm hover:bg-black hover:text-white transition-all border-4 border-black"
                   >
                     Nowy Rysunek
                   </button>
                </div>

                <div className="bg-zinc-100 p-4 mb-4 border-l-8 border-black">
                   <p className="text-[10px] font-black uppercase text-zinc-500 mb-2">Instrukcja Word:</p>
                   <p className="text-xs font-bold leading-relaxed">
                     Kliknij przycisk powyżej, a następnie wklej dane (CTRL+V) bezpośrednio do tabeli w Wordzie. 
                     Dane są rozdzielone tabulatorami (Lp | Charakterystyka | Wynik).
                   </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border-4 border-black text-xs">
                    <thead>
                      <tr className="bg-black text-white uppercase italic">
                        <th className="p-2 border border-white/20 text-left">Lp</th>
                        <th className="p-2 border border-white/20 text-left">Charakterystyka</th>
                        <th className="p-2 border border-white/20 text-center">Wynik</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold">
                      {drawingData.dimensions.map((d, i) => (
                        <tr key={i} className="hover:bg-yellow-100 border-b-2 border-black/10">
                          <td className="p-2 border-r-2 border-black/10">{d.balloonId}</td>
                          <td className="p-2 border-r-2 border-black/10">{d.characteristic}</td>
                          <td className="p-2 text-center text-blue-700">{d.results?.[0] || 'O.K.'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        )}
      </main>

      {state === AppState.ANALYZING && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center text-center p-10">
          <div className="relative w-48 h-48 mb-12">
             <div className="absolute inset-0 border-[15px] border-yellow-400 animate-ping"></div>
             <div className="absolute inset-4 border-[15px] border-white animate-pulse"></div>
             <div className="absolute inset-0 flex items-center justify-center text-5xl">⚡</div>
          </div>
          <h2 className="text-7xl font-black uppercase italic tracking-tighter text-yellow-400 mb-4 animate-bounce">ANALIZA...</h2>
          <div className="bg-white text-black px-8 py-2 font-black uppercase text-xl italic skew-x-[-10deg]">SYSTEM ROBSONBERCIK</div>
          <p className="mt-8 font-bold text-zinc-500 max-w-md uppercase text-xs leading-relaxed tracking-widest">
            Trwa wyodrębnianie bąbelków z rysunku technicznego. Proszę nie zamykać okna.
          </p>
        </div>
      )}
    </div>
  );
};

export default App;
