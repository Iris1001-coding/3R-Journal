import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Mic, Copy, Check, Plus, Calendar, Edit3, Heart, Palette, Sparkles, CalendarDays, Droplet, X, RotateCcw, Target, Archive, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types & Constants ---
interface JournalRecord {
  id: string;
  thoughts: string;
  emotions: string;
  doubts: string;
  timestamp: number;
  intensity: number;
  emotionTag: string;
  keyword?: string;
  type?: string;
  content?: string;
}

interface AppState {
  theme: 'default' | 'pink' | 'purple';
  rewireTask: string;
  rewireStreak: number;
  lastCheckIn: number | null;
  records: JournalRecord[];
  dailyKeyword: { date: string, word: string } | null;
}

const KEYWORDS = [
  'Breathe', 'Flow', 'Grace', 'Resilience', 'Harmony', 'Serenity', 'Clarity', 'Empathy', 'Courage', 'Patience',
  'Gratitude', 'Hope', 'Joy', 'Peace', 'Trust', 'Balance', 'Compassion', 'Forgiveness', 'Growth', 'Healing',
  'Kindness', 'Love', 'Mindfulness', 'Optimism', 'Presence', 'Reflection', 'Renewal', 'Strength', 'Wisdom', 'Wonder'
];

const EMOTIONS = [
  { id: 'neutral', color: 'transparent', label: 'Neutral' },
  { id: 'calm', color: '#e0f2fe', label: 'Calm' },
  { id: 'joy', color: '#fef08a', label: 'Joy' },
  { id: 'energy', color: '#bbf7d0', label: 'Energy' },
  { id: 'melancholy', color: '#e9d5ff', label: 'Melancholy' },
  { id: 'tension', color: '#fecaca', label: 'Tension' },
];

// --- Shared UI Components ---
const NeuCard = ({ children, className = '', pressed = false, onClick }: any) => {
  return (
    <div 
      onClick={onClick}
      className={`rounded-3xl p-6 transition-all duration-300 ${pressed ? 'neu-pressed' : 'neu-flat'} ${className}`}
    >
      {children}
    </div>
  );
};

const NeuButton = ({ children, onClick, className = '', active = false, disabled = false }: any) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const handlePointerDown = () => {
    if (!disabled) {
      setIsPressed(true);
      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
    }
  };
  
  const handlePointerUp = () => {
    if (!disabled) setIsPressed(false);
  };

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`rounded-2xl px-6 py-3 font-bold tracking-wide transition-all duration-150 outline-none flex items-center justify-center
        ${(isPressed || active) ? 'neu-pressed text-[var(--accent-color)]' : 'neu-flat'} 
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}`}
    >
      {children}
    </button>
  );
};

const NeuInput = ({ value, onChange, placeholder, className = '', multiline = false, onMicClick, isRecording, onFocus }: any) => {
  const Component = multiline ? 'textarea' : 'input';
  return (
    <div className="relative w-full">
      <Component
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        placeholder={placeholder}
        className={`w-full rounded-2xl p-4 outline-none neu-pressed bg-transparent resize-none text-inherit placeholder:opacity-50 ${className}`}
        rows={multiline ? 3 : 1}
      />
      {onMicClick && (
        <button 
          onClick={onMicClick}
          className={`absolute right-3 bottom-3 p-2 rounded-full transition-all flex items-center justify-center
            ${isRecording ? 'text-red-500 neu-pressed' : 'text-inherit opacity-60 neu-flat hover:opacity-100'}`}
        >
          <Mic size={20} />
        </button>
      )}
    </div>
  );
};

// --- Hooks ---
const useSpeechRecognition = (onResult: (text: string) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'zh-CN'; 
      rec.onresult = (event: any) => { onResult(event.results[0][0].transcript); setIsRecording(false); };
      rec.onerror = () => setIsRecording(false);
      rec.onend = () => setIsRecording(false);
      recognitionRef.current = rec;
    }
  }, [onResult]);

  const toggleRecording = () => {
    if (isRecording) recognitionRef.current?.stop();
    else { recognitionRef.current?.start(); setIsRecording(true); }
  };

  return { isRecording, toggleRecording, supported: !!recognitionRef.current };
};

// --- Tab Components ---

const BottomTabBar = ({ activeTab, setActiveTab }: any) => {
  const tabs = [
    { id: 'focus', icon: Target, label: 'Focus' },
    { id: 'record', icon: Edit3, label: 'Record' },
    { id: 'vault', icon: Archive, label: 'Vault' },
    { id: 'review', icon: Sparkles, label: 'Review' },
  ];

  return (
    <div className="flex justify-around items-center px-4 pt-4 pb-safe bg-[var(--bg-color)] neu-convex rounded-t-[2.5rem] relative z-50 shrink-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(30);
            }}
            className={`relative flex flex-col items-center justify-center w-[4.5rem] h-[4.5rem] rounded-2xl transition-all duration-300 ${
              isActive ? 'neu-pressed text-[var(--accent-color)]' : 'neu-flat opacity-60 hover:opacity-100'
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-bold mt-1.5 tracking-wider uppercase">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const FocusTab = ({ rewireTask, rewireStreak, isCheckedInToday, handleCheckIn, handleUndoCheckIn, handleEditTask, isEditingTask, tempTask, setTempTask, handleSaveTask, setIsEditingTask, keywords }: any) => {
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const gap = 16;
  const segmentLength = (circumference / 7) - gap;
  const strokeDasharray = `${segmentLength} ${gap}`;
  const progress = Math.min(rewireStreak, 7);
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative w-full h-full overflow-hidden">
      {/* Floating Satellites (Keywords) */}
      {keywords.map((kw: any, i: number) => {
        const angle = (i * (360 / Math.max(keywords.length, 1))) * (Math.PI / 180);
        const distance = 170;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        return (
          <motion.div
            key={kw.word + i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, x, y }}
            transition={{ type: 'spring', stiffness: 50, damping: 10, delay: i * 0.1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 4 + i * 0.5, ease: "easeInOut" }}
              className="px-4 py-2 rounded-full neu-convex text-[10px] font-black tracking-widest uppercase opacity-80"
              style={{ color: 'var(--accent-color)' }}
            >
              {kw.word}
            </motion.div>
          </motion.div>
        );
      })}

      {/* Giant Circular Progress */}
      <div className="relative flex items-center justify-center w-[320px] h-[320px] z-10">
        <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 320 320">
          {/* Background Track (7 segments) */}
          <circle
            cx="160" cy="160" r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="18"
            strokeDasharray={strokeDasharray}
            className="opacity-10"
            strokeLinecap="round"
          />
          {/* Active Progress (7 segments) */}
          <circle
            cx="160" cy="160" r={radius}
            fill="transparent"
            stroke="var(--accent-color)"
            strokeWidth="18"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={circumference - (progress / 7) * circumference}
            className="transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
        </svg>
        
        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
          {(!rewireTask || isEditingTask) ? (
            <div className="flex flex-col gap-4 w-full">
              <p className="opacity-70 text-xs uppercase tracking-widest font-bold">
                {isEditingTask ? "Edit Focus" : "Set Focus"}
              </p>
              <NeuInput 
                value={tempTask} 
                onChange={(e: any) => setTempTask(e.target.value)} 
                placeholder="One thing..."
                className="text-center text-sm font-medium"
              />
              <div className="flex gap-3 w-full mt-2">
                <NeuButton onClick={handleSaveTask} disabled={!tempTask.trim()} className="!py-3 !px-4 flex-1 text-xs">
                  {isEditingTask ? "Save" : "Set"}
                </NeuButton>
                {isEditingTask && (
                  <NeuButton onClick={(e: any) => { e.stopPropagation(); setIsEditingTask(false); }} className="!py-3 !px-4 flex-1 text-xs">
                    Cancel
                  </NeuButton>
                )}
              </div>
            </div>
          ) : (
            <NeuCard 
              pressed={isCheckedInToday} 
              className={`w-full h-full rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ${isCheckedInToday ? 'neu-concave' : 'neu-convex hover:scale-105'}`}
              onClick={!isCheckedInToday ? handleCheckIn : undefined}
            >
              <div className="flex flex-col items-center justify-center w-full">
                <span className="text-6xl font-black mb-1 tracking-tighter" style={{ color: 'var(--accent-color)' }}>{rewireStreak}</span>
                <span className="text-[10px] uppercase font-bold opacity-50 tracking-widest mb-6">Day Streak</span>
                
                <p className="text-sm font-bold leading-snug px-2 line-clamp-3 opacity-80">{rewireTask}</p>
                
                <div className="mt-6 flex items-center justify-center h-8">
                  {!isCheckedInToday ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Tap to Check-in</span>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1" style={{ color: 'var(--accent-color)' }}>
                        <Check size={14} strokeWidth={3} /> Checked In
                      </span>
                      <button 
                        onClick={handleUndoCheckIn}
                        className="flex items-center gap-1 text-[10px] opacity-50 hover:opacity-100 transition-opacity bg-black/5 px-4 py-2 rounded-full font-bold uppercase"
                      >
                        <RotateCcw size={12} strokeWidth={3} /> Undo
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <button 
                onClick={handleEditTask} 
                className="absolute top-8 right-8 p-3 opacity-30 hover:opacity-100 transition-opacity rounded-full hover:bg-black/5"
              >
                <Edit3 size={18} />
              </button>
            </NeuCard>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState<'focus' | 'record' | 'vault' | 'review'>('focus');
  const [theme, setTheme] = useState<'default' | 'pink' | 'purple'>('default');
  const [rewireTask, setRewireTask] = useState('');
  const [rewireStreak, setRewireStreak] = useState(0);
  const [lastCheckIn, setLastCheckIn] = useState<number | null>(null);
  const [records, setRecords] = useState<JournalRecord[]>([]);
  const [dailyKeyword, setDailyKeyword] = useState<{ date: string, word: string } | null>(null);
  
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [tempTask, setTempTask] = useState('');

  const [inputs, setInputs] = useState({ thoughts: '', emotions: '', doubts: '' });
  const [activeInput, setActiveInput] = useState<'thoughts' | 'emotions' | 'doubts'>('thoughts');
  const [currentEmotion, setCurrentEmotion] = useState<string>('transparent');
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<JournalRecord | null>(null);

  // Load state
  useEffect(() => {
    const saved = localStorage.getItem('3r-journal-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTheme(parsed.theme || 'default');
        setRewireTask(parsed.rewireTask || '');
        setRewireStreak(parsed.rewireStreak || 0);
        setLastCheckIn(parsed.lastCheckIn || null);
        setRecords(parsed.records || []);
        setDailyKeyword(parsed.dailyKeyword || null);
      } catch (e) {
        console.error('Failed to parse state', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save state
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('3r-journal-state', JSON.stringify({
      theme, rewireTask, rewireStreak, lastCheckIn, records, dailyKeyword
    }));
    document.body.className = theme === 'default' ? '' : `theme-${theme}`;
  }, [theme, rewireTask, rewireStreak, lastCheckIn, records, dailyKeyword, isLoaded]);

  // Check-in logic
  const handleCheckIn = () => {
    if (!rewireTask) return;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (lastCheckIn === today) return;
    
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([50, 50, 50]);
    
    let newStreak = rewireStreak;
    if (lastCheckIn) {
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
      if (lastCheckIn === yesterday) newStreak += 1;
      else newStreak = 1;
    } else newStreak = 1;
    
    setRewireStreak(newStreak);
    setLastCheckIn(today);
  };

  const isCheckedInToday = () => {
    if (!lastCheckIn) return false;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return lastCheckIn === today;
  };

  const handleEditTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempTask(rewireTask);
    setIsEditingTask(true);
  };

  const handleSaveTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRewireTask(tempTask);
    setIsEditingTask(false);
  };

  const handleUndoCheckIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRewireStreak(prev => Math.max(0, prev - 1));
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setLastCheckIn(yesterday.getTime());
  };

  // Draw Card Logic
  const handleDrawCard = () => {
    const todayStr = new Date().toLocaleDateString();
    if (dailyKeyword?.date === todayStr) return;
    const randomWord = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
    setDailyKeyword({ date: todayStr, word: randomWord });
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([30, 50, 30]);
  };

  const isCardDrawnToday = dailyKeyword?.date === new Date().toLocaleDateString();

  // Record logic
  const handleAddRecord = () => {
    if (!inputs.thoughts.trim() && !inputs.emotions.trim() && !inputs.doubts.trim()) return;
    const wordCount = inputs.thoughts.trim().length + inputs.emotions.trim().length + inputs.doubts.trim().length;
    const intensity = Math.min(10, Math.max(1, Math.ceil(wordCount / 15)));
    
    const newRecord: JournalRecord = {
      id: Date.now().toString(),
      thoughts: inputs.thoughts.trim(),
      emotions: inputs.emotions.trim(),
      doubts: inputs.doubts.trim(),
      timestamp: Date.now(),
      intensity,
      emotionTag: currentEmotion,
      keyword: isCardDrawnToday && dailyKeyword ? dailyKeyword.word : undefined
    };
    
    setRecords([newRecord, ...records]);
    setInputs({ thoughts: '', emotions: '', doubts: '' });
    setCurrentEmotion('transparent');
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
  };

  const handleSpeechResult = useCallback((text: string) => {
    setInputs(prev => ({ ...prev, [activeInput]: prev[activeInput] + (prev[activeInput] ? ' ' : '') + text }));
  }, [activeInput]);

  const { isRecording, toggleRecording, supported: speechSupported } = useSpeechRecognition(handleSpeechResult);

  // Export logic
  const handleExport = () => {
    const now = new Date();
    const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const recentRecords = records.filter(r => r.timestamp >= oneWeekAgo);
    
    if (recentRecords.length === 0) { alert('No records found for the past week.'); return; }
    
    const startDate = new Date(oneWeekAgo).toLocaleDateString();
    const endDate = now.toLocaleDateString();
    let markdown = `## [${startDate} - ${endDate}] Weekly Records\n\n`;
    
    recentRecords.forEach(r => {
      const dateStr = new Date(r.timestamp).toLocaleString();
      markdown += `### ${dateStr}\n`;
      if (r.keyword) markdown += `**Keyword**: ${r.keyword}\n`;
      if (r.content) {
        markdown += `**[${r.type}]**: ${r.content}\n\n`;
      } else {
        if (r.thoughts) markdown += `**[Thoughts]**: ${r.thoughts}\n`;
        if (r.emotions) markdown += `**[Emotions]**: ${r.emotions}\n`;
        if (r.doubts) markdown += `**[Doubts]**: ${r.doubts}\n`;
        markdown += `\n`;
      }
    });
    
    navigator.clipboard.writeText(markdown).then(() => {
      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(100);
      alert('Weekly summary copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy', err);
      alert('Failed to copy to clipboard.');
    });
  };

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    records.forEach(r => {
      const d = new Date(r.timestamp);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    const sorted = Array.from(months).sort().reverse();
    if (sorted.length > 0 && !selectedMonth) setSelectedMonth(sorted[0]);
    return sorted;
  }, [records, selectedMonth]);

  const filteredRecords = useMemo(() => {
    if (!selectedMonth) return [];
    return records.filter(r => {
      const d = new Date(r.timestamp);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return mStr === selectedMonth;
    });
  }, [records, selectedMonth]);

  const recentKeywords = useMemo(() => {
    const kws = new Map();
    if (dailyKeyword) kws.set(dailyKeyword.word, { word: dailyKeyword.word });
    records.forEach(r => {
      if (r.keyword && !kws.has(r.keyword)) kws.set(r.keyword, { word: r.keyword });
    });
    return Array.from(kws.values()).slice(0, 5);
  }, [records, dailyKeyword]);

  if (!isLoaded) return null;

  return (
    <div className="fixed inset-0 flex justify-center bg-[var(--bg-color)] overflow-hidden">
      {/* Background Engraved Galaxy */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex flex-wrap gap-6 p-8 opacity-40 justify-center content-start">
        {Array.from({ length: 150 }).map((_, i) => {
          const isStreakDot = i < rewireStreak;
          return (
            <div 
              key={i} 
              className={`w-2 h-2 rounded-full transition-all duration-1000 ${
                isStreakDot 
                  ? 'neu-convex shadow-[inset_0_0_6px_rgba(255,255,255,0.9)] bg-white/20 scale-150' 
                  : 'neu-pressed opacity-30'
              }`} 
            />
          );
        })}
      </div>

      {/* Mobile App Container */}
      <div className="w-full max-w-md h-full flex flex-col relative z-10 shadow-2xl bg-[var(--bg-color)]/80 backdrop-blur-3xl">
        
        {/* Header */}
        <header className="flex justify-between items-center pt-safe px-6 py-4 shrink-0" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
          <h1 className="text-xl font-black tracking-tight opacity-80">3R Journal</h1>
          <NeuButton 
            className="!p-3 !rounded-full" 
            onClick={() => setTheme(theme === 'default' ? 'pink' : theme === 'pink' ? 'purple' : 'default')}
          >
            <Palette size={20} />
          </NeuButton>
        </header>

        {/* Tab Content Area */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'focus' && (
              <motion.div 
                key="focus"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 overflow-y-auto pb-6"
              >
                <FocusTab 
                  rewireTask={rewireTask}
                  rewireStreak={rewireStreak}
                  isCheckedInToday={isCheckedInToday()}
                  handleCheckIn={handleCheckIn}
                  handleUndoCheckIn={handleUndoCheckIn}
                  handleEditTask={handleEditTask}
                  isEditingTask={isEditingTask}
                  tempTask={tempTask}
                  setTempTask={setTempTask}
                  handleSaveTask={handleSaveTask}
                  setIsEditingTask={setIsEditingTask}
                  keywords={recentKeywords}
                />
              </motion.div>
            )}
            
            {activeTab === 'record' && (
              <motion.div 
                key="record"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 overflow-y-auto px-6 pb-6"
              >
                <div className="flex justify-between items-center mb-6 mt-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider opacity-70 flex items-center gap-2">
                    <Edit3 size={16} /> Record: Daily Log
                  </h2>
                  <NeuButton 
                    className="!px-4 !py-2 text-xs flex items-center gap-1"
                    onClick={handleDrawCard}
                    disabled={isCardDrawnToday}
                    active={isCardDrawnToday}
                  >
                    <Sparkles size={14} />
                    {isCardDrawnToday ? 'Drawn' : 'Draw Card'}
                  </NeuButton>
                </div>

                <NeuCard className="flex flex-col gap-6">
                  {isCardDrawnToday && dailyKeyword && (
                    <div className="relative text-center py-3 px-4 rounded-2xl neu-pressed text-sm font-medium opacity-80 flex items-center justify-center">
                      <span>Today's Keyword: <span className="font-black tracking-widest uppercase ml-2" style={{ color: 'var(--accent-color)' }}>{dailyKeyword.word}</span></span>
                      <button 
                        onClick={() => setDailyKeyword(null)}
                        className="absolute right-3 p-1.5 rounded-full hover:bg-black/5 transition-colors"
                        title="Remove keyword"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-5">
                    <div>
                      <h3 className="text-xs font-bold uppercase opacity-60 mb-2 ml-2">Thoughts</h3>
                      <NeuInput
                        multiline
                        value={inputs.thoughts}
                        onChange={(e: any) => setInputs(prev => ({ ...prev, thoughts: e.target.value }))}
                        placeholder="What are your thoughts right now?"
                        onMicClick={speechSupported ? () => { setActiveInput('thoughts'); toggleRecording(); } : undefined}
                        isRecording={isRecording && activeInput === 'thoughts'}
                        onFocus={() => setActiveInput('thoughts')}
                      />
                    </div>
                    
                    <div>
                      <h3 className="text-xs font-bold uppercase opacity-60 mb-2 ml-2">Emotions</h3>
                      <NeuInput
                        multiline
                        value={inputs.emotions}
                        onChange={(e: any) => setInputs(prev => ({ ...prev, emotions: e.target.value }))}
                        placeholder="How are you feeling?"
                        onMicClick={speechSupported ? () => { setActiveInput('emotions'); toggleRecording(); } : undefined}
                        isRecording={isRecording && activeInput === 'emotions'}
                        onFocus={() => setActiveInput('emotions')}
                      />
                    </div>
                    
                    <div>
                      <h3 className="text-xs font-bold uppercase opacity-60 mb-2 ml-2">Doubts</h3>
                      <NeuInput
                        multiline
                        value={inputs.doubts}
                        onChange={(e: any) => setInputs(prev => ({ ...prev, doubts: e.target.value }))}
                        placeholder="What are your doubts or confusions?"
                        onMicClick={speechSupported ? () => { setActiveInput('doubts'); toggleRecording(); } : undefined}
                        isRecording={isRecording && activeInput === 'doubts'}
                        onFocus={() => setActiveInput('doubts')}
                      />
                    </div>

                    <div className="flex items-center justify-between px-2 mt-2">
                      <span className="text-xs font-bold opacity-60 flex items-center gap-1 uppercase tracking-wider"><Droplet size={14}/> Emotion Color</span>
                      <div className="flex gap-3">
                        {EMOTIONS.map(emo => (
                          <button
                            key={emo.id}
                            onClick={() => setCurrentEmotion(emo.color)}
                            className={`w-8 h-8 rounded-full transition-all ${currentEmotion === emo.color ? 'neu-pressed scale-110' : 'neu-flat hover:scale-110'}`}
                            style={{ backgroundColor: emo.color === 'transparent' ? 'var(--bg-color)' : emo.color }}
                            title={emo.label}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <NeuButton 
                      onClick={handleAddRecord}
                      disabled={!inputs.thoughts.trim() && !inputs.emotions.trim() && !inputs.doubts.trim()}
                      className="w-full flex justify-center items-center gap-2 mt-4 !py-4"
                    >
                      <Plus size={20} /> Save Record
                    </NeuButton>
                  </div>
                </NeuCard>
              </motion.div>
            )}

            {activeTab === 'vault' && (
              <motion.div 
                key="vault"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 overflow-y-auto px-6 pb-6"
              >
                <h2 className="text-sm font-bold uppercase tracking-wider mb-6 opacity-70 flex items-center gap-2 mt-4">
                  <CalendarDays size={16} /> History Pebbles
                </h2>
                
                {records.length > 0 ? (
                  <>
                    <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar">
                      {availableMonths.map(month => (
                        <NeuButton
                          key={month}
                          className="!py-2 !px-5 text-sm whitespace-nowrap snap-start"
                          active={selectedMonth === month}
                          onClick={() => { setSelectedMonth(month); setSelectedRecord(null); }}
                        >
                          {month}
                        </NeuButton>
                      ))}
                    </div>

                    <div className="neu-pressed rounded-[2rem] p-6 min-h-[240px] flex flex-wrap content-start gap-4 mt-2 relative">
                      {filteredRecords.map(record => {
                        const isSelected = selectedRecord?.id === record.id;
                        const offset = 2 + record.intensity * 0.6;
                        const blur = 4 + record.intensity * 1.2;
                        
                        return (
                          <button
                            key={record.id}
                            onClick={() => setSelectedRecord(isSelected ? null : record)}
                            className={`rounded-2xl transition-all duration-300 flex items-center justify-center font-bold text-sm
                              ${isSelected ? 'ring-2 ring-opacity-50 ring-[var(--accent-color)]' : 'hover:scale-105'}`}
                            style={{
                              width: '56px', height: '56px',
                              backgroundColor: record.emotionTag === 'transparent' ? 'var(--bg-color)' : record.emotionTag,
                              transform: `scale(${0.85 + record.intensity * 0.03})`,
                              boxShadow: isSelected 
                                ? `inset ${offset}px ${offset}px ${blur}px var(--shadow-dark), inset -${offset}px -${offset}px ${blur}px var(--shadow-light)`
                                : `${offset}px ${offset}px ${blur}px var(--shadow-dark), -${offset}px -${offset}px ${blur}px var(--shadow-light)`,
                              color: record.emotionTag !== 'transparent' ? '#333' : 'inherit'
                            }}
                          >
                            {new Date(record.timestamp).getDate()}
                          </button>
                        );
                      })}
                      {filteredRecords.length === 0 && (
                        <div className="w-full h-full flex items-center justify-center opacity-50 text-sm font-bold">
                          No records for this month.
                        </div>
                      )}
                    </div>

                    {selectedRecord && (
                      <NeuCard className="mt-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-xs font-black uppercase tracking-widest opacity-60">
                            {selectedRecord.type || 'Daily Record'}
                          </span>
                          <span className="text-xs opacity-50 font-bold">{new Date(selectedRecord.timestamp).toLocaleString()}</span>
                        </div>
                        {selectedRecord.keyword && (
                          <div className="text-xs font-bold mb-4 opacity-80" style={{ color: 'var(--accent-color)' }}>
                            Keyword: <span className="uppercase tracking-widest">{selectedRecord.keyword}</span>
                          </div>
                        )}
                        {selectedRecord.content ? (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{selectedRecord.content}</p>
                        ) : (
                          <div className="flex flex-col gap-5">
                            {selectedRecord.thoughts && (
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Thoughts</span>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium mt-1">{selectedRecord.thoughts}</p>
                              </div>
                            )}
                            {selectedRecord.emotions && (
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Emotions</span>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium mt-1">{selectedRecord.emotions}</p>
                              </div>
                            )}
                            {selectedRecord.doubts && (
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Doubts</span>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium mt-1">{selectedRecord.doubts}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </NeuCard>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 opacity-50">
                    <Archive size={48} className="mb-4" />
                    <p className="text-sm font-bold">No records yet.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'review' && (
              <motion.div 
                key="review"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 overflow-y-auto px-6 pb-6"
              >
                <h2 className="text-sm font-bold uppercase tracking-wider mb-6 opacity-70 flex items-center gap-2 mt-4">
                  <Heart size={16} /> Reflect: Weekly Review
                </h2>
                <NeuCard className="flex flex-col gap-6 items-center text-center">
                  <div className="w-16 h-16 rounded-full neu-convex flex items-center justify-center mb-2">
                    <Sparkles size={24} style={{ color: 'var(--accent-color)' }} />
                  </div>
                  <p className="opacity-80 text-sm font-medium leading-relaxed">
                    Export your records from the last 7 days to analyze with AI.
                  </p>
                  <NeuButton onClick={handleExport} className="w-full flex justify-center items-center gap-2 !py-4">
                    <Copy size={20} /> Export to Markdown
                  </NeuButton>
                </NeuCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Tab Bar */}
        <BottomTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 24px); }
        .pt-safe { padding-top: env(safe-area-inset-top, 16px); }
      `}} />
    </div>
  );
}
