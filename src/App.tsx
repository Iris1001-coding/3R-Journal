import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, Copy, Check, Plus, Calendar, Edit3, Heart, Palette } from 'lucide-react';

type RecordType = 'Thoughts' | 'Emotions' | 'Doubts';

interface JournalRecord {
  id: string;
  type: RecordType;
  content: string;
  timestamp: number;
}

interface AppState {
  theme: 'default' | 'pink' | 'purple';
  rewireTask: string;
  rewireStreak: number;
  lastCheckIn: number | null;
  records: JournalRecord[];
}

const NeuCard = ({ children, className = '', pressed = false, onClick }: any) => {
  return (
    <div 
      onClick={onClick}
      className={`rounded-2xl p-6 transition-all duration-300 ${pressed ? 'neu-pressed' : 'neu-flat'} ${className}`}
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
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
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
      className={`rounded-xl px-6 py-3 font-semibold transition-all duration-150 outline-none flex items-center justify-center
        ${(isPressed || active) ? 'neu-pressed' : 'neu-flat'} 
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}`}
    >
      {children}
    </button>
  );
};

const NeuInput = ({ value, onChange, placeholder, className = '', multiline = false, onMicClick, isRecording }: any) => {
  const Component = multiline ? 'textarea' : 'input';
  return (
    <div className="relative w-full">
      <Component
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-xl p-4 outline-none neu-pressed bg-transparent resize-none text-inherit placeholder:opacity-50 ${className}`}
        rows={multiline ? 4 : 1}
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
      
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setIsRecording(false);
      };
      
      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
      
      rec.onend = () => {
        setIsRecording(false);
      };
      
      recognitionRef.current = rec;
    }
  }, [onResult]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return { isRecording, toggleRecording, supported: !!recognitionRef.current };
};

export default function App() {
  const [theme, setTheme] = useState<'default' | 'pink' | 'purple'>('default');
  const [rewireTask, setRewireTask] = useState('');
  const [rewireStreak, setRewireStreak] = useState(0);
  const [lastCheckIn, setLastCheckIn] = useState<number | null>(null);
  const [records, setRecords] = useState<JournalRecord[]>([]);
  
  const [currentInput, setCurrentInput] = useState('');
  const [currentType, setCurrentType] = useState<RecordType>('Thoughts');
  const [isLoaded, setIsLoaded] = useState(false);
  
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
      theme,
      rewireTask,
      rewireStreak,
      lastCheckIn,
      records
    }));
    
    // Apply theme
    document.body.className = theme === 'default' ? '' : `theme-${theme}`;
  }, [theme, rewireTask, rewireStreak, lastCheckIn, records, isLoaded]);

  // Check-in logic
  const handleCheckIn = () => {
    if (!rewireTask) return;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    if (lastCheckIn === today) return; // Already checked in today
    
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([50, 50, 50]);
    }
    
    let newStreak = rewireStreak;
    if (lastCheckIn) {
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
      if (lastCheckIn === yesterday) {
        newStreak += 1;
      } else {
        newStreak = 1; // Streak broken
      }
    } else {
      newStreak = 1;
    }
    
    setRewireStreak(newStreak);
    setLastCheckIn(today);
  };

  const isCheckedInToday = () => {
    if (!lastCheckIn) return false;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return lastCheckIn === today;
  };

  // Record logic
  const handleAddRecord = () => {
    if (!currentInput.trim()) return;
    
    const newRecord: JournalRecord = {
      id: Date.now().toString(),
      type: currentType,
      content: currentInput.trim(),
      timestamp: Date.now()
    };
    
    setRecords([newRecord, ...records]);
    setCurrentInput('');
    
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  };

  const handleSpeechResult = useCallback((text: string) => {
    setCurrentInput(prev => prev + (prev ? ' ' : '') + text);
  }, []);

  const { isRecording, toggleRecording, supported: speechSupported } = useSpeechRecognition(handleSpeechResult);

  // Export logic
  const handleExport = () => {
    const now = new Date();
    const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    
    const recentRecords = records.filter(r => r.timestamp >= oneWeekAgo);
    
    if (recentRecords.length === 0) {
      alert('No records found for the past week.');
      return;
    }
    
    const startDate = new Date(oneWeekAgo).toLocaleDateString();
    const endDate = now.toLocaleDateString();
    
    let markdown = `## [${startDate} - ${endDate}] Weekly Records\n\n`;
    
    recentRecords.forEach(r => {
      const dateStr = new Date(r.timestamp).toLocaleString();
      markdown += `**[${r.type}]**: ${r.content}\n\n`;
    });
    
    navigator.clipboard.writeText(markdown).then(() => {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(100);
      }
      alert('Weekly summary copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy', err);
      alert('Failed to copy to clipboard.');
    });
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto flex flex-col gap-8 pb-24">
      {/* Header */}
      <header className="flex justify-between items-center pt-4">
        <h1 className="text-2xl font-bold tracking-tight">3R Journal</h1>
        <div className="flex gap-4">
          <NeuButton 
            className="!p-2 !rounded-full" 
            onClick={() => setTheme(theme === 'default' ? 'pink' : theme === 'pink' ? 'purple' : 'default')}
          >
            <Palette size={20} />
          </NeuButton>
        </div>
      </header>

      {/* Rewire Section */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-70 flex items-center gap-2">
          <Check size={16} /> Rewire: One Thing
        </h2>
        <NeuCard 
          pressed={isCheckedInToday()} 
          className={`relative overflow-hidden ${isCheckedInToday() ? 'neu-concave' : 'neu-convex cursor-pointer'}`}
          onClick={!isCheckedInToday() ? handleCheckIn : undefined}
        >
          {isCheckedInToday() && (
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Check size={64} />
            </div>
          )}
          
          <div className="flex flex-col gap-4 relative z-10">
            {rewireTask ? (
              <div>
                <p className="text-lg font-medium mb-2">{rewireTask}</p>
                <div className="flex items-center gap-2 text-sm opacity-70">
                  <Calendar size={14} />
                  <span>Streak: {rewireStreak} days</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="opacity-70 text-sm">Set your focus for this week</p>
                <NeuInput 
                  value={rewireTask} 
                  onChange={(e: any) => setRewireTask(e.target.value)} 
                  placeholder="Paste AI suggested task here..."
                />
              </div>
            )}
            
            {rewireTask && !isCheckedInToday() && (
              <p className="text-xs font-semibold uppercase tracking-wider mt-2 opacity-60">
                Tap card to check in today
              </p>
            )}
            {rewireTask && isCheckedInToday() && (
              <p className="text-xs font-semibold uppercase tracking-wider mt-2 opacity-60 text-green-600">
                Checked in today!
              </p>
            )}
          </div>
        </NeuCard>
      </section>

      {/* Record Section */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-70 flex items-center gap-2">
          <Edit3 size={16} /> Record: Daily Log
        </h2>
        <NeuCard className="flex flex-col gap-6">
          <div className="flex gap-2 p-1 rounded-xl neu-pressed">
            {(['Thoughts', 'Emotions', 'Doubts'] as RecordType[]).map(type => (
              <button
                key={type}
                onClick={() => setCurrentType(type)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all
                  ${currentType === type ? 'neu-flat' : 'opacity-60 hover:opacity-100'}`}
              >
                {type}
              </button>
            ))}
          </div>
          
          <div className="flex flex-col gap-4">
            <NeuInput
              multiline
              value={currentInput}
              onChange={(e: any) => setCurrentInput(e.target.value)}
              placeholder={`What are your ${currentType.toLowerCase()} right now?`}
              onMicClick={speechSupported ? toggleRecording : undefined}
              isRecording={isRecording}
            />
            
            <NeuButton 
              onClick={handleAddRecord}
              disabled={!currentInput.trim()}
              className="w-full flex justify-center items-center gap-2"
            >
              <Plus size={18} /> Save Record
            </NeuButton>
          </div>
        </NeuCard>
      </section>

      {/* Reflect Section */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-70 flex items-center gap-2">
          <Heart size={16} /> Reflect: Weekly Review
        </h2>
        <NeuCard className="flex flex-col gap-4 items-center text-center">
          <p className="opacity-70 text-sm mb-2">
            Export your records from the last 7 days to analyze with AI.
          </p>
          <NeuButton onClick={handleExport} className="w-full flex justify-center items-center gap-2">
            <Copy size={18} /> Export to Markdown
          </NeuButton>
        </NeuCard>
      </section>
    </div>
  );
}
