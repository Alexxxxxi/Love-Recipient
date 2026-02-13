
import React, { useRef, useState, useMemo } from 'react';
import { ReceiptData, ReceiptLine } from '../types';
import TypewriterLine from './TypewriterLine';
import html2canvas from 'html2canvas';
import { Loader2 } from 'lucide-react';

interface ReceiptProps {
  data: ReceiptData;
  visibleLines: ReceiptLine[];
  isFinished: boolean;
  onReset: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ data, visibleLines, isFinished, onReset }) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // 生成小票内部的背景贴纸 (增加多样性和数量)
  const stickers = useMemo(() => {
    const icons = ['❤️', '✨', '🌸', '⭐', '🕊️', '🧸', '🍭', '🎀', '💌', '🐾', '🦋', '💍'];
    return Array.from({ length: 16 }).map((_, i) => ({
      id: i,
      icon: icons[Math.floor(Math.random() * icons.length)],
      top: `${Math.random() * 92}%`,
      left: `${Math.random() * 85}%`,
      rotation: `${Math.random() * 360}deg`,
      size: `${18 + Math.random() * 26}px`,
    }));
  }, []);

  const handleTearOff = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `甜蜜存根-${data.userName || '心动瞬间'}.jpg`;
      // 使用 image/jpeg 格式，并设置 0.9 的质量
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
      alert("❤️ 存根已下载！\n这份约定已存入你们的时光宝盒。");
    } catch (error) {
      console.error('下载失败:', error);
      alert("保存失败，请截图保留这份浪漫。");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div 
        ref={receiptRef}
        className={`w-full bg-white shadow-[0_15px_40px_rgba(0,0,0,0.12)] flex flex-col p-6 pt-12 pb-14 transition-all duration-1000 ease-out origin-top overflow-hidden jagged-top jagged-bottom relative`}
      >
        {/* 小票背景装饰贴纸 (透明度提升至 0.35) */}
        {stickers.map(s => (
          <div
            key={s.id}
            className="absolute pointer-events-none select-none z-0 opacity-[0.35]"
            style={{
              top: s.top,
              left: s.left,
              transform: `rotate(${s.rotation})`,
              fontSize: s.size,
            }}
          >
            {s.icon}
          </div>
        ))}

        {/* 页眉 */}
        <div className="text-center mb-6 space-y-1 relative z-10">
          <div className="text-xs text-[#ff4d6d] font-bold mb-1 tracking-widest">MEMORY VOUCHER</div>
          <h2 className="text-2xl font-bold tracking-[0.4em] border-b-2 border-[#2c2c2c] pb-4 mb-2 text-[#2c2c2c]">甜蜜存根</h2>
          
          <div className="flex flex-col items-center mt-2 opacity-90">
             <div className="text-[10px] mono-font uppercase tracking-tighter text-[#666]">Recipient / 专属对象</div>
             <div className="text-sm font-bold border-b border-black/10 px-4 min-w-[140px] pb-1 mt-1 text-[#2c2c2c]">
               {data.userName}
             </div>
          </div>
          
          <p className="text-[10px] opacity-40 mono-font mt-4 italic text-[#2c2c2c]">2026情人节限定 / 存根号: MEM-2026-0214</p>
        </div>

        {/* 照片区域 */}
        {data.imageUrl && (
          <div className="w-full aspect-[4/5] mb-8 border-4 border-double border-[#2c2c2c]/15 p-1 bg-[#fff] relative z-10 shadow-sm">
             <img 
               src={data.imageUrl} 
               alt="甜蜜瞬间" 
               className="w-full h-full object-cover thermal-img"
             />
          </div>
        )}

        {/* 内容区域 */}
        <div className="flex flex-col space-y-4 text-[13px] leading-relaxed mono-font px-2 relative z-10">
          {visibleLines.map((line) => (
            <div key={line.id} className="min-h-[1.5em]">
              {line.type === 'DIVIDER' ? (
                <div className="py-2 text-center opacity-30 tracking-widest text-[#2c2c2c]">————————————————————————</div>
              ) : line.type === 'ITEM' || line.type === 'TOTAL' || line.type === 'PRICE' ? (
                <div className="flex justify-between font-bold pt-2 border-t border-dashed border-[#2c2c2c]/10 mt-2 text-[#2c2c2c]">
                  <TypewriterLine text={line.text} />
                </div>
              ) : (
                <div className={`italic ${line.type === 'SYSTEM' ? 'text-[#a04040]' : 'text-[#2c2c2c] opacity-85'}`}>
                  <TypewriterLine text={line.text} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 条形码与页脚 */}
        {isFinished && (
          <div className="mt-12 flex flex-col items-center animate-in fade-in zoom-in duration-1000 relative z-20">
            <div className="flex space-x-[2px] h-10 w-full justify-center mb-6 opacity-90 px-8">
              {[...Array(30)].map((_, i) => (
                <div 
                  key={i} 
                  className="bg-[#2c2c2c]" 
                  style={{ width: `${[1, 3, 1, 5, 2][i % 5]}px` }}
                />
              ))}
            </div>
            
            <button 
              onClick={handleTearOff}
              disabled={isDownloading}
              className={`swinging bg-[#2c2c2c] text-white text-[11px] px-8 py-4 rounded-sm tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 flex items-center gap-2 ${isDownloading ? 'opacity-50' : ''}`}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  正在保存存根...
                </>
              ) : (
                '签署并珍藏此份约定 ✂️'
              )}
            </button>
          </div>
        )}
      </div>

      {isFinished && (
        <button 
          onClick={onReset}
          className="my-10 text-[#a08080] text-xs underline underline-offset-8 opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1 mb-20"
        >
          重新开启浪漫记忆
        </button>
      )}
    </div>
  );
};

export default Receipt;
