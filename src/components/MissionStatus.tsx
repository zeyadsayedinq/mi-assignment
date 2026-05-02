import React, { useEffect, useState } from 'react';
import { Terminal, BrainCircuit, Key, ShieldAlert, Cpu, Radio, Network } from 'lucide-react';
import { motion } from 'motion/react';

const MatrixRain = () => {
  const [drops, setDrops] = useState<string[]>([]);
  useEffect(() => {
    let mounted = true;
    const chars = 'MI 01 OP_CENTER UPLINK NEURAL SOLVE TASK';
    const interval = setInterval(() => {
      if (!mounted) return;
      setDrops(Array(20).fill(0).map(() => {
        const parts = chars.split(' ');
        return parts[Math.floor(Math.random() * parts.length)];
      }));
    }, 150);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden opacity-[0.03] pointer-events-none flex whitespace-nowrap z-0">
      <div className="w-full text-[#00FFFF] font-mono text-[10px] sm:text-xs leading-none tracking-widest opacity-80"
        style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>
        {drops.map((drop, i) => <span key={i} className="mx-1 sm:mx-2 md:mx-4 inline-block">{drop}</span>)}
      </div>
    </div>
  );
};

export function MissionStatus({ status }: { status: 'analyzing' | 'complete' }) {
  const [logs, setLogs] = useState<{ text: string; icon: any }[]>([]);

  useEffect(() => {
    if (status !== 'analyzing') return;
    const entries = [
      { text: 'Initializing Mi Neural Terminal v3.0...', icon: Terminal },
      { text: 'Neural network synchronized.', icon: Network },
      { text: 'Academic context analysis in progress...', icon: Key },
      { text: 'Assignment type detected successfully.', icon: ShieldAlert },
      { text: 'Routing to Mi AI Engine (Claude)...', icon: BrainCircuit },
      { text: 'Executing structured output reasoning layer...', icon: Cpu },
      { text: 'Finalization protocol armed.', icon: Radio },
      { text: 'Formulating student-authentic solution...', icon: Terminal },
    ];
    let i = 0;
    const timer = setInterval(() => {
      if (i < entries.length) { setLogs(prev => [...prev, entries[i]]); i++; }
      else clearInterval(timer);
    }, 900);
    return () => clearInterval(timer);
  }, [status]);

  return (
    <div className="w-full bg-[#0A0B0E] border border-[#00FFFF44] font-mono flex flex-col relative z-20 shadow-[0_0_25px_#00FFFF15] rounded-sm overflow-hidden">
      <MatrixRain />
      <div className="bg-[#050608]/80 backdrop-blur-md px-5 py-4 border-b border-[#00FFFF22] flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3 text-[#00FFFF]">
          <Terminal className="w-5 h-5 drop-shadow-[0_0_5px_#00FFFF]" />
          <span className="uppercase tracking-widest text-xs font-bold">MI TERMINAL — NEURAL EXECUTION</span>
        </div>
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-none border border-gray-600 bg-gray-800 transform rotate-45" />
          <div className="w-3 h-3 rounded-none border border-gray-600 bg-gray-800 transform rotate-45" />
          <div className="w-3 h-3 rounded-none bg-[#00FFFF] shadow-[0_0_10px_#00FFFF] transform rotate-45" />
        </div>
      </div>
      <div className="bg-[#0A0B0E]/60 p-6 min-h-[400px] h-full text-sm flex flex-col gap-3 relative z-10">
        {logs.map((log, i) => {
          const Icon = log?.icon || Terminal;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              className="flex items-center gap-4 bg-[#00FFFF05] border border-[#00FFFF22] rounded-sm p-4 w-full relative overflow-hidden group shadow-[0_0_15px_#00FFFF05]">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00FFFF] opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="w-10 h-10 border border-[#00FFFF44] bg-[#00FFFF0a] rounded flex justify-center items-center shrink-0">
                <Icon className="w-5 h-5 text-[#00FFFF]" />
              </div>
              <div className="flex flex-col flex-1 truncate">
                <span className="text-[#00FFFF] text-[10px] tracking-widest uppercase mb-1 opacity-70">[LOCAL_HOST]</span>
                <span className={i === logs.length - 1 ? 'text-white font-bold tracking-wide' : 'text-gray-400 tracking-wide'}>
                  {log.text.toUpperCase()}
                </span>
              </div>
              <div className="text-[10px] text-gray-600 hidden sm:block tracking-widest">SYS_OK</div>
            </motion.div>
          );
        })}
        <div className="flex items-center gap-3 mt-6 text-[#00FFFF] animate-pulse bg-gradient-to-r from-[#00FFFF0a] to-transparent p-4 border-l-2 border-[#00FFFF]">
          <BrainCircuit className="w-5 h-5" />
          <span className="uppercase text-xs tracking-[0.2em] font-bold">Mi Processing Array Engaged <span className="animate-blink">_</span></span>
        </div>
      </div>
      <div className="h-[2px] w-full bg-[#1a1c22] relative z-10">
        <motion.div className="h-full bg-gradient-to-r from-[#22D3EE] to-[#A855F7] shadow-[0_0_10px_#00FFFF]"
          initial={{ width: '0%' }} animate={{ width: '95%' }} transition={{ duration: 15, ease: 'linear' }} />
      </div>
    </div>
  );
}
