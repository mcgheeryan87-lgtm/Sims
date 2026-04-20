import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Utensils, 
  Moon, 
  Users, 
  Gamepad2, 
  Trash2, 
  ShowerHead as Shower, 
  Clock, 
  MessageCircle, 
  Tv, 
  Coffee,
  MoreVertical,
  Plus
} from 'lucide-react';
import { SimStats, Sim, GameObject, Need } from './types.ts';
import { DECAY_RATES, REPLENISH_RATES, GRID_SIZE, TILE_SIZE } from './constants.ts';
import { getSimThoughts, useAIPoweredTelevision } from './services/geminiService.ts';

const OBJECTS: GameObject[] = [
  { id: 'fridge', name: 'Refrigerator', type: 'appliance', position: { x: 2, y: 2 }, actions: ['Eat Snack'] },
  { id: 'bed', name: 'Basic Bed', type: 'furniture', position: { x: 7, y: 2 }, actions: ['Sleep'] },
  { id: 'shower', name: 'Shower', type: 'plumbing', position: { x: 2, y: 7 }, actions: ['Quick Shower'] },
  { id: 'sofa', name: 'Comfort Sofa', type: 'furniture', position: { x: 5, y: 5 }, actions: ['Watch AI TV', 'Nap'] },
  { id: 'desk', name: 'Study Desk', type: 'furniture', position: { x: 8, y: 8 }, actions: ['Browse Web'] },
];

const INITIAL_STATS: SimStats = {
  hunger: 80,
  energy: 70,
  social: 50,
  hygiene: 90,
  fun: 60,
  bladder: 100,
};

export default function App() {
  const [sim, setSim] = useState<Sim>({
    name: "Alex",
    stats: INITIAL_STATS,
    position: { x: 5, y: 5 },
    action: null,
    mood: "Fine",
  });
  const [queuedAction, setQueuedAction] = useState<string | null>(null);
  const [thought, setThought] = useState<string>("Sul sul! Welcome to SimsLife.");
  const [tvContent, setTvContent] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  
  // Game Loop
  useEffect(() => {
    const timer = setInterval(() => {
      setSim(prev => {
        const newStats = { ...prev.stats };
        
        // Decay
        (Object.keys(DECAY_RATES) as Array<keyof SimStats>).forEach(key => {
          newStats[key] = Math.max(0, newStats[key] - DECAY_RATES[key]);
        });
        
        // Replenish if active
        if (prev.action) {
          if (prev.action === 'Eat Snack') newStats.hunger = Math.min(100, newStats.hunger + 2);
          if (prev.action === 'Sleep') newStats.energy = Math.min(100, newStats.energy + 1.5);
          if (prev.action === 'Quick Shower') newStats.hygiene = Math.min(100, newStats.hygiene + 5);
          if (prev.action === 'Watch AI TV' || prev.action === 'Browse Web') newStats.fun = Math.min(100, newStats.fun + 1);
        }

        return { ...prev, stats: newStats };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // AI Thoughts Trigger
  useEffect(() => {
    if (Math.random() > 0.8) {
      triggerThought();
    }
  }, [sim.action]);

  const triggerThought = async () => {
    setIsThinking(true);
    const newThought = await getSimThoughts(sim.stats, sim.action);
    setThought(newThought);
    setIsThinking(false);
  };

  const handleAction = async (action: string, targetPos: { x: number, y: number }) => {
    setQueuedAction(action);
    // Move to target
    setSim(prev => ({ ...prev, position: targetPos }));
    
    // Set active action after "walking"
    setTimeout(() => {
      setSim(prev => ({ ...prev, action: action }));
      setQueuedAction(null);
      
      if (action === 'Watch AI TV') {
        watchTV();
      }
    }, 1500);
  };

  const watchTV = async () => {
    setTvContent("Tuning in...");
    const content = await useAIPoweredTelevision("latest science inventions");
    setTvContent(content);
  };

  const stopAction = () => {
    setSim(prev => ({ ...prev, action: null }));
    setTvContent(null);
  };

  // Isometric helpers
  const toIso = (x: number, y: number) => {
    const isoX = (x - y) * (TILE_SIZE / 2);
    const isoY = (x + y) * (TILE_SIZE / 4);
    return { x: isoX, y: isoY };
  };

  const getStatColor = (val: number) => {
    if (val > 60) return 'bg-lime-500';
    if (val > 30) return 'bg-amber-400';
    return 'bg-rose-500';
  };

  return (
    <div className="min-h-screen game-bg font-sans overflow-hidden relative">
      {/* Top Bar - Repositioned to overlay */}
      <div className="absolute top-6 right-6 flex gap-4 z-40">
        <div className="currency-pill px-5 py-2 rounded-full font-bold flex items-center gap-2 text-sm">
          § <span className="text-[#4AF012]">42,850</span>
        </div>
        <div className="bg-white/90 backdrop-blur-md px-5 py-2 rounded-full border-2 border-white shadow-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-700">Tuesday 10:42 AM</span>
        </div>
      </div>

      {/* Game World - Perspective */}
      <main className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative pointer-events-auto" style={{ transform: 'scale(1.2)' }}>
          {/* Floor Grid */}
          <div className="relative">
            {Array.from({ length: GRID_SIZE }).map((_, i) => (
              Array.from({ length: GRID_SIZE }).map((_, j) => {
                const pos = toIso(i, j);
                return (
                  <div 
                    key={`${i}-${j}`}
                    className="absolute border border-white/20 -z-10"
                    style={{ 
                      width: TILE_SIZE, 
                      height: TILE_SIZE, 
                      left: pos.x, 
                      top: pos.y,
                      transform: 'rotateX(60deg) rotateZ(45deg)',
                      backgroundColor: (i + j) % 2 === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'
                    }}
                  />
                );
              })
            ))}
          </div>

          {/* Objects */}
          {OBJECTS.map(obj => {
            const pos = toIso(obj.position.x, obj.position.y);
            return (
              <div 
                key={obj.id}
                className="absolute cursor-pointer group"
                style={{ left: pos.x + TILE_SIZE/4, top: pos.y - TILE_SIZE/4 }}
                onClick={() => handleAction(obj.actions[0], obj.position)}
              >
                {/* Object Sprite (Simple shapes) */}
                <div className="relative w-12 h-12 flex flex-col items-center justify-end">
                   <div className="absolute inset-0 bg-black/10 blur-sm transform scale-x-150 rotate-45 -z-10" />
                   {obj.id === 'fridge' && <div className="w-10 h-14 bg-white border-2 border-slate-200 rounded-sm shadow-sm" />}
                   {obj.id === 'bed' && <div className="w-14 h-8 bg-blue-100 border-2 border-blue-200 rounded-sm shadow-sm" />}
                   {obj.id === 'shower' && <div className="w-10 h-16 bg-white/40 border-2 border-white/60 rounded-sm" />}
                   {obj.id === 'sofa' && <div className="w-16 h-8 bg-slate-200 border-2 border-white rounded-lg shadow-sm" />}
                   {obj.id === 'desk' && <div className="w-12 h-10 bg-slate-100 border-2 border-white rounded-sm shadow-sm" />}
                   
                   <div className="hidden group-hover:block absolute -top-12 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded-lg shadow-lg text-[10px] font-bold whitespace-nowrap z-50 border border-slate-100">
                     {obj.name}
                   </div>
                </div>
              </div>
            );
          })}

          {/* Sim character */}
          <motion.div 
            className="absolute z-20"
            initial={false}
            animate={{ 
              left: toIso(sim.position.x, sim.position.y).x + TILE_SIZE/2, 
              top: toIso(sim.position.x, sim.position.y).y - TILE_SIZE/4 
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          >
            {/* Plumbob */}
            <motion.div 
              className="w-4 h-6 bg-[#4AF012] plumbob-glow absolute -top-20 left-1/2 -translate-x-1/2"
              style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
              animate={{ rotateY: 360, y: [0, -5, 0] }}
              transition={{ rotateY: { duration: 3, repeat: Infinity, ease: 'linear' }, y: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }}
            />
            
            {/* Character Body - Sleek Rounded Shape */}
            <div className="w-10 h-20 bg-[#333] rounded-[30px_30px_10px_10px] relative shadow-[10px_10px_0_rgba(0,0,0,0.1)]">
              {sim.action && (
                <div className="absolute -right-16 top-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-bold border-2 border-white shadow-xl flex items-center gap-1 z-50">
                  <div className="w-2 h-2 bg-[#007AFF] rounded-full animate-pulse" />
                  {sim.action}...
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Action Queue - Sleek interface style */}
      <div className="absolute bottom-[140px] left-8 flex flex-col-reverse gap-3 z-40">
        <AnimatePresence>
          {sim.action && (
            <motion.div 
              initial={{ scale: 0, x: -20, opacity: 0 }}
              animate={{ scale: 1, x: 0, opacity: 1 }}
              exit={{ scale: 0, x: -20, opacity: 0 }}
              className="w-14 h-14 bg-white rounded-xl border-2 border-[#007AFF] shadow-lg flex items-center justify-center text-2xl relative group cursor-pointer"
              onClick={stopAction}
            >
              {sim.action === 'Eat Snack' && "🍳"}
              {sim.action === 'Sleep' && "💤"}
              {sim.action === 'Quick Shower' && "🚿"}
              {sim.action === 'Watch AI TV' && "📺"}
              {sim.action === 'Browse Web' && "🌐"}
              <div className="absolute -top-10 left-full ml-3 bg-[#007AFF] text-white text-[10px] px-2 py-1 rounded hidden group-hover:block whitespace-nowrap">Cancel Action</div>
            </motion.div>
          )}
          {queuedAction && (
            <motion.div 
              initial={{ scale: 0, x: -20, opacity: 0 }}
              animate={{ scale: 0.9, x: 0, opacity: 0.6 }}
              className="w-14 h-14 bg-white rounded-xl border-2 border-slate-300 shadow-sm flex items-center justify-center text-xl grayscale"
            >
               {queuedAction === 'Eat Snack' && "🍳"}
               {queuedAction === 'Sleep' && "💤"}
               {queuedAction === 'Quick Shower' && "🚿"}
               {queuedAction === 'Watch AI TV' && "📺"}
               {queuedAction === 'Browse Web' && "🌐"}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* HUD Bottom Panel */}
      <div className="absolute bottom-6 left-6 right-6 h-[110px] hud-glass rounded-2xl z-50 flex items-center px-6 gap-6">
        {/* Sim Info */}
        <div className="flex items-center gap-4 border-r border-slate-300 pr-6 h-16">
          <div className="w-16 h-16 rounded-full bg-slate-200 border-4 border-white shadow-inner relative overflow-hidden flex items-center justify-center">
             <Users className="w-8 h-8 text-slate-400" />
             <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#4AF012] border-2 border-white rounded-full" title="Happy" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-bold text-lg text-slate-800 leading-tight">{sim.name} Johnson</h2>
            <span className="text-xs font-bold text-[#4AF012] uppercase tracking-tighter">Inspired</span>
          </div>
        </div>

        {/* Needs Panel - Grid Layout */}
        <div className="flex-1 grid grid-cols-3 gap-x-8 gap-y-2">
          {(Object.entries(sim.stats) as Array<[keyof SimStats, number]>).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center pr-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-tight">{key}</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full border border-white shadow-inner overflow-hidden">
                <motion.div 
                   className="h-full rounded-full transition-colors duration-500" 
                   animate={{ 
                     width: `${value}%`,
                     backgroundColor: value > 60 ? '#4AF012' : value > 30 ? '#FFD600' : '#FF3B30'
                   }} 
                />
              </div>
            </div>
          ))}
        </div>

        {/* Time Controls */}
        <div className="flex items-center gap-2 bg-slate-100/50 p-2 rounded-xl border border-white">
          <button className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm">||</button>
          <button className="w-8 h-8 rounded-lg bg-[#007AFF] flex items-center justify-center text-xs font-bold text-white shadow-md">▶</button>
          <button className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm">▶▶</button>
          <button className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm">▶▶▶</button>
        </div>

        {/* Home/Build Mode */}
        <div className="flex gap-2">
          <button className="w-11 h-11 rounded-full bg-white border-2 border-white shadow-lg flex items-center justify-center text-xl hover:scale-105 transition-transform">🏠</button>
          <button className="w-11 h-11 rounded-full bg-white border-2 border-white shadow-lg flex items-center justify-center text-xl hover:scale-105 transition-transform">🛠️</button>
        </div>
      </div>

      {/* Thought Bubble - Overlaid lightly */}
      <AnimatePresence>
        {!sim.action && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-36 right-8 max-w-xs p-4 bg-white/80 backdrop-blur-md rounded-2xl border-2 border-white shadow-2xl z-30"
          >
            <div className="flex items-start gap-3">
              <MessageCircle className="w-4 h-4 text-[#007AFF] mt-1 shrink-0" />
              <p className="text-xs italic text-slate-600 leading-relaxed font-medium">"{thought}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TV Subtitles Overlay */}
      {tvContent && sim.action === 'Watch AI TV' && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-lg z-50 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/60 backdrop-blur-sm p-4 rounded-xl text-white text-sm font-medium border border-white/20"
          >
             <span className="text-rose-400 font-bold block text-[10px] uppercase mb-1 tracking-widest leading-none">SimTube Grounding</span>
             {tvContent}
          </motion.div>
        </div>
      )}
    </div>
  );
}
