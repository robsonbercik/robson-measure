
import React, { useState, useRef } from 'react';
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

  const getApiKey = () => {
    try {
      return process.env.API_KEY;
    } catch (e) {
      return undefined;
    }
  };

  const currentKey = getApiKey();
  const isKeyValid = !!currentKey && currentKey !== "undefined" && currentKey.length > 10;
  const keyPreview = isKeyValid ? `${currentKey.substring(0, 4)}...${currentKey.slice(-3)}` : "BRAK KLUCZA";

  const processFile = async (file: File) => {
    if (!isKeyValid) {
      setErrorMessage("Brak klucza API. Wpisz go w Vercel i wykonaj ponowne wdrożenie (REDEPLOY) z opcją \"Clear Cache\".");
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
        let msg = err.message || "Błąd analizy AI.";
        if (msg.includes("429") || msg.includes("quota") || msg.includes("LIMIT")) {
          msg = "PRZEKROCZONO LIMIT GOOGLE: Model Flash zazwyczaj działa, ale Twoje konto może mieć tymczasową blokadę. Spróbuj za minutę lub zmień klucz w Vercel.";
        }
        setErrorMessage(msg);
        setState(AppState.IDLE);
      }
    };
    reader.onerror = () => {
      setErrorMessage("Nie udało się odczytać pliku.");
      setState(AppState.IDLE);
    };
    reader.readAsDataURL(file);
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-yellow-400 flex items-center justify-center p-6 font-mono border-[16px] border-black text-black">
        <div className="max-w-2xl w-full bg-black text-white p-12 shadow-[20px_20px_0px_0px_rgba(0,0,0,0.3)]">
          <div className="border-b-4 border-yellow-400 pb-6 mb-8">
            <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-tight">
              <span className="text-yellow-400 italic">Robsonbercik</span> <br/>
              <span className="italic">drawing reader</span>
            </h1>
            <p className="text-zinc-500 font-bold mt-2 tracking-widest uppercase text-xs">CBM Polska Metrology System V4.11</p>
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-900 p-6 border-l-8 border-yellow-400">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-xs uppercase font-bold text-zinc-500">Status połączenia:</span>
                  <span className={isKeyValid ? "text-green-400 font-black" : "text-red-500 font-black animate-pulse"}>
                    {isKeyValid ? "POŁĄCZONO" : "ROZŁĄCZONO"}
                  </span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xs uppercase font-bold text-zinc-500">Klucz API:</span>
                  <span className="text-zinc-400 text-xs font-mono bg-black/50 px-2">{keyPreview}</span>
               </div>
            </div>

            <button 
              onClick={() => setIsStarted(true)}
              className="w-full bg-yellow-400 hover:bg-white text-black font-black py-8 text-2xl uppercase border-4 border-yellow-400 hover:border-white transition-all shadow-lg active:scale-95"
            >
              WEJDŹ DO PANELU
            </button>

            {!isKeyValid && (
              <div className="text-[10px] text-red-400 uppercase font-bold text-center leading-relaxed px-4">
                UWAGA: Brak klucza API. Wpisz go w Vercel i wykonaj ponowne wdrożenie (REDEPLOY) z opcją "Clear Cache".
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
           <div className="bg-yellow-400 text-black px-3 py-1 font-black">V4.11</div>
           <h1 className="font-black uppercase italic text-xl tracking-tighter">
             <span className="text-yellow-400 italic">Robsonbercik</span> <span className="italic">drawing reader</span>
           </h1>
        </div>
        <button 
          onClick={() => { setDrawingData(null); setErrorMessage(null); setIsStarted(false); }} 
          className="bg-zinc-800 hover:bg-red-600 text-white px-4 py-2 font-bold text-xs uppercase transition-colors"
        >
          Wyjdź
        </button>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {errorMessage && (
          <div className="bg-white border-8 border-black p-8 mb-12 shadow-[12px_12px_0px_0px_rgba(239,68,68,1)]">
            <div className="flex items-center gap-4 text-red-600 mb-6 font-black">
               <div className="w-12 h-12 bg-red-600 text-white flex items-center justify-center text-3xl font-black">!</div>
               <h3 className="text-2xl uppercase tracking-tighter">Status Systemu</h3>
            </div>
            <div className="bg-zinc-100 p-4 border-l-4 border-red-600 mb-6">
               <p className="font-mono text-sm break-words text-red-700 font-bold">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="bg-black text-white px-8 py-3 uppercase font-black text-xs hover:bg-zinc-800 transition-colors">Rozumiem</button>
          </div>
        )}

        {!drawingData ? (
          <div className="mt-20 flex flex-col items-center">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-2xl bg-white border-8 border-black p-20 cursor-pointer hover:bg-yellow-50 transition-all text-center group shadow-[15px_15px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="text-6xl mb-8 group-hover:scale-110 transition-transform inline-block">📄</div>
              <h2 className="text-3xl font-black uppercase mb-4 tracking-tighter italic">WCZYTAJ RYSUNEK Z BĄBELKAMI</h2>
              <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Kliknij, aby wybrać plik rysunku</p>
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
          <div className="grid lg:grid-cols-2 gap-12 animate-in fade-in duration-500">
             <div className="bg-black p-4 border-4 border-black">
                <img src={previewImage!} className="w-full h-auto border-2 border-zinc-800" alt="Podgląd" />
             </div>
             
             <div className="bg-white border-8 border-black p-8 shadow-[10px_10px_0px_0px_rgba(250,204,21,1)]">
                <div className="flex justify-between items-start mb-8 border-b-4 border-zinc-100 pb-6">
                   <div>
                      <h2 className="text-3xl font-black uppercase tracking-tighter italic">{drawingData.partName || "Część CBM"}</h2>
                      <p className="text-zinc-400 font-bold text-xs uppercase mt-1">Nr Rysunku: {drawingData.drawingNumber || "N/A"}</p>
                   </div>
                   <button 
                     onClick={() => generateCBMReports(drawingData)}
                     className="bg-black text-yellow-400 px-6 py-4 font-black uppercase text-xs hover:bg-yellow-400 hover:text-black transition-all border-2 border-black active:scale-95 shadow-[4px_4px_0px_0px_rgba(250,204,21,1)]"
                   >
                     Generuj Raport 1:1 CBM
                   </button>
                </div>
                
                <div className="max-h-[500px] overflow-y-auto custom-scroll pr-4">
                   <div className="bg-zinc-50 p-2 mb-4 border-l-4 border-yellow-400">
                      <p className="text-[10px] uppercase font-bold text-zinc-500">Podgląd bąbelków:</p>
                   </div>
                   {drawingData.dimensions.map((d, i) => (
                     <div key={i} className="flex items-center justify-between p-4 border-b border-zinc-100 hover:bg-zinc-50">
                        <div className="flex items-center gap-4">
                           <span className="bg-black text-white w-8 h-8 flex items-center justify-center font-black text-xs">{d.balloonId}</span>
                           <span className="font-bold text-sm text-zinc-600">{d.characteristic}</span>
                        </div>
                        <span className="font-black text-sm text-green-600">Gotowe</span>
                     </div>
                   ))}
                </div>
                
                <button onClick={() => setDrawingData(null)} className="w-full mt-8 py-3 text-zinc-400 font-bold uppercase text-[10px] hover:text-black transition-colors underline">Zmień plik rysunku</button>
             </div>
          </div>
        )}
      </main>

      {state === AppState.ANALYZING && (
        <div className="fixed inset-0 bg-yellow-400 z-[200] flex flex-col items-center justify-center border-[20px] border-black text-center p-10 animate-in fade-in duration-300">
          <div className="w-32 h-32 bg-black flex items-center justify-center mb-12 animate-spin duration-[2000ms]">
             <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full"></div>
          </div>
          <h2 className="text-6xl font-black uppercase italic tracking-tighter mb-4">Analiza bąbelków...</h2>
          <div className="bg-black text-white px-8 py-2 font-black uppercase text-xs tracking-widest italic">Tryb: Gemini Flash (High Quota)</div>
          <p className="mt-8 font-bold text-black max-w-xs uppercase text-[10px] leading-relaxed">
            AI wyodrębnia wymiary z bąbelków zgodnie z normą ISO 2768-m. Proszę czekać ok. 10 sekund.
          </p>
        </div>
      )}
    </div>
  );
};

export default App;
