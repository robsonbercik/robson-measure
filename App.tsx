
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
      console.log('Skopiowano:', text);
    });
  };

  const cleanupText = (text: string) => {
    // Agresywne usuwanie słów opisowych dla czystego zapisu technicznego.
    return text
      .replace(/thickness/gi, '')
      .replace(/break edge/gi, '')
      .replace(/chamfer/gi, '')
      .replace(/radius/gi, '')
      .replace(/linear/gi, '')
      .replace(/basic dimension/gi, '')
      .replace(/basic/gi, '')
      .replace(/dimension/gi, '')
      .replace(/typical/gi, '')
      .replace(/typ\./gi, '')
      .replace(/places/gi, '')
      .replace(/datum/gi, '')
      .replace(/weld/gi, '')
      .replace(/spoin/gi, '')
      .replace(/fillet/gi, '')
      .replace(/a=/gi, 'a')
      .replace(/z=/gi, 'z')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const getISOSymbol = (char: string) => {
    const c = char.toLowerCase();
    if (c.includes('profile of a line') || c.includes('line profile')) return "⌒";
    if (c.includes('profile of a surface') || c.includes('surface profile')) return "⌢";
    if (c.includes('position') || c.includes('⌖')) return "⌖";
    if (c.includes('perpendicularity') || c.includes('⊥')) return "⊥";
    if (c.includes('parallelism') || c.includes('//')) return "∥";
    if (c.includes('flatness') || c.includes('⏥')) return "⏥";
    if (c.includes('concentricity') || c.includes('◎')) return "◎";
    if (c.includes('angularity') || c.includes('∠')) return "∠";
    if (c.includes('circularity') || c.includes('roundness')) return "○";
    if (c.includes('cylindricity')) return "⌭";
    if (c.includes('straightness')) return "⏤";
    if (c.includes('total runout')) return "⌗";
    if (c.includes('runout')) return "↗";
    if (c.includes('ø') || c.includes('diameter')) return "⌀";
    
    // Spoiny
    if (c.includes('△') || c.includes('pachwin')) return "△";
    if (c.includes('⌵') || c.includes('v weld')) return "⌵";
    
    return "";
  };

  const formatISOGDT = (char: string) => {
    // Jeśli AI już dostarczyło idealny format (np. a4 △ 45x4.9 (L-M)), czyścimy tylko resztki tekstu.
    if (char.includes('△') || char.includes('⌵')) {
      return cleanupText(char);
    }

    const symbol = getISOSymbol(char);
    const cleaned = cleanupText(char)
      .replace(/profile of a line/gi, '')
      .replace(/profile of a surface/gi, '')
      .replace(/position/gi, '')
      .replace(/perpendicularity/gi, '')
      .replace(/parallelism/gi, '')
      .replace(/flatness/gi, '')
      .replace(/concentricity/gi, '')
      .replace(/angularity/gi, '')
      .replace(/circularity/gi, '')
      .replace(/cylindricity/gi, '')
      .replace(/straightness/gi, '')
      .replace(/runout/gi, '')
      .replace(/diameter/gi, '')
      .replace(/ø/gi, '')
      .trim();
    
    if (!symbol) return cleaned;

    // Specjalne traktowanie spoin, jeśli symbol został wykryty ale nie ma go w tekście.
    if (symbol === "△" || symbol === "⌵") {
       return `${cleaned.startsWith('a') || cleaned.startsWith('z') ? '' : 'a'}${cleaned.replace(symbol, '').trim()} ${symbol}`;
    }

    // GD&T Format: Symbol | Wartość | Baza
    const parts = cleaned.split(' ').filter(p => p.length > 0);
    const value = parts[0] || "";
    const datum = parts.slice(1).join(' ').toUpperCase();

    if (value && symbol !== "⌀") {
      return `${symbol} | ${value}${datum ? ` | ${datum}` : ''}`;
    }

    if (symbol === "⌀") return `${symbol}${cleaned}`;
    
    return `${symbol} ${cleaned}`;
  };

  const CopyBtn = ({ text }: { text: string }) => (
    <button 
      onClick={() => copyToClipboard(text)}
      className="ml-2 p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all shrink-0"
      title="Kopiuj"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
    </button>
  );

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-xl w-full bg-white p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 text-center">
          <div className="mb-12">
            <h1 className="text-6xl font-black tracking-tighter text-slate-900 mb-2">
              Robsonbercik<span className="text-blue-600">.</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">Advanced Metrology Solutions</p>
          </div>

          <button 
            onClick={() => setIsStarted(true)}
            className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-7 rounded-[1.5rem] text-2xl transition-all shadow-xl hover:shadow-blue-200 active:scale-[0.97]"
          >
            Uruchom System
          </button>
          
          <div className="mt-10 pt-8 border-t border-slate-50 flex justify-center gap-8 text-[9px] uppercase font-black text-slate-300 tracking-widest">
            <span>ISO 1101</span>
            <span>WELD ISO 2553</span>
            <span>GD&T ASME</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      <header className="bg-white/80 backdrop-blur-md px-8 py-5 flex justify-between items-center border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-3">
           <div className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-lg italic shadow-md">R</div>
           <h1 className="font-bold text-xl tracking-tight text-slate-800">Robsonbercik <span className="text-blue-600">Measure</span></h1>
        </div>
        <button 
          onClick={() => { setIsStarted(false); setDrawingData(null); }} 
          className="text-slate-400 hover:text-red-600 px-4 py-2 rounded-xl font-bold text-[10px] uppercase transition-all tracking-wider"
        >
          Zamknij panel
        </button>
      </header>

      <main className="flex-1 p-8 overflow-y-auto">
        {errorMessage && (
          <div className="max-w-4xl mx-auto bg-red-50 border border-red-100 text-red-600 p-5 mb-8 rounded-2xl font-medium text-sm flex items-center gap-4 shadow-sm">
            <span className="text-2xl">🚨</span> {errorMessage}
          </div>
        )}

        {!drawingData ? (
          <div className="flex flex-col items-center justify-center mt-20">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-2xl bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-24 cursor-pointer hover:border-blue-500 hover:bg-blue-50/10 transition-all text-center group shadow-sm"
            >
              <div className="text-8xl mb-8 group-hover:scale-110 transition-transform inline-block">📁</div>
              <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Wczytaj Rysunek</h2>
              <p className="text-slate-400 text-sm font-medium">Analiza bąbelków i charakterystyk technicznych</p>
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
          <div className="grid lg:grid-cols-2 gap-12 max-w-[1800px] mx-auto items-start">
             <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-200 sticky top-28">
                <div className="overflow-hidden rounded-[1.5rem] bg-slate-50 border border-slate-100">
                  <img src={previewImage!} className="w-full h-auto object-contain max-h-[70vh]" alt="Technical Drawing" />
                </div>
             </div>
             
             <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-10 pb-10 border-b border-slate-100">
                   <div>
                      <h2 className="text-4xl font-extrabold text-slate-900 leading-tight mb-3 tracking-tight">{drawingData.partName}</h2>
                      <div className="flex gap-6">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em]">Numer Rysunku</span>
                          <span className="text-sm font-bold text-slate-900">{drawingData.drawingNumber}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em]">Data Pomiaru</span>
                          <span className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString()}</span>
                        </div>
                      </div>
                   </div>
                   <button 
                     onClick={() => setDrawingData(null)}
                     className="bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all tracking-widest border border-slate-100"
                   >
                     Zmień
                   </button>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] tracking-[0.2em] font-black">
                        <th className="p-6 border-b border-slate-100 text-left w-20">Lp</th>
                        <th className="p-6 border-b border-slate-100 text-left">Charakterystyka ISO</th>
                        <th className="p-6 border-b border-slate-100 text-center">W1</th>
                        <th className="p-6 border-b border-slate-100 text-center">W2</th>
                        <th className="p-6 border-b border-slate-100 text-center">W3</th>
                      </tr>
                    </thead>
                    <tbody className="text-[14px] text-slate-800">
                      {drawingData.dimensions.map((d, i) => {
                        const formattedChar = formatISOGDT(d.characteristic);
                        return (
                          <tr key={i} className="hover:bg-blue-50/20 transition-colors border-b border-slate-50 last:border-none">
                            <td className="p-6 font-black text-slate-200 text-lg">{d.balloonId}</td>
                            <td className="p-6">
                              <div className="flex items-center">
                                <span className="font-medium text-slate-900">{formattedChar}</span>
                                <CopyBtn text={formattedChar} />
                              </div>
                            </td>
                            <td className="p-6 text-center">
                              <div className="flex items-center justify-center">
                                <span className="font-medium text-slate-900">{d.results[0]}</span>
                                <CopyBtn text={d.results[0]} />
                              </div>
                            </td>
                            <td className="p-6 text-center">
                              <div className="flex items-center justify-center">
                                <span className="font-medium text-slate-900">{d.results[1] || d.results[0]}</span>
                                <CopyBtn text={d.results[1] || d.results[0]} />
                              </div>
                            </td>
                            <td className="p-6 text-center">
                              <div className="flex items-center justify-center">
                                <span className="font-medium text-slate-900">{d.results[2] || d.results[0]}</span>
                                <CopyBtn text={d.results[2] || d.results[0]} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <p className="mt-10 text-[11px] text-slate-400 font-bold uppercase tracking-widest text-center opacity-60">
                   RobsonbercikComputers © 2025
                </p>
             </div>
          </div>
        )}
      </main>

      {state === AppState.ANALYZING && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[500] flex flex-col items-center justify-center text-center p-12">
          <div className="relative w-32 h-32 mb-12">
            <div className="absolute inset-0 border-[6px] border-blue-500/10 rounded-full"></div>
            <div className="absolute inset-0 border-[6px] border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-4 border-[6px] border-white/5 border-b-transparent rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
          </div>
          <div className="space-y-4">
            <h2 className="text-5xl font-black text-white tracking-tighter italic">RobsonbercikComputers</h2>
            <p className="text-blue-400 font-black uppercase text-2xl tracking-[0.2em] animate-pulse">
              work it for U
            </p>
          </div>
          <div className="mt-16 bg-white/5 px-8 py-3 rounded-full text-[10px] text-white/40 font-bold uppercase tracking-[0.5em]">
            ISO WELD & GD&T ANALYSIS
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
