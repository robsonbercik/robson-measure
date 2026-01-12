
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

  const processFile = async (file: File) => {
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
        setErrorMessage(err.message);
        setState(AppState.IDLE);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-yellow-400 flex items-center justify-center p-6 font-mono border-[16px] border-black text-black">
        <div className="max-w-2xl w-full bg-black text-white p-12 shadow-[20px_20px_0px_0px_rgba(0,0,0,0.3)]">
          <div className="border-b-4 border-yellow-400 pb-6 mb-8">
            <h1 className="text-5xl font-black uppercase tracking-tighter italic">AutoMeasure <span className="text-yellow-400">V4.3</span></h1>
            <p className="text-yellow-400 font-bold mt-2 tracking-widest uppercase">System Metrologiczny CBM</p>
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-800 p-4 border-l-8 border-yellow-400">
               <p className="text-xs uppercase text-zinc-500 font-bold mb-1">Status Systemu:</p>
               <div className="flex justify-between items-center">
                  <span className="font-bold">Laboratorium:</span>
                  <span className="text-green-400">GOTOWY</span>
               </div>
            </div>

            <button 
              onClick={() => setIsStarted(true)}
              className="w-full bg-yellow-400 hover:bg-white text-black font-black py-8 text-2xl uppercase border-4 border-yellow-400 hover:border-white transition-all shadow-lg active:scale-95"
            >
              URUCHOM PANEL
            </button>

            <div className="text-[10px] text-zinc-500 uppercase leading-tight border-t border-zinc-800 pt-4">
              Informacja: System korzysta z modelu Gemini 3 Pro. Upewnij sie, ze zmienna API_KEY jest poprawnie dodana w ustawieniach Vercel (Environment Variables).
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-mono text-black">
      <header className="bg-black text-white p-6 flex justify-between items-center border-b-8 border-yellow-400">
        <div className="flex items-center gap-4">
           <div className="bg-yellow-400 text-black px-3 py-1 font-black">V4.3</div>
           <h1 className="font-black uppercase italic text-xl tracking-tighter">AutoMeasure <span className="text-yellow-400">Lab</span></h1>
        </div>
        <button onClick={() => { setDrawingData(null); setErrorMessage(null); setIsStarted(false); }} className="text-yellow-400 hover:text-white font-bold text-xs uppercase underline">Wyjście</button>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {errorMessage && (
          <div className="bg-white border-8 border-black p-8 mb-12 shadow-[12px_12px_0px_0px_rgba(239,68,68,1)]">
            <div className="flex items-center gap-4 text-red-600 mb-6">
               <div className="w-12 h-12 bg-red-600 text-white flex items-center justify-center text-3xl font-black">!</div>
               <h3 className="text-2xl font-black uppercase tracking-tighter">Blad Systemu</h3>
            </div>
            <div className="bg-zinc-100 p-6 border-2 border-zinc-200 mb-6 font-mono text-sm break-all">
              {errorMessage}
            </div>
            <button onClick={() => setErrorMessage(null)} className="bg-black text-white px-6 py-2 uppercase font-black text-xs">Zamknij powiadomienie</button>
          </div>
        )}

        {!drawingData ? (
          <div className="mt-20 flex flex-col items-center">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-2xl bg-white border-8 border-black p-20 cursor-pointer hover:bg-yellow-50 transition-all text-center group shadow-[15px_15px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="text-6xl mb-8 group-hover:scale-110 transition-transform inline-block">📁</div>
              <h2 className="text-3xl font-black uppercase mb-4 tracking-tighter">Wczytaj rysunek techniczny</h2>
              <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Akceptowane formaty: JPG, PNG</p>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-12 animate-in fade-in duration-500">
             <div className="bg-black p-4 shadow-[15px_15px_0px_0px_rgba(0,0,0,0.1)] border-4 border-black">
                <img src={previewImage!} className="w-full h-auto border-2 border-zinc-800" alt="Podglad" />
             </div>
             
             <div className="space-y-8">
                <div className="bg-white border-8 border-black p-8 shadow-[10px_10px_0px_0px_rgba(250,204,21,1)]">
                   <div className="flex justify-between items-start mb-6 border-b-4 border-zinc-100 pb-6">
                      <div>
                         <h2 className="text-3xl font-black uppercase tracking-tighter">Lista wymiarow</h2>
                         <p className="text-zinc-400 font-bold text-xs uppercase mt-1">Liczba pozycji: {drawingData.dimensions.length}</p>
                      </div>
                      <button 
                        onClick={() => generateCBMReports(drawingData)}
                        className="bg-black text-yellow-400 px-10 py-5 font-black uppercase text-sm hover:bg-yellow-400 hover:text-black transition-all border-4 border-black active:scale-95"
                      >
                        Pobierz raporty
                      </button>
                   </div>
                   
                   <div className="max-h-[600px] overflow-y-auto custom-scroll pr-2">
                      <table className="w-full">
                         <thead className="sticky top-0 bg-white">
                            <tr className="text-[10px] font-black uppercase text-zinc-400 border-b-2 border-zinc-100">
                               <th className="py-4 text-left">Lp.</th>
                               <th className="py-4 text-left">Charakterystyka</th>
                               <th className="py-4 text-right">Wynik</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-zinc-50">
                            {drawingData.dimensions.map((d, i) => (
                              <tr key={i} className="group hover:bg-zinc-50">
                                <td className="py-4"><span className="bg-black text-white px-3 py-1 font-black text-sm">{d.balloonId}</span></td>
                                <td className="py-4 font-bold text-sm text-zinc-700">{d.characteristic}</td>
                                <td className="py-4 text-right font-black text-black">
                                   {d.isWeld ? <span className="text-green-600">OK</span> : (d.results?.[0] || "---")}
                                </td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {state === AppState.ANALYZING && (
        <div className="fixed inset-0 bg-yellow-400 z-[200] flex flex-col items-center justify-center border-[20px] border-black text-center p-10">
          <div className="w-32 h-32 bg-black flex items-center justify-center mb-12 animate-pulse">
             <div className="w-12 h-12 border-8 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-6xl font-black uppercase italic tracking-tighter mb-4">Analiza AI</h2>
          <div className="bg-black text-white px-8 py-3 font-black uppercase tracking-widest text-sm">Trwa przetwarzanie obrazu</div>
          <p className="mt-8 font-bold text-black max-w-sm uppercase text-xs">System wyodrebnia bablelki i dane metrologiczne. Moze to potrwac do 30 sekund.</p>
        </div>
      )}
    </div>
  );
};

export default App;
