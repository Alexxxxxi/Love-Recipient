
import React from 'react';

const PrintingSlot: React.FC = () => {
  return (
    <div className="w-full max-w-[280px] h-4 bg-[#2c2c2c] rounded-full shadow-inner relative z-20">
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent rounded-full opacity-50"></div>
      {/* Light indicator */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e] animate-pulse"></div>
    </div>
  );
};

export default PrintingSlot;
