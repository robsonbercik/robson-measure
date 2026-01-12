
import React, { useState, useRef, useEffect } from 'react';
import { analyzeDrawing } from './services/gemini';
import { AppState, DrawingData } from './types';
import { generateCBMReports } from './services/reportGenerator';

const App: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [drawingData, setDrawingData] = useState<DrawingData | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiKeyStatus = process.env.API_KEY && process.env.API_KEY !== "undefined" ? "AKTYWNY" : "BRAK";

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

  // Ekran startowy - teraz CZARNY, żebyś wiedział że to nowa wersja
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-xl w-full text-center space-y-12">
          <div className="relative inline-block">
             <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
             <div className="bg-gradient-to-br from-blue-600 to-indigo-700 w-32 h-32 rounded-[40px] flex items-center justify-center mx-auto shadow-2xl relative">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
             </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none">AutoMeasure <span className="text-blue-500">v3.0</span></h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">CBM Polska • Kontrola Jakości</p>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
             <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-black uppercase text-slate-500">Status Systemu:</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black ${apiKeyStatus === "AKTYWNY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                   KLUCZ API: {apiKeyStatus}
                </span>
             </div>
             <button 
                onClick={() => setIsAuthorized(true)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-2xl uppercase tracking-widest shadow-2xl shadow-blue-500/20 transition-all active:scale-95"
             >
               Uruchom Analizator
             </button>
          </div>

          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">Developed by Senior Metrology Expert</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-950 text-white p-6 flex justify-between items-center shadow-2xl z-10">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black italic">AM</div>
           <h1 className="font-black italic uppercase tracking-tight text-xl">Auto<span className="text-blue-500">Measure</span></h1>
        </div>
        <div className="flex gap-4">
           <button onClick={() => { setDrawingData(null); setErrorMessage(null); setPreviewImage(null); }} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all">Nowy Projekt</button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-[1600px] mx-auto w-full">
        {/* PANEL POMOCY - TERAZ BARDZO WIDOCZNY */}
        {errorMessage && (
          <div className="bg-white border-2 border-red-500 rounded-[40px] overflow-hidden shadow-2xl mb-12 animate-in slide-in-from-top-10 duration-500">
            <div className="bg-red-500 p-4 text-white font-black uppercase flex items-center gap-3">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               UWAGA: WYKRYTO BŁĄD SYSTEMU
            </div>
            <div className="p-8 grid md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <p className="text-slate-500 text-sm font-bold uppercase">Komunikat błędu:</p>
                  <div className="bg-slate-100 p-6 rounded-2xl font-mono text-red-600 font-bold break-all">
                    {errorMessage}
                  </div>
               </div>
               <div className="bg-blue-50 p-8 rounded-[30px] border border-blue-100">
                  <h4 className="font-black uppercase text-blue-900 mb-4">Jak to naprawić (Krok po kroku):</h4>
                  <ul className="space-y-3 text-sm text-blue-800 font-bold">
                    <li className="flex gap-3 items-start"><span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0">1</span> Wejdź na Vercel.com i swój projekt.</li>
                    <li className="flex gap-3 items-start"><span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0">2</span> W menu wybierz "Deployments".</li>
                    <li className="flex gap-3 items-start"><span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0">3</span> Kliknij "Redeploy" przy ostatniej próbie.</li>
                  </ul>
                  <p className="mt-6 text-[11px] text-blue-400 italic font-medium">Po kliknięciu Redeploy poczekaj 2 minuty i odśwież tę stronę.</p>
               </div>
            </div>
          </div>
        )}

        {!drawingData ? (
          <div className="h-[60vh] flex items-center justify-center">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-xl bg-white p-12 rounded-[60px] border-4 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all group shadow-sm flex flex-col items-center"
            >
              <div className="w-24 h-24 bg-blue-100 rounded-[35px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
              </div>
              <h2 className="text-2xl font-black uppercase text-slate-800 italic">Kliknij, aby dodać rysunek</h2>
              <p className="text-slate-400 font-bold mt-2">Akceptowane formaty: JPG, PNG (max 5MB)</p>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-10">
             <div className="col-span-12 lg:col-span-5">
                <div className="bg-white p-6 rounded-[50px] shadow-2xl border border-slate-200 sticky top-8">
                   <div className="rounded-[35px] overflow-hidden bg-slate-100 border-2 border-slate-50">
                      <img src={previewImage!} className="w-full h-auto" alt="Rysunek" />
                   </div>
                </div>
             </div>
             <div className="col-span-12 lg:col-span-7 space-y-8">
                <div className="bg-slate-950 p-10 rounded-[50px] text-white flex flex-col md:flex-row justify-between items-center gap-8">
                   <div className="space-y-1">
                      <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Sukces Analizy</p>
                      <h2 className="text-3xl font-black italic uppercase tracking-tighter">Dane Gotowe</h2>
                      <p className="text-slate-500 font-bold">Wykryto {drawingData.dimensions.length} wymiarów do raportu.</p>
                   </div>
                   <button 
                    onClick={() => generateCBMReports(drawingData)}
                    className="w-full md:w-auto bg-blue-600 text-white px-12 py-5 rounded-[25px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-blue-500/40 hover:bg-blue-500 active:scale-95 transition-all"
                   >
                     Generuj DOCX
                   </button>
                </div>

                <div className="bg-white rounded-[50px] shadow-xl border border-slate-200 overflow-hidden">
                   <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-black uppercase text-slate-800 flex items-center gap-3">
                         <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                         Wykryte Wymiary
                      </h3>
                      <span className="bg-slate-100 px-4 py-2 rounded-xl text-[10px] font-black text-slate-500 uppercase">{drawingData.drawingNumber || "Brak numeru"}</span>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full">
                         <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                            <tr>
                               <th className="p-8 text-center w-24">Nr</th>
                               <th className="p-8 text-left">Charakterystyka</th>
                               <th className="p-8 text-right">Wyniki (AI)</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {drawingData.dimensions.map((d, i) => (
                              <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                                <td className="p-8 text-center">
                                   <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black mx-auto">{d.balloonId}</div>
                                </td>
                                <td className="p-8 font-mono text-sm font-bold text-slate-700">{d.characteristic}</td>
                                <td className="p-8 text-right">
                                   <div className="flex gap-2 justify-end">
                                      {d.results.slice(0, 1).map((res, ri) => (
                                        <span key={ri} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black">{d.isWeld ? "OK" : res}</span>
                                      ))}
                                   </div>
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
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center text-white z-[100] p-6 text-center">
          <div className="relative mb-12">
             <div className="w-32 h-32 border-[12px] border-blue-500/20 rounded-full"></div>
             <div className="w-32 h-32 border-[12px] border-blue-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
             </div>
          </div>
          <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">AI PRACUJE</h2>
          <p className="text-blue-500 font-black uppercase tracking-[0.3em] text-xs">Trwa skanowanie bąbelków...</p>
          <p className="mt-8 text-slate-500 max-w-xs text-sm font-medium">To zazwyczaj trwa od 10 do 20 sekund. System analizuje każdy piksel rysunku.</p>
        </div>
      )}
    </div>
  );
};

export default App;
