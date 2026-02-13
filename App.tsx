
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Camera, Heart, Loader2, AlertCircle, Info } from 'lucide-react';
import { AppState, ReceiptLine, ReceiptData } from './types';
import { COPY_LIBRARY, PRINT_SPEED, ERROR_MESSAGES } from './constants';
import Receipt from './components/Receipt';
import PrintingSlot from './components/PrintingSlot';

declare const FaceDetection: any;

const shuffleArray = <T,>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const BackgroundParticles: React.FC = () => {
  const particles = useMemo(() => {
    const types = ['❤️', '🌸', '✨', '⭐', '🕊️', '🍬'];
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 15}s`,
      duration: `${15 + Math.random() * 20}s`,
      size: `${20 + Math.random() * 45}px`,
      type: types[Math.floor(Math.random() * types.length)]
    }));
  }, []);

  return (
    <>
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            fontSize: p.size,
            opacity: 0.35,
          }}
        >
          {p.type}
        </div>
      ))}
    </>
  );
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [userName, setUserName] = useState<string>('');
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [visibleLines, setVisibleLines] = useState<ReceiptLine[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'info' | 'success', text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printIntervalRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const faceDetectionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof FaceDetection !== 'undefined') {
      const faceDetection = new FaceDetection({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
      });
      faceDetection.setOptions({
        model: 'short',
        minDetectionConfidence: 0.5
      });
      faceDetectionRef.current = faceDetection;
    }
  }, []);

  const triggerShake = useCallback(() => {
    setIsShaking(true);
    if ("vibrate" in navigator) navigator.vibrate(50);
    setTimeout(() => setIsShaking(false), 150);
  }, []);

  const generateLines = (name: string): ReceiptLine[] => {
    const lines: ReceiptLine[] = [];
    let delay = 0;

    const injectName = (text: string) => text.replace(/你们/g, `${name}`).replace(/属于/g, `属于 ${name} 的`);

    const shuffledSystem = shuffleArray(COPY_LIBRARY.SYSTEM);
    lines.push({ id: 'sys1', type: 'SYSTEM', text: injectName(shuffledSystem[0]), delay });
    delay += PRINT_SPEED;
    lines.push({ id: 'sys2', type: 'SYSTEM', text: injectName(shuffledSystem[1]), delay });
    delay += PRINT_SPEED;

    const shuffledIngredients = shuffleArray(COPY_LIBRARY.INGREDIENT);
    shuffledIngredients.slice(0, 4).forEach((text, i) => {
      lines.push({ id: `ing${i}`, type: 'INGREDIENT', text, delay });
      delay += PRINT_SPEED;
    });

    const randomAnalysis = COPY_LIBRARY.ANALYSIS[Math.floor(Math.random() * COPY_LIBRARY.ANALYSIS.length)];
    lines.push({ id: 'ana1', type: 'ANALYSIS', text: injectName(randomAnalysis), delay });
    delay += PRINT_SPEED;

    lines.push({ id: 'div1', type: 'DIVIDER', text: '--------------------------', delay });
    delay += 400;
    lines.push({ id: 'item1', type: 'ITEM', text: `签署人: ${name}`, delay });
    delay += 600;

    const randomPrice = COPY_LIBRARY.PRICE[Math.floor(Math.random() * COPY_LIBRARY.PRICE.length)];
    lines.push({ id: 'price1', type: 'PRICE', text: `价值: ${randomPrice}`, delay });
    delay += 400;

    const randomTotal = COPY_LIBRARY.TOTAL[Math.floor(Math.random() * COPY_LIBRARY.TOTAL.length)];
    lines.push({ id: 'total1', type: 'TOTAL', text: `有效期: ${randomTotal}`, delay });
    delay += 800;

    return lines;
  };

  const startPrinting = (imageUrl: string) => {
    const targetName = userName.trim() || '我的挚爱';
    const allLines = generateLines(targetName);
    setReceiptData({ userName: targetName, imageUrl, ingredients: [] });
    setAppState('PRINTING');
    setStatusMsg(null);
    setIsAnalyzing(false);

    let currentLineIndex = 0;
    const printNextLine = () => {
      if (currentLineIndex < allLines.length) {
        setVisibleLines(prev => [...prev, allLines[currentLineIndex]]);
        triggerShake();
        currentLineIndex++;
        const nextDelay = allLines[currentLineIndex]?.delay 
          ? allLines[currentLineIndex].delay - allLines[currentLineIndex - 1].delay 
          : 1000;
        printIntervalRef.current = window.setTimeout(printNextLine, nextDelay);
        if (containerRef.current) {
          containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
        }
      } else {
        setAppState('FINISHED');
      }
    };
    printIntervalRef.current = window.setTimeout(printNextLine, 500);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setStatusMsg({ type: 'info', text: 'AI 正在深度扫描画面的心动信号...' });

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.src = dataUrl;
      img.onload = async () => {
        if (!faceDetectionRef.current) {
          setStatusMsg({ type: 'error', text: '浪漫引擎启动失败，请刷新重试。' });
          setIsAnalyzing(false);
          return;
        }

        faceDetectionRef.current.onResults((results: any) => {
          const faceCount = results.detections ? results.detections.length : 0;
          if (faceCount === 2) {
            setStatusMsg({ type: 'success', text: '回忆匹配成功！正在同步你们的心跳...' });
            setTimeout(() => startPrinting(dataUrl), 800);
          } else {
            let advice = "";
            if (faceCount === 0) {
              advice = "这里似乎还未留下你们的足迹。快上传一张合影，开启这段专属浪漫吧 🍃";
            } else if (faceCount === 1) {
              advice = "怎么只有一个人呢？这张回执正在等待另一个灵魂的出现 ✨";
            } else {
              advice = "这份契约太拥挤啦，快换一张只有你们两人的纯净合影吧 🕊️";
            }
            setStatusMsg({ type: 'error', text: advice });
            setIsAnalyzing(false);
          }
        });

        try {
          await faceDetectionRef.current.send({ image: img });
        } catch (err) {
          setStatusMsg({ type: 'error', text: '画面太糊啦，AI 感应不到你们的甜蜜，换一张试试？' });
          setIsAnalyzing(false);
        }
      };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className={`h-screen flex flex-col relative overflow-hidden ${isShaking ? 'shaking' : ''}`}>
      <BackgroundParticles />
      
      <div className="flex-none pt-12 pb-6 z-30">
        <h1 className="text-3xl font-bold text-[#a04040] tracking-[0.4em] text-center drop-shadow-sm">
          浪漫回执
        </h1>
        <p className="text-center text-[10px] text-[#8c7a6c] mt-1 tracking-widest uppercase opacity-70">
          — 2026 Valentine's Special —
        </p>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto px-6 pb-20 relative scroll-smooth z-10">
        <div className="max-w-xs mx-auto flex flex-col items-center">
          {appState === 'IDLE' && (
            <div className="w-full mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="w-full bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/40 space-y-6">
                <p className="text-sm text-[#5c4a3c] leading-relaxed text-center font-medium">
                  留住此刻的温柔。<br/>请录入昵称并挑选你们的【双人合影】<br/>签署这份专属的浪漫回执。
                </p>
                <input
                  type="text"
                  placeholder="专属昵称 (如：我的女孩)"
                  className="w-full bg-white/40 border-b-2 border-[#ffb3c1] p-3 text-center outline-none focus:border-[#ff4d6d] transition-colors text-sm placeholder:text-[#c0b0a0]"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>

              <PrintingSlot />

              <div className="space-y-4">
                <button
                  onClick={() => !isAnalyzing && fileInputRef.current?.click()}
                  disabled={isAnalyzing}
                  className={`w-full group relative flex items-center justify-center space-x-2 bg-[#ff4d6d] text-white px-8 py-5 rounded-full shadow-lg active:scale-95 transition-all ${isAnalyzing ? 'opacity-50' : 'hover:bg-[#ff758f] shadow-[#ff4d6d]/20'}`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="font-bold tracking-wider">正在感应心动信号...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      <span className="font-bold tracking-wider">签署浪漫记忆</span>
                    </>
                  )}
                </button>

                {statusMsg && (
                  <div className={`flex items-start space-x-2 p-4 rounded-xl text-xs leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300 ${
                    statusMsg.type === 'error' ? 'bg-[#fff5f5] text-[#c53030] border border-[#fed7d7]' : 
                    statusMsg.type === 'success' ? 'bg-[#f0fff4] text-[#2f855a] border border-[#c6f6d5]' : 
                    'bg-[#ebf8ff] text-[#2b6cb0] border border-[#bee3f8]'
                  }`}>
                    {statusMsg.type === 'error' ? <Heart className="w-4 h-4 flex-none mt-0.5 fill-current" /> : <Info className="w-4 h-4 flex-none mt-0.5" />}
                    <span className="font-medium">{statusMsg.text}</span>
                  </div>
                )}
              </div>
              
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
          )}

          {(appState === 'PRINTING' || appState === 'FINISHED') && (
            <div className="w-full mt-4 flex flex-col items-center">
              <div className="sticky top-0 z-20 w-full flex justify-center pb-2">
                <PrintingSlot />
              </div>
              <div className="relative w-full -mt-2">
                 <Receipt 
                   data={receiptData!} 
                   visibleLines={visibleLines} 
                   isFinished={appState === 'FINISHED'}
                   onReset={() => {
                     setAppState('IDLE'); 
                     setVisibleLines([]); 
                     setStatusMsg(null);
                     setIsAnalyzing(false);
                   }}
                 />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
