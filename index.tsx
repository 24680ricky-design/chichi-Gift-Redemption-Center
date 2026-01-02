
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';
import { 
  Sun, 
  Users, 
  Gift, 
  History, 
  Plus, 
  Trash2, 
  LogOut, 
  Coins, 
  CheckCircle2,
  ChevronLeft,
  Upload,
  LayoutGrid,
  Edit3,
  Eye,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Package,
  AlertCircle,
  X
} from 'lucide-react';

// --- Types ---
interface Student {
  id: string;
  name: string;
  points: number;
}

interface Prize {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  category?: string;
}

interface Log {
  id: string;
  studentName: string;
  prizeName: string;
  cost: number;
  timestamp: string;
}

interface AppData {
  students: Student[];
  prizes: Prize[];
  logs: Log[];
}

// --- Constants ---
const STORAGE_KEY = 'chichi_prize_house_data_v2';
const ADMIN_PASSWORD = '1231';

// --- Helper: Point Counter with Animation ---
const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;
    
    const duration = 500;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(start + (end - start) * progress);
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  return <span>{displayValue}</span>;
};

// --- Helper: Wavy Text Component ---
const WavyText: React.FC<{ text: string }> = ({ text }) => {
  return (
    <h2 className="text-5xl font-black text-slate-800 mb-4 leading-tight flex justify-center flex-wrap gap-x-2">
      {text.split('').map((char, i) => (
        <span 
          key={i} 
          className="inline-block animate-wavy-text"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </h2>
  );
};

// --- Components ---

const App: React.FC = () => {
  const [view, setView] = useState<'login' | 'store' | 'admin'>('login');
  const [students, setStudents] = useState<Student[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [currentUser, setCurrentUser] = useState<Student | null>(null);

  // Load data
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData) as AppData;
        setStudents(parsed.students || []);
        setPrizes(parsed.prizes || []);
        setLogs(parsed.logs || []);
      } catch (e) {
        console.error("Data load error", e);
      }
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ students, prizes, logs }));
  }, [students, prizes, logs]);

  const playSound = (type: 'success' | 'click' | 'error') => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    }
  };

  const handleAdminAccess = async () => {
    const { value: password } = await Swal.fire({
      title: '老師管理登入',
      input: 'password',
      inputLabel: '請輸入密碼',
      inputPlaceholder: '輸入密碼',
      confirmButtonColor: '#f59e0b',
      confirmButtonText: '進入後台',
      background: '#fff',
      customClass: {
        title: 'text-2xl font-bold text-slate-700',
        input: 'rounded-xl border-slate-200 focus:ring-amber-500'
      }
    });

    if (password === ADMIN_PASSWORD) {
      setView('admin');
      playSound('success');
    } else if (password !== undefined) {
      Swal.fire({ icon: 'error', title: '密碼不正確喔！', confirmButtonColor: '#0ea5e9' });
    }
  };

  const handleExchange = (prize: Prize) => {
    if (!currentUser) return;
    if (currentUser.points < prize.price) return;
    if (prize.stock <= 0) return;

    // 1. Update students and currentUser points
    const updatedStudents = students.map(s => 
      s.id === currentUser.id ? { ...s, points: s.points - prize.price } : s
    );
    setStudents(updatedStudents);
    setCurrentUser(prev => prev ? { ...prev, points: prev.points - prize.price } : null);

    // 2. Update prize stock
    const updatedPrizes = prizes.map(p => 
      p.id === prize.id ? { ...p, stock: p.stock - 1 } : p
    );
    setPrizes(updatedPrizes);

    // 3. Add log
    setLogs([{
      id: Date.now().toString(),
      studentName: currentUser.name,
      prizeName: prize.name,
      cost: prize.price,
      timestamp: new Date().toLocaleString()
    }, ...logs]);

    playSound('success');
    confetti({
      particleCount: 200,
      spread: 90,
      origin: { y: 0.7 },
      colors: ['#f59e0b', '#38bdf8', '#fbbf24']
    });

    Swal.fire({
      title: `太棒了！獲得 ${prize.name}！`,
      text: `你的努力得到了回報！`,
      imageUrl: prize.image || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&auto=format&fit=crop&q=60',
      imageWidth: 240,
      imageHeight: 240,
      confirmButtonText: '收下了！',
      confirmButtonColor: '#f59e0b',
      padding: '2rem',
      background: '#fff url(https://www.transparenttextures.com/patterns/cubes.png)'
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-amber-200/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-sky-200/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-amber-500 to-amber-300 p-2.5 rounded-2xl shadow-lg shadow-amber-200/50 transform transition hover:rotate-12 cursor-pointer" onClick={() => setView('login')}>
            <Gift className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">chi chi <span className="text-amber-500">獎品屋</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rewards Program 2026</p>
          </div>
        </div>

        {view === 'store' && currentUser && (
          <div className="flex items-center gap-4 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white rounded-2xl px-5 py-2.5 shadow-sm border border-slate-100 flex items-center gap-4 group transition-all hover:border-sky-300">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-500">{currentUser.name} 同學</span>
                <div className="flex items-center gap-1.5 text-amber-500 font-black text-xl">
                  <Coins size={20} className="animate-bounce" />
                  <AnimatedNumber value={currentUser.points} />
                </div>
              </div>
              <button 
                onClick={() => { setView('login'); setCurrentUser(null); }}
                className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
              >
                <LogOut size={22} />
              </button>
            </div>
          </div>
        )}

        {view === 'admin' && (
          <button 
            onClick={() => setView('login')}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 transition-all font-bold shadow-lg shadow-slate-200"
          >
            <ChevronLeft size={20} /> 退出管理
          </button>
        )}
      </header>

      <main className="flex-grow p-6 lg:p-10 max-w-7xl mx-auto w-full transition-all">
        {view === 'login' && <LoginView students={students} onLogin={(s) => { setCurrentUser(s); setView('store'); playSound('click'); }} />}
        {view === 'store' && <StoreView prizes={prizes} userPoints={currentUser?.points || 0} onExchange={handleExchange} />}
        {view === 'admin' && <AdminPanel students={students} setStudents={setStudents} prizes={prizes} setPrizes={setPrizes} logs={logs} setLogs={setLogs} />}
      </main>

      <footer className="py-8 px-6 text-center border-t border-slate-100 bg-white/50 relative">
        <div className="flex flex-col items-center gap-4">
          <p className="text-slate-400 font-medium text-sm">©2026 chichi 製作</p>
          <button 
            onClick={handleAdminAccess}
            className="p-3 text-slate-200 hover:text-amber-400 transition-all transform hover:scale-125 hover:rotate-45"
          >
            <Sun size={28} fill="currentColor" />
          </button>
        </div>
      </footer>
    </div>
  );
};

// --- View: Login ---
const LoginView: React.FC<{ students: Student[], onLogin: (s: Student) => void }> = ({ students, onLogin }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="text-center mb-12 max-w-2xl mx-auto">
        <div className="inline-block px-4 py-1.5 bg-sky-100 text-sky-600 rounded-full text-sm font-black mb-4 tracking-widest uppercase">Student Portal</div>
        <WavyText text="準備好要兌換了嗎？" />
        <p className="text-slate-500 text-lg mt-2">找到你的名字，進去看看有哪些好棒的獎品！</p>
      </div>
      
      {students.length === 0 ? (
        <div className="bg-white rounded-[40px] p-24 text-center shadow-2xl shadow-slate-200/50 border border-slate-50 flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Users size={48} className="text-slate-300" />
          </div>
          <p className="text-slate-400 text-2xl font-bold">目前還沒有名單喔，請老師先匯入。</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {students.map((student, idx) => (
            <button
              key={student.id}
              onClick={() => onLogin(student)}
              className="bg-white p-10 rounded-[32px] shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-3 border-4 border-transparent hover:border-amber-400 active:scale-95 group text-center relative overflow-hidden"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-bl-[100px] -z-0 transition-all group-hover:bg-amber-50"></div>
              <div className="relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-sky-400 to-sky-600 text-white rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-sky-200 group-hover:from-amber-400 group-hover:to-amber-600 group-hover:shadow-amber-200 transition-all transform group-hover:rotate-6">
                  <span className="text-4xl font-black">{student.name.charAt(0)}</span>
                </div>
                <span className="text-2xl font-black text-slate-700 block mb-2">{student.name}</span>
                <div className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full text-slate-500 font-bold text-sm">
                  <Coins size={14} /> {student.points} 點
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- View: Store ---
const StoreView: React.FC<{ prizes: Prize[], userPoints: number, onExchange: (p: Prize) => void }> = ({ prizes, userPoints, onExchange }) => {
  return (
    <div className="animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 mb-2">獎品大本營 <Sparkles className="inline text-amber-500 mb-1" /></h2>
          <p className="text-slate-500 text-lg">今天想要帶什麼回家呢？</p>
        </div>
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
           <button className="px-6 py-2.5 bg-amber-500 text-white rounded-xl font-bold">全部</button>
           <button className="px-6 py-2.5 text-slate-400 hover:text-slate-600 font-bold transition-colors">我的最愛</button>
        </div>
      </div>

      {prizes.length === 0 ? (
        <div className="bg-white rounded-[40px] p-24 text-center shadow-xl border border-slate-100">
          <Gift size={80} className="mx-auto text-slate-100 mb-6" />
          <p className="text-slate-400 text-2xl font-bold">貨架空空的，請老師上架獎品喔！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {prizes.map(prize => {
            const isSoldOut = prize.stock <= 0;
            const canAfford = userPoints >= prize.price;
            const diff = prize.price - userPoints;

            return (
              <div 
                key={prize.id}
                className={`bg-white rounded-[32px] shadow-lg overflow-hidden flex flex-col transition-all group border-2 ${
                  isSoldOut 
                    ? 'border-slate-100 opacity-50 grayscale' 
                    : (canAfford ? 'border-transparent hover:shadow-2xl hover:-translate-y-2' : 'border-slate-50 opacity-60 grayscale-[0.8]')
                }`}
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                  <img src={prize.image || `https://via.placeholder.com/400?text=${prize.name}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-4 left-4">
                    <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-xs font-black text-slate-700 shadow-sm border border-white/50">
                      {prize.category || '一般'}
                    </span>
                  </div>
                  
                  {isSoldOut ? (
                    <div className="absolute inset-0 bg-rose-900/40 flex flex-col items-center justify-center p-6 text-center backdrop-blur-[2px]">
                      <div className="bg-white text-rose-600 px-6 py-3 rounded-full font-black shadow-2xl transform -rotate-12 border-4 border-rose-600 text-xl tracking-wider">
                        已售完
                      </div>
                    </div>
                  ) : !canAfford && (
                    <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 text-white">
                        <TrendingUp size={32} />
                      </div>
                      <div className="bg-amber-500 text-white px-5 py-2 rounded-2xl font-black shadow-xl">
                        還差 {diff} 點
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-8 flex flex-col flex-grow relative">
                  <h3 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-amber-600 transition-colors">{prize.name}</h3>
                  
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                       <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                          <Coins size={22} />
                       </div>
                       <span className="text-3xl font-black text-slate-800">{prize.price} <span className="text-lg text-slate-400 font-bold">點</span></span>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 ${prize.stock < 3 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>
                      <Package size={14} /> 剩餘 {prize.stock}
                    </div>
                  </div>

                  <button
                    disabled={isSoldOut || !canAfford}
                    onClick={() => onExchange(prize)}
                    className={`mt-auto w-full py-5 rounded-[20px] text-xl font-black transition-all transform active:scale-95 flex items-center justify-center gap-3 ${
                      isSoldOut
                        ? 'bg-slate-300 text-white cursor-not-allowed'
                        : canAfford 
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white shadow-xl shadow-amber-200' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isSoldOut ? '下次請早' : canAfford ? <><CheckCircle2 size={24} /> 我要兌換</> : '再接再厲'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- View: Admin (Integrated Prize Workbench) ---
const AdminPanel: React.FC<{
  students: Student[], setStudents: React.Dispatch<React.SetStateAction<Student[]>>,
  prizes: Prize[], setPrizes: React.Dispatch<React.SetStateAction<Prize[]>>,
  logs: Log[], setLogs: React.Dispatch<React.SetStateAction<Log[]>>
}> = ({ students, setStudents, prizes, setPrizes, logs, setLogs }) => {
  const [tab, setTab] = useState<'students' | 'prizes' | 'logs'>('students');
  const [editingPrize, setEditingPrize] = useState<Partial<Prize>>({ name: '', price: 10, stock: 1, image: '', category: '文具' });

  // Prize Edit Handlers
  const handleSavePrize = () => {
    if (!editingPrize.name || editingPrize.price === undefined || editingPrize.stock === undefined) {
      Swal.fire('錯誤', '請填寫獎品名稱、價格與數量', 'error');
      return;
    }

    if (editingPrize.id) {
      // Update existing
      setPrizes(prizes.map(p => p.id === editingPrize.id ? (editingPrize as Prize) : p));
      Swal.fire({ icon: 'success', title: '更新成功！', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
    } else {
      // Create new
      setPrizes([{ id: Date.now().toString(), ...editingPrize } as Prize, ...prizes]);
      Swal.fire({ icon: 'success', title: '上架成功！', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
    }

    setEditingPrize({ name: '', price: 10, stock: 1, image: '', category: '文具' });
  };

  const handleEditExisting = (prize: Prize) => {
    setEditingPrize(prize);
    // Scroll editor into view on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const importStudents = async () => {
    const { value: text } = await Swal.fire({
      title: '批量匯入',
      input: 'textarea',
      inputLabel: '一行一個姓名',
      inputPlaceholder: '例：\n陳小明\n林阿華',
      showCancelButton: true,
      confirmButtonColor: '#0ea5e9'
    });
    if (text) {
      const newEntries = text.split('\n').map(n => n.trim()).filter(n => n).map((n, i) => ({ id: (Date.now()+i).toString(), name: n, points: 0 }));
      setStudents([...students, ...newEntries]);
    }
  };

  const updatePoints = (studentId: string, amount: number) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, points: Math.max(0, s.points + amount) } : s));
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/60 overflow-hidden flex flex-col min-h-[700px] border border-slate-100">
      <nav className="flex p-3 bg-slate-50 gap-2 border-b border-slate-100">
        <button onClick={() => setTab('students')} className={`flex-1 flex items-center justify-center gap-2 py-5 rounded-[24px] font-black transition-all ${tab === 'students' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <Users size={20} /> 學生管理
        </button>
        <button onClick={() => setTab('prizes')} className={`flex-1 flex items-center justify-center gap-2 py-5 rounded-[24px] font-black transition-all ${tab === 'prizes' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <Gift size={20} /> 獎品工作台
        </button>
        <button onClick={() => setTab('logs')} className={`flex-1 flex items-center justify-center gap-2 py-5 rounded-[24px] font-black transition-all ${tab === 'logs' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <History size={20} /> 兌換流水帳
        </button>
      </nav>

      <div className="p-8 flex-grow">
        {tab === 'students' && (
          <div className="animate-in slide-in-from-left-4 duration-500">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black text-slate-800">班級名單</h3>
              <div className="flex gap-3">
                <button onClick={importStudents} className="px-6 py-3 bg-sky-100 text-sky-600 rounded-2xl font-bold hover:bg-sky-200 transition-colors flex items-center gap-2"><Upload size={18} /> 批次匯入</button>
                <button onClick={() => {
                  Swal.fire({ title: '手動新增', input: 'text', inputPlaceholder: '學生姓名', showCancelButton: true }).then(res => {
                    if (res.value) setStudents([...students, { id: Date.now().toString(), name: res.value, points: 0 }]);
                  });
                }} className="px-6 py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all flex items-center gap-2"><Plus size={18} /> 新增學生</button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.map(s => (
                <div key={s.id} className="bg-slate-50 p-6 rounded-[24px] flex justify-between items-center border border-slate-100 group transition-all hover:bg-white hover:shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center font-black text-2xl text-slate-400 shadow-sm">{s.name.charAt(0)}</div>
                    <div>
                      <h4 className="font-black text-xl text-slate-700">{s.name}</h4>
                      <div className="flex items-center gap-1 text-amber-600 font-bold"><Coins size={14}/> {s.points} 點</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-1.5">
                      <button onClick={() => updatePoints(s.id, -5)} className="w-10 h-10 bg-rose-100 text-rose-700 rounded-xl font-black hover:bg-rose-500 hover:text-white transition-all text-sm">-5</button>
                      <button onClick={() => updatePoints(s.id, -1)} className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl font-black hover:bg-rose-400 hover:text-white transition-all text-sm">-1</button>
                      <button onClick={() => updatePoints(s.id, 1)} className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl font-black hover:bg-emerald-400 hover:text-white transition-all text-sm">+1</button>
                      <button onClick={() => updatePoints(s.id, 5)} className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl font-black hover:bg-emerald-500 hover:text-white transition-all text-sm">+5</button>
                    </div>
                    <button onClick={() => setStudents(students.filter(st => st.id !== s.id))} className="p-2 text-slate-300 hover:text-rose-500 transition-colors self-end"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'prizes' && (
          <div className="animate-in slide-in-from-right-4 duration-500 flex flex-col lg:flex-row gap-10">
            {/* Prize Workbench: Editor */}
            <div className="lg:w-1/2 space-y-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 text-amber-600">
                  <Edit3 size={24} />
                  <h3 className="text-3xl font-black">{editingPrize.id ? '修改獎品內容' : '獎品編輯器'}</h3>
                </div>
                {editingPrize.id && (
                  <button 
                    onClick={() => setEditingPrize({ name: '', price: 10, stock: 1, image: '', category: '文具' })}
                    className="flex items-center gap-1 text-slate-400 hover:text-rose-500 font-bold transition-colors"
                  >
                    <X size={18} /> 取消修改
                  </button>
                )}
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-slate-500 mb-2 uppercase tracking-widest">獎品名稱</label>
                  <input 
                    value={editingPrize.name} 
                    onChange={e => setEditingPrize({...editingPrize, name: e.target.value})}
                    placeholder="例如：神奇彩色筆" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-bold"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-black text-slate-500 mb-2 uppercase tracking-widest">所需點數</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={editingPrize.price} 
                        onChange={e => setEditingPrize({...editingPrize, price: parseInt(e.target.value) || 0})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/20 outline-none font-bold"
                      />
                      <Coins className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500" size={20} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-black text-slate-500 mb-2 uppercase tracking-widest">庫存數量 (補貨請改這裡)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={editingPrize.stock} 
                        onChange={e => setEditingPrize({...editingPrize, stock: parseInt(e.target.value) || 0})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 outline-none font-bold"
                      />
                      <Package className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" size={20} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-500 mb-2 uppercase tracking-widest">分類與圖片</label>
                  <div className="grid grid-cols-2 gap-6">
                    <select 
                      value={editingPrize.category} 
                      onChange={e => setEditingPrize({...editingPrize, category: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold cursor-pointer"
                    >
                      <option>文具</option>
                      <option>零食</option>
                      <option>玩具</option>
                      <option>特別任務</option>
                    </select>
                    <input 
                      value={editingPrize.image} 
                      onChange={e => setEditingPrize({...editingPrize, image: e.target.value})}
                      placeholder="圖片網址 (可選)" 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleSavePrize}
                  className={`w-full py-5 rounded-[24px] font-black text-xl shadow-xl transition-all flex items-center justify-center gap-3 ${
                    editingPrize.id 
                    ? 'bg-emerald-500 text-white shadow-emerald-200 hover:bg-emerald-600' 
                    : 'bg-amber-500 text-white shadow-amber-200 hover:bg-amber-600 hover:-translate-y-1'
                  }`}
                >
                  {editingPrize.id ? <><CheckCircle2 size={24} /> 儲存修改內容</> : <><ArrowRight size={24} /> 上架新獎品</>}
                </button>
              </div>

              <div className="pt-10 border-t border-slate-100">
                 <h4 className="text-xl font-black text-slate-700 mb-4">目前貨架 ({prizes.length})</h4>
                 <div className="grid grid-cols-1 gap-3">
                    {prizes.map(p => (
                      <div key={p.id} className="group bg-slate-50 pl-4 pr-2 py-3 rounded-2xl border border-slate-200 flex items-center justify-between transition-all hover:bg-white hover:shadow-md">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-slate-200 rounded-lg overflow-hidden">
                              <img src={p.image || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" />
                           </div>
                           <div>
                              <span className="font-bold text-slate-700 block">{p.name}</span>
                              <div className="flex items-center gap-3">
                                 <span className="text-xs font-bold text-amber-500 flex items-center gap-1"><Coins size={12}/>{p.price} 點</span>
                                 <span className={`text-xs font-bold flex items-center gap-1 ${p.stock <= 0 ? 'text-rose-500' : 'text-slate-400'}`}><Package size={12}/>剩餘 {p.stock}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleEditExisting(p)} 
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-amber-500 hover:bg-amber-50 transition-all"
                            title="修改內容 / 補貨"
                          >
                            <Edit3 size={18}/>
                          </button>
                          <button 
                            onClick={() => setPrizes(prizes.filter(pr => pr.id !== p.id))} 
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                            title="刪除獎品"
                          >
                            <Trash2 size={18}/>
                          </button>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>

            {/* Prize Workbench: Live Preview */}
            <div className="lg:w-1/2">
              <div className="flex items-center gap-3 text-slate-400 mb-6">
                <Eye size={24} />
                <h3 className="text-3xl font-black italic uppercase tracking-tighter">Live Preview</h3>
              </div>
              <div className="bg-slate-100/50 rounded-[48px] p-12 flex items-center justify-center border-4 border-dashed border-slate-200 min-h-[500px]">
                <div className="w-full max-w-[340px] bg-white rounded-[32px] shadow-2xl overflow-hidden animate-bounce-slow">
                   <div className="aspect-[4/3] bg-slate-200 relative">
                      <img src={editingPrize.image || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&auto=format&fit=crop&q=60'} className="w-full h-full object-cover" />
                      {editingPrize.stock === 0 && (
                        <div className="absolute inset-0 bg-rose-900/40 flex items-center justify-center backdrop-blur-[1px]">
                           <span className="bg-white text-rose-600 px-4 py-2 rounded-full font-black border-2 border-rose-600">已售完</span>
                        </div>
                      )}
                   </div>
                   <div className="p-8">
                      <div className="flex justify-between items-start mb-3">
                        <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-400">{editingPrize.category}</div>
                        <div className="text-[10px] font-black text-slate-400 flex items-center gap-1"><Package size={10}/> 剩餘 {editingPrize.stock}</div>
                      </div>
                      <h4 className="text-2xl font-black text-slate-800 mb-2">{editingPrize.name || '這裡顯示獎品名'}</h4>
                      <div className="flex items-center gap-2 mb-6">
                         <Coins size={20} className="text-amber-500" />
                         <span className="text-2xl font-black">{editingPrize.price} 點</span>
                      </div>
                      <div className="w-full h-12 bg-amber-500 rounded-[16px] flex items-center justify-center text-white font-black">學生視角預覽</div>
                   </div>
                </div>
              </div>
              <p className="mt-6 text-center text-slate-400 font-bold flex items-center justify-center gap-2"><AlertCircle size={16}/> 這是學生會在商店看到的樣式</p>
            </div>
          </div>
        )}

        {tab === 'logs' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-800">兌換流水帳</h3>
              <button onClick={() => setLogs([])} className="text-slate-400 hover:text-rose-500 font-bold">清空紀錄</button>
            </div>
            <div className="space-y-4">
               {logs.map(log => (
                 <div key={log.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex justify-between items-center transition-all hover:translate-x-2">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><CheckCircle2 size={24}/></div>
                       <div>
                          <p className="font-black text-slate-700 text-lg"><span className="text-indigo-600">{log.studentName}</span> 拿走了 <span className="text-amber-600">{log.prizeName}</span></p>
                          <p className="text-slate-400 text-sm font-medium">{log.timestamp}</p>
                       </div>
                    </div>
                    <div className="text-2xl font-black text-slate-300">-{log.cost}</div>
                 </div>
               ))}
               {logs.length === 0 && <div className="py-20 text-center text-slate-300 italic font-bold">目前還沒有任何兌換發生的紀錄。</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Custom Styles for Animations ---
const style = document.createElement('style');
style.textContent = `
  @keyframes bounce-slow {
    0%, 100% { transform: translateY(-10px); }
    50% { transform: translateY(0); }
  }
  @keyframes wavy-text {
    0%, 100% { transform: translateY(0); color: #1e293b; }
    50% { transform: translateY(-15px); color: #f59e0b; }
  }
  .animate-bounce-slow {
    animation: bounce-slow 4s ease-in-out infinite;
  }
  .animate-wavy-text {
    animation: wavy-text 2s ease-in-out infinite;
  }
`;
document.head.appendChild(style);

// --- Mount App ---
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
