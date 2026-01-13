
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

  const isKeyValid = !!process.env.API_KEY && process.env.API_KEY !== "undefined";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isKeyValid) {
      setErrorMessage("Błąd: Brak klucza API w konfiguracji Vercel.");
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
        setErrorMessage(err.message || "Błąd podczas analizy obrazu.");
        setState(AppState.IDLE);
      }
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Ciche kopiowanie bez irytujących alertów
      console.log('Skopiowano:', text);
    });
  };

  const getISOSymbol = (char: string) => {
    const c = char.toLowerCase();
    let symbol = "";
    if (c.includes('ø') || c.includes('średnic')) symbol = "⌀ ";
    else if (c.includes('⊥') || c.includes('prostopadł')) symbol = "⊥ ";
    else if (c.includes('//') || c.includes('równoległ')) symbol = "∥ ";
    else if (c.includes('⌖') || c.includes('pozycj')) symbol = "⌖ ";
    else if (c.includes('⏥') || c.includes('płaskość')) symbol = "⏥ ";
    else if (c.includes('∠') || c.includes('kąt') || c.includes('°')) symbol = "∠ ";
    else if (c.includes('spoin') || c.includes('weld') || c.includes('a=')) {
        if (c.includes('pachwin')) symbol = "△ ";
        else if (c.includes('v')) symbol = "⌵ ";
        else symbol = "🛠️ ";
    }
    return symbol;
  };

  const formatCharacteristic = (char: string) => {
    const symbol = getISOSymbol(char);
    return `${symbol}${char}`;
  };

  const CopyBtn = ({ text }: { text: string }) => (
    <button 
      onClick={() => copyToClipboard(text)}
      className="ml-2 p-1 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
      title="Kopiuj"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
    </button>
  );

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-xl w-full bg-white p-12 rounded-[2rem] shadow-2xl border border-slate-200 text-center">
          <div className="mb-10">
            <h1 className="text-6xl font-black tracking-tighter text-slate-900 mb-2">
              Robsonbercik<span className="text-blue-600">.</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">CBM Polska Metrology System</p>
          </div>

          <button 
            onClick={() => setIsStarted(true)}
            className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-6 rounded-2xl text-xl transition-all shadow-xl hover:shadow-blue-200 active:scale-[0.98]"
          >
            Uruchom Panel
          </button>
          
          <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-3 gap-4 text-[10px] uppercase font-bold text-slate-400">
            <div>ISO 2768-m</div>
            <div>Multi-Result</div>
            <div>ISO Symbols</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      <header className="bg-white px-8 py-4 flex justify-between items-center border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-3">
           <div className="bg-blue-600 text-white px-3 py-1 rounded-lg font-black text-lg italic shadow-sm">R</div>
           <h1 className="font-bold text-xl tracking-tight text-slate-800">Robsonbercik <span className="text-slate-400 font-medium">Measure</span></h1>
        </div>
        <button 
          onClick={() => { setIsStarted(false); setDrawingData(null); }} 
          className="bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 px-4 py-2 rounded-xl font-bold text-[10px] uppercase transition-all"
        >
          Zamknij
        </button>
      </header>

      <main className="flex-1 p-8 overflow-y-auto">
        {errorMessage && (
          <div className="max-w-4xl mx-auto bg-red-50 border border-red-100 text-red-600 p-4 mb-8 rounded-xl font-medium text-sm flex items-center gap-3">
            <span className="text-xl">⚠️</span> {errorMessage}
          </div>
        )}

        {!drawingData ? (
          <div className="flex flex-col items-center justify-center mt-20">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-xl bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-20 cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-all text-center group shadow-sm"
            >
              <div className="text-7xl mb-6 group-hover:scale-110 transition-transform inline-block">📋</div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Wczytaj Rysunek</h2>
              <p className="text-slate-400 text-sm">Wybierz zdjęcie z bąbelkami, aby rozpocząć ekstrakcję</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload} 
              />
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-10 max-w-[1700px] mx-auto items-start">
             <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 sticky top-24">
                <div className="aspect-auto overflow-hidden rounded-2xl bg-slate-100">
                  <img src={previewImage!} className="w-full h-auto" alt="Technical Drawing" />
                </div>
             </div>
             
             <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-8 pb-8 border-b border-slate-100">
                   <div>
                      <h2 className="text-4xl font-bold text-slate-900 leading-tight mb-2 tracking-tight">{drawingData.partName}</h2>
                      <div className="flex gap-4">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Nr Rysunku: <span className="text-slate-900">{drawingData.drawingNumber}</span></p>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Data: <span className="text-slate-900">{new Date().toLocaleDateString()}</span></p>
                      </div>
                   </div>
                   <button 
                     onClick={() => setDrawingData(null)}
                     className="bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-600 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all"
                   >
                     Zmień plik
                   </button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] tracking-[0.2em] font-black">
                        <th className="p-5 border-b text-left w-16">Lp</th>
                        <th className="p-5 border-b text-left">Charakterystyka ISO</th>
                        <th className="p-5 border-b text-center">Wynik 1</th>
                        <th className="p-5 border-b text-center">Wynik 2</th>
                        <th className="p-5 border-b text-center">Wynik 3</th>
                      </tr>
                    </thead>
                    <tbody className="text-[13px] text-slate-700">
                      {drawingData.dimensions.map((d, i) => {
                        const charFormatted = formatCharacteristic(d.characteristic);
                        return (
                          <tr key={i} className="hover:bg-blue-50/30 transition-colors border-b border-slate-100 last:border-none">
                            <td className="p-5 font-bold text-slate-300">{d.balloonId}</td>
                            <td className="p-5 flex items-center whitespace-nowrap">
                              <span className="text-slate-900">{charFormatted}</span>
                              <CopyBtn text={charFormatted} />
                            </td>
                            <td className="p-5 text-center">
                              <span className="text-slate-900">{d.results[0]}</span>
                              <CopyBtn text={d.results[0]} />
                            </td>
                            <td className="p-5 text-center">
                              <span className="text-slate-900">{d.results[1] || d.results[0]}</span>
                              <CopyBtn text={d.results[1] || d.results[0]} />
                            </td>
                            <td className="p-5 text-center">
                              <span className="text-slate-900">{d.results[2] || d.results[0]}</span>
                              <CopyBtn text={d.results[2] || d.results[0]} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <p className="mt-6 text-[10px] text-slate-400 font-medium italic text-center">
                  * Klikaj w ikonę 📋 obok wybranej wartości, aby skopiować ją do Worda.
                </p>
             </div>
          </div>
        )}
      </main>

      {state === AppState.ANALYZING && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex flex-col items-center justify-center text-center p-12">
          <div className="relative w-24 h-24 mb-10">
            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-3 tracking-tight italic">Robsonbercik Analizuje...</h2>
          <p className="text-blue-400 font-bold max-w-sm uppercase text-[10px] tracking-[0.3em] opacity-80">
            Rozpoznawanie piktogramów ISO i generowanie wyników
          </p>
        </div>
      )}
    </div>
  );
};

export default App;
