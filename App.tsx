
import React, { useState, useRef, useEffect } from 'react';
import { analyzeDrawing } from './services/gemini';
import { AppState, DrawingData } from './types';
import { generateCBMReports } from './services/reportGenerator';

const App: React.FC = () => {
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [drawingData, setDrawingData] = useState<DrawingData | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pobranie klucza wstrzykniętego przez Vite
  const keyFromEnv = process.env.API_KEY;
  
  // Sprawdzenie czy klucz jest faktycznie obecny (nie jest pusty i nie jest stringiem "undefined")
  const isKeyPresent = !!keyFromEnv && keyFromEnv !== "undefined" && keyFromEnv.length > 10;
  const keyDisplay = isKeyPresent ? `${keyFromEnv.substring(0, 4)}***${keyFromEnv.slice(-3)}` : "BRAK";

  const processFile = async (file: File) => {
    if (!isKeyPresent) {
      setErrorMessage("KRYTYCZNY: Aplikacja została zbudowana bez klucza API. Sprawdź ustawienia Environment Variables w Vercel i wykonaj Redeploy.");
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
        setErrorMessage(err.message || "Wystąpił nieoczekiwany błąd podczas analizy.");
        setState(AppState.IDLE);
      }
    };
    // Fix: Changed non-existent property readAsError to onerror for standard FileReader error handling
    reader.onerror = () => {
      setErrorMessage("Błąd podczas odczytu pliku z dysku.");
      setState(AppState.IDLE);
    };
    reader.readAsDataURL(file);
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-yellow-400 flex items-center justify-center p-6 font-mono border-[16px] border-black text-black">
        <div className="max-w-2xl w-full bg-black text-white p-12 shadow-[20px_20px_0px_0px_rgba(0,0,0,0.3)]">
          <div className="border-b-4 border-yellow-400 pb-6 mb-8">
            <h1 className="text-5xl font-black uppercase tracking-tighter italic">AutoMeasure <span className="text-yellow-400">V4.6</span></h1>
            <p className="text-yellow-400 font-bold mt-2 tracking-widest uppercase">System Metrologiczny CBM</p>
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-900 p-6 border-l-8 border-yellow-400">
               <p className="text-[10px] uppercase text-zinc-500 font-bold mb-2">Weryfikacja Systemu (Vercel Build):</p>
               <div className="flex justify-between items-center mb-2">
                  <span className="text-xs uppercase font-bold">Status Klucza:</span>
                  <span className={isKeyPresent ? "text-green-400 font-black" : "text-red-500 font-black animate-pulse"}>
                    {isKeyPresent ? "AKTYWNY" : "NIEWYKRYTY"}
                  </span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xs uppercase font-bold">Klucz (podgląd):</span>
                  <span className="text-zinc-400 text-xs font-mono">{keyDisplay}</span>
               </div>
            </div>

            <button 
              disabled={!isKeyPresent && isStarted}
              onClick={() => setIsStarted(true)}
              className="w-full bg-yellow-400 hover:bg-white text-black font-black py-8 text-2xl uppercase border-4 border-yellow-400 hover:border-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              OTWÓRZ LABORATORIUM
            </button>

            {!isKeyPresent && (
              <div className="p-4 bg-red-600/20 border border-red-600 rounded text-[10px] uppercase leading-relaxed text-red-200">
                Uwaga: System nie widzi Twojego klucza API. <br/>
                1. Dodaj zmienną <b>API_KEY</b> w ustawieniach projektu Vercel.<br/>
                2. Kliknij <b>Redeploy</b> w zakładce Deployments (odświeżenie strony nie zadziała).
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-mono text-black">
      <header className="bg-black text-white p-6 flex justify-between items-center border-b-8 border-yellow-400">
        <div className="flex items-center gap-4">
           <div className="bg-yellow-400 text-black px-3 py-1 font-black">V4.6</div>
           <h1 className="font-black uppercase italic text-xl tracking-tighter">AutoMeasure <span className="text-yellow-400">Lab</span></h1>
        </div>
        <button 
          onClick={() => { setDrawingData(null); setErrorMessage(null); setIsStarted(false); }} 
          className="bg-zinc-800 hover:bg-red-600 text-white px-4 py-2 font-bold text-xs uppercase transition-colors"
        >
          Wyjście
        </button>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {errorMessage && (
          <div className="bg-white border-8 border-black p-8 mb-12 shadow-[12px_12px_0px_0px_rgba(239,68,68,1)] animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4 text-red-600 mb-6">
               <div className="w-12 h-12 bg-red-600 text-white flex items-center justify-center text-3xl font-black">!</div>
               <h3 className="text-2xl font-black uppercase tracking-tighter">Błąd Komunikacji</h3>
            </div>
            <div className="bg-zinc-100 p-6 border-2 border-zinc-200 mb-6 font-mono text-sm">
              <p className="text-black mb-4 uppercase font-bold text-xs underline">Szczegóły techniczne dla administratora:</p>
              <code className="break-all text-red-700">{errorMessage}</code>
              {errorMessage.includes("API_KEY") && (
                <div className="mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-black text-xs font-bold uppercase">
                   Podpowiedź: Klucz API został zmieniony, ale aplikacja nadal używa starej wersji (cache). Wykonaj REDEPLOY na Vercel.
                </div>
              )}
            </div>
            <button onClick={() => setErrorMessage(null)} className="bg-black text-white px-8 py-3 uppercase font-black text-xs hover:bg-zinc-800 transition-all">Zamknij i spróbuj ponownie</button>
          </div>
        )}

        {!drawingData ? (
          <div className="mt-20 flex flex-col items-center">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-2xl bg-white border-8 border-black p-20 cursor-pointer hover:bg-yellow-50 transition-all text-center group shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-8xl pointer-events-none">CAD</div>
              <div className="text-6xl mb-8 group-hover:scale-110 transition-transform inline-block">📁</div>
              <h2 className="text-3xl font-black uppercase mb-4 tracking-tighter">Wczytaj Rysunek CBM</h2>
              <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Kliknij tutaj, aby wybrać plik JPG / PNG</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} 
              />
            </div>
            <p className="mt-12 text-zinc-400 text-[10px] uppercase font-bold tracking-[0.2em]">Zasilane przez Google Gemini 3 Pro Vision</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-12 animate-in fade-in zoom-in-95 duration-500">
             <div className="bg-black p-4 shadow-[15px_15px_0px_0px_rgba(0,0,0,0.1)] border-4 border-black">
                <img src={previewImage!} className="w-full h-auto border-2 border-zinc-800" alt="Rysunek wejściowy" />
             </div>
             
             <div className="space-y-8">
                <div className="bg-white border-8 border-black p-8 shadow-[10px_10px_0px_0px_rgba(250,204,21,1)]">
                   <div className="flex justify-between items-start mb-6 border-b-4 border-zinc-100 pb-6">
                      <div>
                         <h2 className="text-3xl font-black uppercase tracking-tighter">Dane Metrologiczne</h2>
                         <div className="flex gap-2 mt-2">
                            <span className="bg-zinc-100 text-zinc-500 px-2 py-1 text-[10px] font-black uppercase">Nr: {drawingData.drawingNumber || "???"}</span>
                            <span className="bg-zinc-100 text-zinc-500 px-2 py-1 text-[10px] font-black uppercase">Pozycje: {drawingData.dimensions.length}</span>
                         </div>
                      </div>
                      <button 
                        onClick={() => generateCBMReports(drawingData)}
                        className="bg-black text-yellow-400 px-8 py-4 font-black uppercase text-sm hover:bg-yellow-400 hover:text-black transition-all border-4 border-black active:scale-95 flex items-center gap-3"
                      >
                        <span>Pobierz DOCX</span>
                        <span className="text-xl">⬇</span>
                      </button>
                   </div>
                   
                   <div className="max-h-[600px] overflow-y-auto custom-scroll pr-2">
                      <table className="w-full">
                         <thead className="sticky top-0 bg-white z-10">
                            <tr className="text-[10px] font-black uppercase text-zinc-400 border-b-2 border-zinc-200">
                               <th className="py-4 text-left">Bąbelek</th>
                               <th className="py-4 text-left">Wymiar</th>
                               <th className="py-4 text-right">Próbka 1</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-zinc-100">
                            {drawingData.dimensions.map((d, i) => (
                              <tr key={i} className="group hover:bg-yellow-50/50 transition-colors">
                                <td className="py-4"><span className="bg-black text-white px-3 py-1 font-black text-sm">{d.balloonId}</span></td>
                                <td className="py-4">
                                   <div className="font-bold text-sm text-zinc-700">{d.characteristic}</div>
                                   <div className="text-[9px] text-zinc-400 font-bold uppercase">{d.isWeld ? 'SPRAINA' : 'WYMIAR'}</div>
                                </td>
                                <td className="py-4 text-right font-black text-black">
                                   {d.results?.[0] || "O.K."}
                                </td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                   
                   <button 
                    onClick={() => setDrawingData(null)} 
                    className="w-full mt-8 py-3 border-2 border-zinc-200 text-zinc-400 font-bold uppercase text-[10px] hover:border-black hover:text-black transition-all"
                   >
                     Wczytaj inny rysunek
                   </button>
                </div>
             </div>
          </div>
        )}
      </main>

      {state === AppState.ANALYZING && (
        <div className="fixed inset-0 bg-yellow-400 z-[200] flex flex-col items-center justify-center border-[20px] border-black text-center p-10 animate-in fade-in duration-300">
          <div className="w-40 h-40 bg-black flex items-center justify-center mb-12 relative">
             <div className="absolute inset-0 border-8 border-white/20 animate-ping"></div>
             <div className="w-16 h-16 border-8 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-7xl font-black uppercase italic tracking-tighter mb-4 animate-bounce">Analiza AI</h2>
          <div className="bg-black text-white px-10 py-4 font-black uppercase tracking-[0.3em] text-sm">Przetwarzanie Gemini 3 Pro Vision</div>
          <p className="mt-10 font-bold text-black max-w-sm uppercase text-xs leading-relaxed">
            Trwa rozpoznawanie bąbelków i ekstrakcja danych metrologicznych. <br/>
            Może to potrwać do 25 sekund w zależności od skomplikowania rysunku.
          </p>
        </div>
      )}
    </div>
  );
};

export default App;
