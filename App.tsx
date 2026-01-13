
import React, { useState, useRef } from 'react';
import { analyzeDrawing } from './services/gemini';
import { AppState, DrawingData, Dimension } from './types';

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
      setErrorMessage("Błąd: Brak klucza API w konfiguracji.");
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

  const copyRowToClipboard = (dim: Dimension) => {
    // Formatowanie wiersza do Worda: Lp [TAB] Charakterystyka [TAB] Wynik1 [TAB] Wynik2 [TAB] Wynik3
    const results = dim.results || ["O.K.", "O.K.", "O.K."];
    const text = `${dim.balloonId}\t${dim.characteristic}\t${results[0]}\t${results[1] || results[0]}\t${results[2] || results[0]}`;
    
    navigator.clipboard.writeText(text).then(() => {
      // Opcjonalne powiadomienie wizualne zamiast alertu dla lepszego UX
      console.log(`Skopiowano wiersz ${dim.balloonId}`);
    });
  };

  const getPictogram = (char: string) => {
    const c = char.toLowerCase();
    if (c.includes('spoin') || c.includes('weld') || c.includes('a=')) return '🛠️';
    if (c.includes('gd&t') || c.includes('//') || c.includes('⊥') || c.includes('◎')) return '⚙️';
    if (c.includes('°') || c.includes('kąt')) return '📐';
    if (c.includes('ø') || c.includes('średn')) return '⭕';
    if (c.includes('r') && !isNaN(parseInt(c.charAt(1)))) return '↩️';
    return '📏';
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-xl w-full bg-white p-10 rounded-3xl shadow-2xl border border-slate-200 text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-2">
              Robsonbercik<span className="text-blue-600">.</span>
            </h1>
            <p className="text-slate-500 font-semibold uppercase text-xs tracking-[0.2em]">Automatyzacja Pomiarów CBM</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => setIsStarted(true)}
              className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-6 rounded-2xl text-xl transition-all shadow-lg hover:shadow-blue-200 active:scale-[0.98]"
            >
              Uruchom System
            </button>
            <p className="text-[11px] text-slate-400 font-medium">Wersja 4.30 // Silnik Gemini 3 Flash</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans">
      <header className="bg-white px-8 py-4 flex justify-between items-center border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-3">
           <div className="bg-blue-600 text-white px-3 py-1 rounded-lg font-black text-lg italic">R</div>
           <h1 className="font-bold text-xl tracking-tight">Robsonbercik <span className="text-slate-400 font-normal">Measure</span></h1>
        </div>
        <button 
          onClick={() => { setIsStarted(false); setDrawingData(null); }} 
          className="text-slate-400 hover:text-red-600 font-bold text-xs uppercase transition-colors"
        >
          Zamknij panel
        </button>
      </header>

      <main className="flex-1 p-6 overflow-y-auto">
        {errorMessage && (
          <div className="max-w-4xl mx-auto bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-lg font-medium">
            {errorMessage}
          </div>
        )}

        {!drawingData ? (
          <div className="flex flex-col items-center justify-center mt-20">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-xl bg-white border-2 border-dashed border-slate-300 rounded-3xl p-16 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all text-center group"
            >
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform inline-block">📄</div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Wybierz Rysunek</h2>
              <p className="text-slate-500 text-sm">Kliknij, aby wgrać obraz bąbelkowany</p>
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
          <div className="grid lg:grid-cols-2 gap-8 max-w-[1600px] mx-auto items-start">
             <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 sticky top-24">
                <img src={previewImage!} className="w-full h-auto rounded-xl" alt="Podgląd" />
             </div>
             
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                   <div>
                      <h2 className="text-3xl font-bold text-slate-900 leading-none mb-1">{drawingData.partName}</h2>
                      <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">NR: {drawingData.drawingNumber}</p>
                   </div>
                   <button 
                     onClick={() => setDrawingData(null)}
                     className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                   >
                     Zmień plik
                   </button>
                </div>

                <div className="bg-blue-50 p-4 mb-8 rounded-xl border border-blue-100">
                   <p className="text-xs font-semibold text-blue-700 leading-relaxed">
                     <span className="mr-2">💡</span>
                     Kopiuj wiersze klikając przycisk po prawej. Formatowanie jest gotowe do wklejenia w Wordzie w układzie: Lp, Charakterystyka, Wynik 1, Wynik 2, Wynik 3.
                   </p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-widest font-bold">
                        <th className="p-4 border-b text-left w-12">Lp</th>
                        <th className="p-4 border-b text-left">Charakterystyka</th>
                        <th className="p-4 border-b text-center">W1</th>
                        <th className="p-4 border-b text-center">W2</th>
                        <th className="p-4 border-b text-center">W3</th>
                        <th className="p-4 border-b text-right">Akcja</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-slate-900">
                      {drawingData.dimensions.map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-none group">
                          <td className="p-4 font-semibold text-slate-400">{d.balloonId}</td>
                          <td className="p-4">
                            <span className="mr-2 opacity-60">{getPictogram(d.characteristic)}</span>
                            {d.characteristic}
                          </td>
                          <td className="p-4 text-center text-blue-600 font-medium">
                            {d.results?.[0] || 'O.K.'}
                          </td>
                          <td className="p-4 text-center text-blue-600 font-medium">
                            {d.results?.[1] || d.results?.[0] || 'O.K.'}
                          </td>
                          <td className="p-4 text-center text-blue-600 font-medium">
                            {d.results?.[2] || d.results?.[0] || 'O.K.'}
                          </td>
                          <td className="p-4 text-right">
                             <button 
                               onClick={() => copyRowToClipboard(d)}
                               className="bg-white border border-slate-200 text-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm active:scale-95"
                             >
                               Kopiuj
                             </button>
                          </td>
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
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-[500] flex flex-col items-center justify-center text-center p-12">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-8"></div>
          <h2 className="text-4xl font-bold text-white mb-2 italic">Robsonbercik Analizuje...</h2>
          <p className="text-slate-400 font-medium max-w-sm uppercase text-[10px] tracking-widest">
            Trwa inteligentne rozpoznawanie bąbelków i generowanie wyników pomiarowych
          </p>
        </div>
      )}
    </div>
  );
};

export default App;
