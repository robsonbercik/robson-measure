
import React, { useState, useRef, useEffect } from 'react';
import { analyzeDrawing } from './services/gemini';
import { AppState, DrawingData } from './types';
import { generateCBMReports } from './services/reportGenerator';

const App: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [drawingData, setDrawingData] = useState<DrawingData | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkAccess = async () => {
    if (process.env.API_KEY && process.env.API_KEY.length > 10) {
      setIsAuthorized(true);
      return;
    }
    try {
      const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
      if (hasKey) setIsAuthorized(true);
    } catch (e) {}
  };

  useEffect(() => {
    checkAccess();
    const interval = setInterval(checkAccess, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    try {
      await (window as any).aistudio?.openSelectKey();
      setIsAuthorized(true);
    } catch (e) {
      alert("Wybierz klucz API z Google AI Studio.");
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setState(AppState.UPLOADING);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
      try {
        setState(AppState.ANALYZING);
        const data = await analyzeDrawing(base64);
        setDrawingData({ ...data, reportDate: manualDate });
        setState(AppState.READY);
      } catch (error: any) {
        alert("Błąd analizy. Spróbuj ponownie.");
        setState(AppState.IDLE);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full bg-slate-800 p-10 rounded-[40px] border border-slate-700 shadow-2xl">
          <h1 className="text-3xl font-black uppercase italic mb-6">AutoMeasure</h1>
          <p className="text-slate-400 mb-8 text-sm">Aby uruchomić narzędzie na tym komputerze, połącz się ze swoim kontem AI Studio.</p>
          <button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-3xl font-black uppercase tracking-widest transition-all shadow-xl">
            URUCHOM NARZĘDZIE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white py-4 px-10 border-b-4 border-blue-600 shadow-xl flex justify-between items-center">
        <h1 className="text-xl font-black italic uppercase">ROBSONBERCIK <span className="text-blue-500">AUTOMEASURE</span></h1>
        {drawingData && (
          <button onClick={() => setDrawingData(null)} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Nowy rysunek</button>
        )}
      </header>

      <main className="flex-1 p-8">
        {!drawingData ? (
          <div className="max-w-2xl mx-auto mt-20">
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if(f) processFile(f); }}
              className={`bg-white p-20 rounded-[60px] shadow-2xl border-4 border-dashed text-center ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}
            >
              <h2 className="text-3xl font-black text-slate-800 mb-8 uppercase italic">Wgraj Rysunek (JPG)</h2>
              <button onClick={() => fileInputRef.current?.click()} className="w-full bg-slate-900 text-white font-black py-6 rounded-3xl uppercase tracking-widest shadow-xl">Wybierz plik</button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
            </div>
          </div>
        ) : (
          <div className="max-w-[1400px] mx-auto grid grid-cols-12 gap-8">
             <div className="col-span-5">
                <div className="bg-white p-4 rounded-[40px] shadow-lg sticky top-28"><img src={previewImage!} className="w-full rounded-[30px]" /></div>
             </div>
             <div className="col-span-7">
                <div className="bg-white p-10 rounded-[50px] shadow-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black uppercase italic">Wyniki: {drawingData.dimensions.length} bąbelków</h2>
                    <button onClick={() => generateCBMReports(drawingData)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-sm shadow-lg">Pobierz Raport</button>
                  </div>
                  <div className="bg-slate-50 rounded-[30px] overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-black">
                        <tr><th className="p-4 w-16 text-center">Lp</th><th className="p-4">Charakterystyka</th><th className="p-4 w-32 text-center">Wynik</th></tr>
                      </thead>
                      <tbody>
                        {drawingData.dimensions.map((dim, i) => (
                          <tr key={i} className="border-b border-slate-100"><td className="p-4 text-center font-bold text-blue-600">{dim.balloonId}</td><td className="p-4 font-mono text-xs">{dim.characteristic}</td><td className="p-4 text-center font-black uppercase text-[10px]">{dim.results[0]}</td></tr>
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
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white">
           <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
           <h2 className="text-2xl font-black uppercase italic animate-pulse">Robson AI Analizuje...</h2>
        </div>
      )}
    </div>
  );
};

export default App;
