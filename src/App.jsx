import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle, XCircle, Clock, BookOpen, Heart, Activity, 
  Settings, Users, ShieldCheck, FileText, Download, LogOut,
  ChevronRight, AlertCircle, Save, CheckSquare, Search,
  Database, UploadCloud, Edit, Trash2, Check, X,
  Sun, Moon, MapPin, Loader2
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, writeBatch, deleteDoc } from 'firebase/firestore';

// ==========================================
// 1. KONFIGURASI & UTILS
// ==========================================
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyDLYC_T2Sg_h9HJxg6zqDXKhZLDMlXuva8",
      authDomain: "catatanramadhan-d0b74.firebaseapp.com",
      projectId: "catatanramadhan-d0b74",
      storageBucket: "catatanramadhan-d0b74.firebasestorage.app",
      messagingSenderId: "730739240335",
      appId: "1:730739240335:web:3a34339dca97e60a39affa"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestoreDb = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'jurnal-ramadhan-aziz';

const getLocalYYYYMMDD = () => {
  const d = new Date();
  const z = d.getTimezoneOffset() * 60000;
  return new Date(d - z).toISOString().split('T')[0];
};

const DEFAULT_SETTINGS = {
  namaSekolah: 'SMK Bina Siswa Mandiri BL. Limbangan',
  tahunPelajaran: '2025/2026',
  startDate: getLocalYYYYMMDD(),
  endDate: '2026-04-07',
  minPercentage: 80,
  minActiveDays: 20,
  weights: { sholat: 40, tarawih: 10, tadarus: 20, puasa: 20, bantuOrtu: 10 },
  logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/800px-User_icon_2.svg.png',
  locationRestriction: false,
  centerLat: -6.200000,
  centerLng: 106.816666,
  radius: 50
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const rLat1 = lat1 * Math.PI/180;
  const rLat2 = lat2 * Math.PI/180;
  const dLat = (lat2-lat1) * Math.PI/180;
  const dLon = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))); 
};

const SURAH_LIST = [
  "Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa'", "Al-Ma'idah", "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Taubah", "Yunus", 
  "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra'", "Al-Kahf", "Maryam", "Taha", 
  "Al-Anbiya'", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan", "Asy-Syu'ara'", "An-Naml", "Al-Qasas", "Al-'Ankabut", "Ar-Rum", 
  "Luqman", "As-Sajdah", "Al-Ahzab", "Saba'", "Fatir", "Yasin", "As-Saffat", "Sad", "Az-Zumar", "Gafir", 
  "Fussilat", "Asy-Syura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jasiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", 
  "Az-Zariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid", "Al-Mujadilah", "Al-Hasyr", "Al-Mumtahanah", 
  "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Tagabun", "At-Talaq", "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", 
  "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddassir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba'", "An-Nazi'at", "'Abasa", 
  "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Insyiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Gasyiyah", "Al-Fajr", "Al-Balad", 
  "Asy-Syams", "Al-Lail", "Ad-Duha", "Asy-Syarh", "At-Tin", "Al-'Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-'Adiyat", 
  "Al-Qari'ah", "At-Takasur", "Al-'Asr", "Al-Humazah", "Al-Fil", "Quraisy", "Al-Ma'un", "Al-Kausar", "Al-Kafirun", "An-Nasr", 
  "Al-Lahab", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

const KEBIASAAN_LIST = [
  { id: 'bangunPagi', label: 'Bangun Pagi' },
  { id: 'beribadah', label: 'Beribadah (Dhuha/Tahajud)' },
  { id: 'berolahraga', label: 'Berolahraga' },
  { id: 'makanSehat', label: 'Makan Sehat & Bergizi' },
  { id: 'belajar', label: 'Gemar Belajar' },
  { id: 'bermasyarakat', label: 'Bermasyarakat / Sosial' },
  { id: 'tidurCepat', label: 'Tidur Cepat (Tidak Begadang)' }
];

const JURUSAN = ['TKJ', 'TKR', 'MP'];
const KELAS = ['X-A', 'X-B', 'X-C', 'XI-A', 'XI-B', 'XI-C'];

// ==========================================
// 2. SHARED COMPONENTS
// ==========================================
const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-white/70 backdrop-blur-md border border-white shadow-xl overflow-hidden ${className}`}>
    {children}
  </div>
);

const DarkModeStyles = () => (
  <style>{`
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
    .dark-theme { color-scheme: dark; }
    .dark-theme .bg-white { background-color: #1e293b !important; }
    .dark-theme .bg-white\\/60, .dark-theme .bg-white\\/70, .dark-theme .bg-white\\/80 { background-color: rgba(30, 41, 59, 0.8) !important; }
    .dark-theme .text-slate-800 { color: #f8fafc !important; }
    .dark-theme .text-slate-700 { color: #f1f5f9 !important; }
    .dark-theme .text-slate-600 { color: #cbd5e1 !important; }
    .dark-theme .text-slate-500 { color: #94a3b8 !important; }
    .dark-theme .border-slate-200, .dark-theme .border-slate-100, .dark-theme .border-white { border-color: #334155 !important; }
    .dark-theme .bg-slate-50 { background-color: #0f172a !important; }
    .dark-theme .bg-slate-100 { background-color: #1e293b !important; }
    .dark-theme input, .dark-theme select, .dark-theme textarea { background-color: #0f172a !important; color: #f8fafc !important; border-color: #334155 !important; }
    .dark-theme .bg-teal-50 { background-color: rgba(20, 184, 166, 0.1) !important; }
  `}</style>
);

const CircularProgress = ({ percentage, color = 'text-teal-500', size = 120, strokeWidth = 10, label = '' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="currentColor" strokeWidth={strokeWidth} className="text-slate-200" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} className={`transition-all duration-1000 ease-out ${color}`} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-2xl font-bold text-slate-800 drop-shadow-sm">{Math.round(percentage)}%</span>
        </div>
      </div>
      {label && <span className="mt-2 text-sm font-medium text-slate-600">{label}</span>}
    </div>
  );
};

function GlobalDialog({ dialog, onClose }) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (dialog) setInputValue('');
  }, [dialog]);

  if (!dialog) return null;
  
  const handleConfirm = () => {
    if (dialog.type === 'prompt' && inputValue !== dialog.expectedText) return;
    if (dialog.onConfirm) dialog.onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col border border-slate-200 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-4">
           {dialog.type === 'alert' ? <AlertCircle className="text-teal-500 w-8 h-8"/> : <AlertCircle className="text-amber-500 w-8 h-8"/>}
           <h3 className="text-xl font-bold text-slate-800">{dialog.type === 'alert' ? 'Informasi' : 'Perhatian'}</h3>
        </div>
        <p className="text-slate-600 mb-6 font-medium leading-relaxed">{dialog.message}</p>
        
        {dialog.type === 'prompt' && (
          <div className="mb-6">
             <label className="text-xs font-bold text-slate-500 mb-2 block uppercase">Ketik "{dialog.expectedText}" di bawah ini</label>
             <input type="text" value={inputValue} onChange={e=>setInputValue(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-teal-500 outline-none text-slate-800 font-bold" placeholder={dialog.expectedText} />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          {dialog.type !== 'alert' && (
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">Batal</button>
          )}
          <button type="button" onClick={handleConfirm} disabled={dialog.type === 'prompt' && inputValue !== dialog.expectedText} className="px-6 py-2.5 rounded-xl bg-teal-500 text-white hover:bg-teal-600 font-bold shadow-lg disabled:opacity-50 flex items-center gap-2">
            {dialog.type === 'alert' ? 'Tutup' : <><CheckSquare size={18}/> Konfirmasi</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl shadow-xl min-w-[280px] animate-fade-in-up ${t.type === 'success' ? 'bg-teal-600 text-white' : t.type === 'error' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-white'}`}>
          <div className="flex items-center gap-3">
            {t.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold text-sm tracking-wide">{t.message}</span>
          </div>
          <button onClick={() => removeToast(t.id)} className="ml-4 opacity-70 hover:opacity-100"><X size={18}/></button>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// 3. MAIN APPLICATION
// ==========================================
export default function App() {
  const [fbUser, setFbUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('ramadhanTheme') === 'dark');
  const [isLoading, setIsLoading] = useState(true);
  
  // Database States (Separated / Granular)
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [activities, setActivities] = useState([]);
  
  const [dialog, setDialog] = useState(null);
  const [toasts, setToasts] = useState([]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('ramadhanTheme', newMode ? 'dark' : 'light');
  };

  const dialogHelpers = {
    showMessage: (msg) => setDialog({ type: 'alert', message: msg }),
    showConfirm: (msg, onConfirm) => setDialog({ type: 'confirm', message: msg, onConfirm }),
    showPrompt: (msg, expected, onConfirm) => setDialog({ type: 'prompt', message: msg, expectedText: expected, onConfirm }),
    showToast: (message, type = 'success') => {
      const id = Date.now();
      setToasts(p => [...p, { id, message, type }]);
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
    }
  };

  // Auth Effect
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth error", err); }
    };
    initAuth();
    return onAuthStateChanged(auth, setFbUser);
  }, []);

  // Data Sync Effect (Granular Snapshots)
  useEffect(() => {
    if (!fbUser) return;

    const paths = {
      settings: doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'settings', 'config'),
      users: collection(firestoreDb, 'artifacts', appId, 'public', 'data', 'users'),
      attendances: collection(firestoreDb, 'artifacts', appId, 'public', 'data', 'attendances'),
      activities: collection(firestoreDb, 'artifacts', appId, 'public', 'data', 'activities')
    };

    const unsubs = [
      onSnapshot(paths.settings, (s) => {
        if (s.exists()) {
            setSettings(s.data());
        } else {
            setDoc(paths.settings, DEFAULT_SETTINGS).catch(err => console.error("Init Settings Error:", err));
        }
      }),
      onSnapshot(paths.users, (s) => {
        const uList = s.docs.map(d => ({ id: d.id, ...d.data() }));
        if (uList.length === 0) {
           const adminRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'users', 'admin');
           setDoc(adminRef, { id: 'admin', role: 'admin', username: 'admin', password: '123', name: 'Administrator' });
        }
        setUsers(uList);
      }),
      onSnapshot(paths.attendances, (s) => setAttendances(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(paths.activities, (s) => setActivities(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    ];

    setIsLoading(false);
    return () => unsubs.forEach(u => u());
  }, [fbUser]);

  // Session Persistence Effect (Mencegah "Mental" saat refresh)
  useEffect(() => {
    const savedUserId = localStorage.getItem('ramadhan_session_user');
    if (savedUserId && users.length > 0 && !currentUser) {
       const foundUser = users.find(u => u.id === savedUserId);
       if (foundUser) setCurrentUser(foundUser);
    }
  }, [users, currentUser]);

  const handleLoginSuccess = (user) => {
    localStorage.setItem('ramadhan_session_user', user.id);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('ramadhan_session_user');
    setCurrentUser(null);
  };

  if (isLoading || !settings) {
    return (
      <div className={isDarkMode ? 'dark-theme' : ''}>
        <DarkModeStyles />
        <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-gradient-to-br from-teal-50 via-sky-100 to-white text-slate-800'}`}>
           <div className="flex flex-col items-center gap-4 animate-pulse">
             <Loader2 size={48} className="animate-spin text-teal-500" />
             <h2 className="text-xl font-bold">Menghubungkan ke Database... ☁️</h2>
           </div>
        </div>
      </div>
    );
  }

  const globalDb = { users, settings, attendances, activities };

  if (!currentUser) {
    return (
      <div className={isDarkMode ? 'dark-theme' : ''}>
        <DarkModeStyles />
        <LoginScreen onLogin={handleLoginSuccess} db={globalDb} isDarkMode={isDarkMode} toggleTheme={toggleTheme} dialogHelpers={dialogHelpers} />
        <GlobalDialog dialog={dialog} onClose={() => setDialog(null)} />
        <ToastContainer toasts={toasts} removeToast={id => setToasts(prev => prev.filter(t => t.id !== id))} />
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'dark-theme' : ''}>
      <DarkModeStyles />
      <div className={`min-h-screen font-sans selection:bg-teal-200 selection:text-teal-900 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-teal-50 via-sky-50 to-white text-slate-800'}`}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className={`absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[120px] ${isDarkMode ? 'bg-teal-900/30' : 'bg-teal-200/40'}`} />
          <div className={`absolute bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[120px] ${isDarkMode ? 'bg-sky-900/30' : 'bg-sky-200/40'}`} />
        </div>
        <div className="relative z-10 flex h-screen">
          {currentUser.role === 'siswa' ? (
            <StudentDashboard user={currentUser} db={globalDb} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} dialogHelpers={dialogHelpers} />
          ) : (
            <AdminDashboard user={currentUser} db={globalDb} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} dialogHelpers={dialogHelpers} />
          )}
        </div>
        <GlobalDialog dialog={dialog} onClose={() => setDialog(null)} />
        <ToastContainer toasts={toasts} removeToast={id => setToasts(p => p.filter(t => t.id !== id))} />
      </div>
    </div>
  );
}

// ==========================================
// 4. LOGIN SCREEN
// ==========================================
function LoginScreen({ onLogin, db, isDarkMode, toggleTheme, dialogHelpers }) {
  const { showToast } = dialogHelpers;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const user = db.users.find(u => u.username === username && u.password === password);
    if (user) {
      showToast(`Selamat datang, ${user.name}! 👋`, 'success');
      onLogin(user);
    } else {
      setError('Username atau password salah!');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative ${isDarkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-teal-50 via-sky-100 to-white'}`}>
      <GlassCard className="w-full max-w-md p-8 rounded-3xl animate-fade-in-up z-10">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto bg-white rounded-full p-2 shadow-lg border-2 border-teal-100 mb-4 overflow-hidden flex items-center justify-center">
            <img src={db.settings.logoUrl || DEFAULT_SETTINGS.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain rounded-full" onError={(e) => e.target.src = 'https://via.placeholder.com/80'} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">Jurnal Ramadhan</h1>
          <h2 className="text-sm font-bold text-teal-600 mb-2 uppercase tracking-wide">{db.settings.namaSekolah}</h2>
          <p className="text-xs font-bold text-slate-500 mb-3 bg-slate-100 inline-block px-3 py-1 rounded-full text-slate-700">Tahun Pelajaran: {db.settings.tahunPelajaran}</p>
        </div>
        
        {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm text-center">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white/80 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all" placeholder="Masukkan username" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/80 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all" placeholder="••••••••" required />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-teal-400 to-sky-500 hover:from-teal-500 hover:to-sky-600 text-white font-bold rounded-xl px-4 py-3 shadow-lg transform transition hover:-translate-y-0.5">
            Masuk
          </button>
        </form>
      </GlassCard>
      
      <button type="button" onClick={toggleTheme} className="absolute top-6 right-6 p-3 rounded-full bg-white/50 backdrop-blur border border-slate-200 shadow-lg text-slate-800 z-20">
        {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>
      <div className="absolute bottom-6 text-center w-full text-xs font-medium text-slate-500 z-10">
        &copy; {new Date().getFullYear()} {db.settings.namaSekolah}. All rights reserved.
      </div>
    </div>
  );
}

// ==========================================
// 5. STUDENT DASHBOARD
// ==========================================
function StudentDashboard({ user, db, onLogout, isDarkMode, toggleTheme, dialogHelpers }) {
  const [activeTab, setActiveTab] = useState('input');
  const todayDate = getLocalYYYYMMDD();

  const myAttendance = db.attendances.find(a => a.studentId === user.id && a.date === todayDate);
  const myActivity = db.activities.find(a => a.studentId === user.id && a.date === todayDate);

  const calculateProgress = () => {
    let totalScore = 0;
    let daysCount = 0;
    const { weights, startDate, endDate } = db.settings;

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const todayObj = new Date(todayDate + 'T00:00:00');
    const totalProgramDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);

    let elapsedDays = 1;
    if (todayObj < start) {
       elapsedDays = 1; 
    } else if (todayObj > end) {
       elapsedDays = totalProgramDays; 
    } else {
       elapsedDays = Math.max(1, Math.round((todayObj - start) / (1000 * 60 * 60 * 24)) + 1);
    }

    const myActivities = db.activities.filter(a => a.studentId === user.id && !a.isDraft);
    
    myActivities.forEach(act => {
      daysCount++;
      // PROTEKSI CRASH: Menggunakan fallback object (|| {}) agar tidak error saat baca data lama
      const data = act.data || {};
      let dayScore = 0;
      
      const sholatCount = Object.values(data.sholat || {}).filter(Boolean).length;
      dayScore += (sholatCount / 5) * (weights.sholat || 40);
      
      if (data.tarawih) dayScore += (weights.tarawih || 10);
      if (data.tadarus?.startSurah) dayScore += (weights.tadarus || 20);
      if (['ya', 'sakit', 'haid'].includes(data.puasa?.status)) dayScore += (weights.puasa || 20);
      if (data.bantuOrtu?.status === 'ya') dayScore += (weights.bantuOrtu || 10);
      
      totalScore += dayScore;
    });

    const calculatedAvg = totalScore / elapsedDays;
    const manualBonus = (user.manualProgress !== undefined && user.manualProgress !== null && user.manualProgress !== '') 
      ? Number(user.manualProgress) : 0;
    
    return { 
      averageProgress: Math.min(100, calculatedAvg + manualBonus), 
      daysCount,
      totalProgramDays,
      elapsedDays
    };
  };

  const progressData = calculateProgress();

  return (
    <div className="flex flex-col md:flex-row w-full h-full overflow-hidden">
      <div className="w-full md:w-64 bg-white/60 backdrop-blur-md border-b md:border-r border-slate-200/50 flex flex-col shadow-sm shrink-0 z-20">
        <div className="p-4 md:p-6 border-b border-slate-200/50 flex justify-between items-center md:block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-teal-400 to-sky-500 rounded-full flex items-center justify-center text-lg md:text-xl font-bold text-white shadow-md">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm truncate w-32 md:w-36">{user.name}</h2>
              <span className="text-xs text-slate-500 font-medium">{user.kelas} | {user.jurusan}</span>
            </div>
          </div>
          <div className="md:hidden flex gap-2">
            <button type="button" onClick={toggleTheme} className="p-2 text-slate-600 hover:bg-slate-200 rounded-xl transition-all">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button type="button" onClick={onLogout} className="p-2 text-red-500 hover:bg-red-100 rounded-xl transition-all">
              <LogOut size={20} />
            </button>
          </div>
        </div>
        
        <nav className="flex-none md:flex-1 p-2 md:p-4 flex flex-row md:flex-col gap-2 overflow-x-auto">
          {[
            { id: 'input', icon: Activity, label: 'Kegiatan Hari Ini' },
            { id: 'progress', icon: Clock, label: 'Progress Saya' },
            { id: 'riwayat', icon: BookOpen, label: 'Riwayat' },
            { id: 'sertifikat', icon: FileText, label: 'Sertifikat' },
          ].map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex-shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-teal-400 to-sky-500 text-white shadow-md shadow-teal-500/20' : 'text-slate-600 hover:bg-white/80 hover:text-teal-600'}`}>
              <tab.icon size={18} className="md:w-5 md:h-5" /> <span className="font-semibold text-sm whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="hidden md:block p-4 border-t border-slate-200/50">
          <button type="button" onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-semibold mb-2">
            {isDarkMode ? <><Sun size={20} /> <span>Mode Terang</span></> : <><Moon size={20} /> <span>Mode Gelap</span></>}
          </button>
          <button type="button" onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-semibold">
            <LogOut size={20} /> <span>Keluar</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {activeTab === 'input' && <StudentInputTab user={user} db={db} todayDate={todayDate} myAttendance={myAttendance} myActivity={myActivity} dialogHelpers={dialogHelpers} />}
          {activeTab === 'progress' && <StudentProgressTab progressData={progressData} activities={db.activities.filter(a => a.studentId === user.id && !a.isDraft)} user={user} />}
          {activeTab === 'riwayat' && <StudentHistoryTab activities={db.activities.filter(a => a.studentId === user.id)} />}
          {activeTab === 'sertifikat' && <StudentCertificateTab user={user} settings={db.settings} progressData={progressData} />}
          <div className="text-center text-xs font-medium text-slate-400 pt-8 pb-4">
            &copy; {new Date().getFullYear()} {db.settings.namaSekolah}. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentInputTab({ user, db, todayDate, myAttendance, myActivity, dialogHelpers }) {
  const { showMessage, showConfirm, showToast } = dialogHelpers;
  const [attendanceForm, setAttendanceForm] = useState('hadir');
  const [isLocating, setIsLocating] = useState(false);

  const { startDate, endDate, locationRestriction, centerLat, centerLng, radius } = db.settings;
  const isBeforeStart = todayDate < startDate;
  const isAfterEnd = todayDate > endDate;

  if (isBeforeStart) {
    return (
      <GlassCard className="p-8 text-center max-w-lg mx-auto mt-20 border-sky-100 rounded-3xl animate-fade-in-up">
         <Clock className="w-16 h-16 text-sky-500 mx-auto mb-4" />
         <h2 className="text-2xl font-bold text-slate-800 mb-2">Program Belum Dimulai ⏳</h2>
         <p className="text-slate-600">Jurnal Ramadhan baru dapat diisi mulai tanggal <b>{new Date(startDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</b>.</p>
      </GlassCard>
    );
  }

  if (isAfterEnd) {
    return (
      <GlassCard className="p-8 text-center max-w-lg mx-auto mt-20 border-rose-100 rounded-3xl animate-fade-in-up">
         <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
         <h2 className="text-2xl font-bold text-slate-800 mb-2">Program Telah Berakhir 🛑</h2>
         <p className="text-slate-600">Pengisian Jurnal Ramadhan telah ditutup sejak tanggal <b>{new Date(endDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</b>.</p>
      </GlassCard>
    );
  }
  
  const defaultActivity = {
    sholat: { subuh: false, dzuhur: false, ashar: false, maghrib: false, isya: false },
    tarawih: false,
    tadarus: { startSurah: '', startAyah: '', endSurah: '', endAyah: '' },
    puasa: { status: 'ya', reason: '' },
    bantuOrtu: { status: 'ya', desc: '' },
    kebiasaan: KEBIASAAN_LIST.reduce((acc, k) => ({ ...acc, [k.id]: { checked: false, desc: '' } }), {}),
    refleksi: ''
  };

  const [formData, setFormData] = useState(myActivity ? myActivity.data : defaultActivity);

  const submitAttendance = (locationData = null) => {
    const id = `${user.id}_${todayDate}`;
    const ref = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'attendances', id);
    setDoc(ref, {
      id: id,
      date: todayDate,
      studentId: user.id,
      status: attendanceForm,
      approved: false,
      location: locationData
    }).then(() => showToast('Absensi berhasil dikirim! Menunggu persetujuan admin.', 'success'))
      .catch((err) => showToast('Gagal mengirim absensi: ' + err.message, 'error'));
  };

  const handleAbsen = () => {
    if (attendanceForm === 'hadir') {
      if (!navigator.geolocation) {
        if (locationRestriction) {
          showMessage('Browser Anda tidak mendukung GPS. Absensi ditolak karena pembatasan lokasi aktif.');
          return;
        } else {
          submitAttendance();
          return;
        }
      }
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          
          if (locationRestriction) {
            const distance = calculateDistance(userLat, userLng, centerLat, centerLng);
            if (distance <= (radius || 50)) {
              submitAttendance({ lat: userLat, lng: userLng, distance: Math.round(distance) });
            } else {
              showMessage(`Absensi Gagal! ❌ Jarak Anda ${Math.round(distance)} meter dari area absensi (Batas maksimal: ${radius}m). Silakan masuk ke area yang ditentukan.`);
            }
          } else {
            submitAttendance({ lat: userLat, lng: userLng });
          }
        },
        (err) => {
          setIsLocating(false);
          if (locationRestriction) {
            showMessage('Gagal mendapatkan lokasi GPS. Pastikan Anda mengizinkan akses lokasi. Absensi ditolak karena pembatasan radius aktif.');
          } else {
            submitAttendance();
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      submitAttendance();
    }
  };

  const handleSaveActivity = (isDraft) => {
    const id = `${user.id}_${todayDate}`;
    const ref = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'activities', id);
    setDoc(ref, {
      id: id,
      date: todayDate,
      studentId: user.id,
      isDraft: isDraft,
      timestamp: new Date().toISOString(),
      data: formData
    }).then(() => showToast(isDraft ? "Draft berhasil disimpan! 📝" : "Kegiatan berhasil disimpan permanen 🔒", "success"))
      .catch((err) => showToast("Gagal menyimpan aktivitas: " + err.message, "error"));
  };

  const isFormLocked = myActivity && !myActivity.isDraft;
  const isApproved = myAttendance && myAttendance.approved;

  if (!myAttendance) {
    return (
      <GlassCard className="p-8 text-center max-w-lg mx-auto mt-20 border-teal-100 rounded-3xl animate-fade-in-up">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Absensi Hari Ini 📅</h2>
        <div className="flex gap-4 justify-center mb-8">
          {['hadir', 'izin', 'sakit'].map(status => {
             const emoji = status === 'hadir' ? '🙋‍♂️' : status === 'izin' ? '💌' : '🤒';
             return (
             <label key={status} className={`flex-1 cursor-pointer p-4 rounded-xl border-2 transition-all ${attendanceForm === status ? 'border-teal-400 bg-teal-50 text-teal-800 shadow-sm' : 'border-slate-200 bg-white hover:border-teal-200 text-slate-600'}`}>
                <input type="radio" name="absen" value={status} className="hidden" checked={attendanceForm === status} onChange={() => setAttendanceForm(status)} />
                <span className="capitalize font-bold flex flex-col items-center gap-2 text-lg"><span>{emoji}</span> <span>{status}</span></span>
             </label>
             )
          })}
        </div>
        <button type="button" onClick={handleAbsen} disabled={isLocating} className="w-full bg-gradient-to-r from-teal-400 to-sky-500 hover:from-teal-500 hover:to-sky-600 py-3 rounded-xl font-bold text-white shadow-lg shadow-teal-500/30 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all">
          {isLocating ? <><Loader2 className="animate-spin" size={20} /> Mencari Lokasi...</> : 'Kirim Absensi 🚀'}
        </button>
      </GlassCard>
    );
  }

  if (!isApproved) {
    return (
      <GlassCard className="p-8 text-center max-w-lg mx-auto mt-20 border-yellow-200 rounded-3xl animate-fade-in-up">
        <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Menunggu Persetujuan ⏳</h2>
        <p className="text-slate-600">Admin sedang memverifikasi absensi Anda ({myAttendance.status}). Menu input kegiatan akan terbuka setelah disetujui.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-8 relative rounded-3xl border-white animate-fade-in-up">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Jurnal Kegiatan Ramadhan 📝</h2>
          <p className="text-slate-500 font-medium">Tanggal: {new Date(todayDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        {isFormLocked && <span className="bg-teal-50 text-teal-700 px-4 py-2 rounded-xl font-bold border border-teal-200 flex items-center gap-2"><CheckCircle size={18}/> Tersimpan Permanen 🔒</span>}
      </div>

      <div className={`space-y-8 ${isFormLocked ? 'opacity-70 pointer-events-none' : ''}`}>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/60 p-5 rounded-2xl border border-teal-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock size={18} className="text-sky-500"/> Sholat Wajib 🕌</h3>
            <div className="flex flex-wrap gap-4">
              {['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'].map(waktu => (
                <label key={waktu} className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input type="checkbox" checked={formData.sholat[waktu]} onChange={e => setFormData({...formData, sholat: {...formData.sholat, [waktu]: e.target.checked}})} className="w-5 h-5 rounded border-slate-300 text-teal-500 focus:ring-teal-500" />
                  <span className="capitalize">{waktu}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="bg-white/60 p-5 rounded-2xl border border-teal-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity size={18} className="text-indigo-400"/> Tarawih 🌙</h3>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
              <input type="checkbox" checked={formData.tarawih} onChange={e => setFormData({...formData, tarawih: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-teal-500 focus:ring-teal-500" />
              <span>Saya melaksanakan Sholat Tarawih hari ini</span>
            </label>
          </div>
        </div>

        <div className="bg-white/60 p-5 rounded-2xl border border-teal-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><BookOpen size={18} className="text-teal-500"/> Tadarus Al-Quran 📖</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-600">Mulai Surah</label>
              <select value={formData.tadarus.startSurah} onChange={e => setFormData({...formData, tadarus: {...formData.tadarus, startSurah: e.target.value}})} className="w-full bg-white rounded-xl p-2.5 mt-1 border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:outline-none text-slate-700">
                <option value="">Pilih Surah...</option>
                {SURAH_LIST.map((s, i) => <option key={i} value={s}>{i+1}. {s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600">Ayat</label>
              <input type="number" value={formData.tadarus.startAyah} onChange={e => setFormData({...formData, tadarus: {...formData.tadarus, startAyah: e.target.value}})} className="w-full bg-white rounded-xl p-2.5 mt-1 border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:outline-none text-slate-700" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600">Sampai Surah</label>
              <select value={formData.tadarus.endSurah} onChange={e => setFormData({...formData, tadarus: {...formData.tadarus, endSurah: e.target.value}})} className="w-full bg-white rounded-xl p-2.5 mt-1 border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:outline-none text-slate-700">
                <option value="">Pilih Surah...</option>
                {SURAH_LIST.map((s, i) => <option key={i} value={s}>{i+1}. {s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600">Ayat</label>
              <input type="number" value={formData.tadarus.endAyah} onChange={e => setFormData({...formData, tadarus: {...formData.tadarus, endAyah: e.target.value}})} className="w-full bg-white rounded-xl p-2.5 mt-1 border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:outline-none text-slate-700" />
            </div>
          </div>
        </div>

        <div className="bg-white/60 p-5 rounded-2xl border border-teal-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Puasa Hari Ini? 🍽️</h3>
          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2 text-slate-700 font-medium"><input type="radio" checked={formData.puasa.status === 'ya'} onChange={() => setFormData({...formData, puasa: {status: 'ya', reason: ''}})} name="puasa" className="text-teal-500 focus:ring-teal-500" /> Ya</label>
            <label className="flex items-center gap-2 text-slate-700 font-medium"><input type="radio" checked={formData.puasa.status !== 'ya'} onChange={() => setFormData({...formData, puasa: {status: 'tidak', reason: 'tidak ada'}})} name="puasa" className="text-teal-500 focus:ring-teal-500" /> Tidak</label>
          </div>
          {formData.puasa.status !== 'ya' && (
            <div className="w-full sm:w-64">
              <label className="text-sm font-semibold text-slate-600">Alasan</label>
              <select value={formData.puasa.status === 'tidak' ? 'tidak ada' : formData.puasa.status} onChange={e => setFormData({...formData, puasa: {status: e.target.value, reason: ''}})} className="w-full bg-white rounded-xl p-2.5 mt-1 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none">
                <option value="tidak ada">Tidak ada keterangan (0%)</option>
                <option value="sakit">Sakit (100%)</option>
                <option value="haid">Haid (100%)</option>
              </select>
            </div>
          )}
        </div>

        <div className="bg-white/60 p-5 rounded-2xl border border-teal-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Heart size={18} className="text-pink-500"/> Membantu Orang Tua 💖</h3>
          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2 text-slate-700 font-medium"><input type="radio" checked={formData.bantuOrtu.status === 'ya'} onChange={() => setFormData({...formData, bantuOrtu: {...formData.bantuOrtu, status: 'ya'}})} name="bantu" className="text-teal-500 focus:ring-teal-500" /> Ya</label>
            <label className="flex items-center gap-2 text-slate-700 font-medium"><input type="radio" checked={formData.bantuOrtu.status === 'tidak'} onChange={() => setFormData({...formData, bantuOrtu: {status: 'tidak', desc: ''}})} name="bantu" className="text-teal-500 focus:ring-teal-500" /> Tidak</label>
          </div>
          {formData.bantuOrtu.status === 'ya' && (
            <textarea placeholder="Deskripsikan bantuan yang anda lakukan..." value={formData.bantuOrtu.desc} onChange={e => setFormData({...formData, bantuOrtu: {...formData.bantuOrtu, desc: e.target.value}})} className="w-full bg-white rounded-xl p-3 border border-slate-200 min-h-[80px] focus:ring-2 focus:ring-teal-400 focus:outline-none text-slate-800 placeholder-slate-400" />
          )}
        </div>

        <div className="bg-white/60 p-5 rounded-2xl border border-teal-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">7 Kebiasaan Anak Indonesia Hebat 🌟</h3>
          <div className="space-y-4">
            {KEBIASAAN_LIST.map(k => (
              <div key={k.id} className="p-3 bg-white/40 rounded-xl border border-slate-200/50 hover:border-teal-200 transition-colors">
                <label className="flex items-center gap-3 cursor-pointer mb-2 text-slate-700">
                  <input type="checkbox" checked={formData.kebiasaan[k.id]?.checked || false} onChange={e => setFormData({...formData, kebiasaan: {...formData.kebiasaan, [k.id]: {checked: e.target.checked, desc: formData.kebiasaan[k.id]?.desc || ''}}})} className="w-5 h-5 rounded border-slate-300 text-teal-500 focus:ring-teal-500" />
                  <span className="font-semibold">{k.label}</span>
                </label>
                {formData.kebiasaan[k.id]?.checked && (
                   <input type="text" placeholder={`Deskripsi ${k.label.toLowerCase()}...`} value={formData.kebiasaan[k.id]?.desc || ''} onChange={e => setFormData({...formData, kebiasaan: {...formData.kebiasaan, [k.id]: {...formData.kebiasaan[k.id], desc: e.target.value}}})} className="w-full bg-white rounded-lg p-2.5 ml-8 border border-slate-200 max-w-lg text-sm text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/60 p-5 rounded-2xl border border-teal-100 shadow-sm">
           <h3 className="font-bold text-slate-800 mb-4">Apa yang Anda dapatkan hari ini? 💭</h3>
           <textarea value={formData.refleksi} onChange={e => setFormData({...formData, refleksi: e.target.value})} className="w-full bg-white rounded-xl p-4 border border-slate-200 min-h-[120px] focus:ring-2 focus:ring-teal-400 focus:outline-none text-slate-800 placeholder-slate-400" placeholder="Tuliskan pelajaran, hikmah, atau perasaan Anda hari ini..." />
        </div>

      </div>

      {!isFormLocked && (
        <div className="mt-8 flex gap-4 pt-6 border-t border-slate-200">
          <button type="button" onClick={() => handleSaveActivity(true)} className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"><Save size={20}/> Save Draft 📝</button>
          <button type="button" onClick={() => showConfirm('Simpan permanen? Data hari ini tidak bisa diubah lagi.', () => handleSaveActivity(false))} className="flex-1 bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2 transition-all"><CheckSquare size={20}/> Save Permanen 🔒</button>
        </div>
      )}
    </GlassCard>
  );
}

function StudentProgressTab({ progressData, activities, user }) {
  let kebiasaanScore = 0;
  let sholatTotal = 0, tarawihTotal = 0, tadarusTotal = 0, puasaTotal = 0, bantuTotal = 0;
  
  const elapsedDays = progressData.elapsedDays;

  if (activities.length > 0) {
     let totalChecks = 0;
     activities.forEach(a => {
        // PERLINDUNGAN CRASH: Gunakan fallback || {} 
        const data = a.data || {};
        Object.values(data.kebiasaan || {}).forEach(k => { if(k?.checked) totalChecks++ });
        
        const sholatCount = Object.values(data.sholat || {}).filter(Boolean).length;
        sholatTotal += (sholatCount / 5);
        if (data.tarawih) tarawihTotal++;
        if (data.tadarus?.startSurah) tadarusTotal++;
        if (['ya', 'sakit', 'haid'].includes(data.puasa?.status)) puasaTotal++;
        if (data.bantuOrtu?.status === 'ya') bantuTotal++;
     });
     kebiasaanScore = (totalChecks / (elapsedDays * 7)) * 100;
  }

  const getPerc = (val) => elapsedDays > 0 ? (val / elapsedDays) * 100 : 0;

  const details = [
    { label: 'Sholat Wajib', icon: Clock, perc: getPerc(sholatTotal), color: 'bg-sky-500', iconColor: 'text-sky-500' },
    { label: 'Tarawih', icon: Activity, perc: getPerc(tarawihTotal), color: 'bg-indigo-400', iconColor: 'text-indigo-400' },
    { label: 'Tadarus Al-Quran', icon: BookOpen, perc: getPerc(tadarusTotal), color: 'bg-teal-500', iconColor: 'text-teal-500' },
    { label: 'Puasa', icon: CheckCircle, perc: getPerc(puasaTotal), color: 'bg-amber-500', iconColor: 'text-amber-500' },
    { label: 'Bantu Orang Tua', icon: Heart, perc: getPerc(bantuTotal), color: 'bg-pink-500', iconColor: 'text-pink-500' },
  ];

  const isManual = user.manualProgress !== undefined && user.manualProgress !== null && user.manualProgress !== '' && Number(user.manualProgress) > 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-8 flex items-center justify-center flex-col text-center rounded-3xl border-teal-100 relative">
          {isManual && <span className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">Bonus: +{user.manualProgress}%</span>}
          <h3 className="text-xl font-bold text-slate-800 mb-6">Progress Ibadah Utama</h3>
          <CircularProgress percentage={progressData.averageProgress} size={180} strokeWidth={15} color="text-teal-500" />
          <p className="mt-4 text-slate-500 text-sm font-medium">
            Progres rata-rata dari {progressData.elapsedDays} hari yang telah berjalan.<br/>
            <span className="text-xs opacity-70 mt-1 block">(Total program: {progressData.totalProgramDays} hari | Baru diisi: {progressData.daysCount} hari)</span>
          </p>
        </GlassCard>
        <GlassCard className="p-8 flex items-center justify-center flex-col text-center rounded-3xl border-sky-100">
          <h3 className="text-xl font-bold text-slate-800 mb-6">Progress 7 Kebiasaan</h3>
          <CircularProgress percentage={kebiasaanScore} size={180} strokeWidth={15} color="text-sky-500" />
          <p className="mt-4 text-slate-500 text-sm font-medium">Progres pelaksanaan kebiasaan keseluruhan sejauh ini.</p>
        </GlassCard>
      </div>

      {activities.length > 0 && (
        <GlassCard className="p-8 rounded-3xl border border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Activity className="text-teal-500"/> Rincian Keseluruhan Progress Ibadah</h3>
          <div className="space-y-5">
            {details.map((d, i) => (
              <div key={i}>
                <div className="flex justify-between items-center text-sm font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-2"><d.icon size={16} className={d.iconColor} /> {d.label}</span>
                  <span>{d.perc.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div className={`${d.color} h-3 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${Math.min(100, d.perc)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function StudentHistoryTab({ activities }) {
  if (activities.length === 0) return <GlassCard className="p-8 text-center text-slate-500 font-medium rounded-3xl animate-fade-in-up">Belum ada riwayat aktivitas.</GlassCard>;

  return (
    <div className="space-y-4 animate-fade-in-up">
      {activities.sort((a,b) => new Date(b.date) - new Date(a.date)).map((act, i) => (
        <GlassCard key={i} className="p-6 relative rounded-2xl border-white shadow-sm">
          {act.isDraft && <span className="absolute top-4 right-4 text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200">DRAFT</span>}
          <div className="flex gap-4 border-b border-slate-200 pb-4 mb-4">
             <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-center min-w-[80px] shadow-sm">
                <div className="text-xs uppercase text-teal-600 font-bold mb-1">Tanggal</div>
                <div className="font-black text-2xl text-teal-800">{new Date(act.date).getDate()}</div>
             </div>
             <div>
               <h4 className="font-bold text-lg text-slate-800 mb-1">Catatan Refleksi:</h4>
               <p className="text-slate-600 text-sm italic">"{act.data?.refleksi || 'Tidak ada catatan'}"</p>
             </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-medium text-slate-700">
             <div><span className="text-slate-400 block text-xs uppercase mb-1">Puasa</span> {act.data?.puasa?.status || '-'}</div>
             <div><span className="text-slate-400 block text-xs uppercase mb-1">Tarawih</span> {act.data?.tarawih ? 'Ya' : 'Tidak'}</div>
             <div><span className="text-slate-400 block text-xs uppercase mb-1">Bantu Ortu</span> {act.data?.bantuOrtu?.status || '-'}</div>
             <div><span className="text-slate-400 block text-xs uppercase mb-1">Tadarus</span> {act.data?.tadarus?.startSurah ? `${act.data.tadarus.startSurah} - ${act.data.tadarus.endSurah}` : '-'}</div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function StudentCertificateTab({ user, settings, progressData }) {
  const today = new Date();
  const endDate = new Date(settings.endDate);
  const isPeriodEnded = today > endDate;
  const meetsTarget = progressData.averageProgress >= settings.minPercentage && progressData.daysCount >= settings.minActiveDays;
  
  const canDownload = isPeriodEnded && (meetsTarget || user.ignoreTarget);

  return (
    <GlassCard className="p-10 text-center rounded-3xl border-white animate-fade-in-up">
      <div className="max-w-md mx-auto">
         <ShieldCheck className="w-24 h-24 mx-auto mb-6 text-teal-500 drop-shadow-sm" />
         <h2 className="text-3xl font-bold text-slate-800 mb-2">Sertifikat Kelulusan</h2>
         <p className="text-slate-500 font-medium">Program Kegiatan Ramadhan</p>
         
         <div className="bg-white/80 rounded-2xl p-6 my-8 border border-teal-100 shadow-sm">
           <CircularProgress percentage={progressData.averageProgress} size={140} color="text-teal-500" label="Pencapaian Akhir" />
           <div className="mt-4 font-semibold text-slate-600">
             Hari aktif: {progressData.daysCount} / Syarat: {settings.minActiveDays} hari
           </div>
         </div>

         {!isPeriodEnded ? (
           <div className="bg-sky-50 text-sky-800 border border-sky-200 p-4 rounded-xl text-sm font-medium">
             Periode Ramadhan belum selesai. Sertifikat akan tersedia setelah tanggal {new Date(settings.endDate).toLocaleDateString('id-ID')}. Terus semangat beribadah!
           </div>
         ) : canDownload ? (
           <div>
             {user.certLink || user.allowDownload ? (
               <a href={user.certLink || '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-400 to-sky-500 text-white font-bold px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-transform">
                 <Download size={24}/> Download Sertifikat
               </a>
             ) : (
               <div className="bg-teal-50 text-teal-800 border border-teal-200 p-4 rounded-xl text-sm font-medium">
                 Anda memenuhi kriteria! Menunggu admin mengunggah link sertifikat Anda.
               </div>
             )}
           </div>
         ) : (
           <div className="bg-rose-50 text-rose-800 border border-rose-200 p-4 rounded-xl font-medium">
             <h4 className="font-bold mb-1">Tetap Semangat!</h4>
             <p className="text-sm">Anda belum mencapai target minimal kelulusan ({settings.minPercentage}% dan {settings.minActiveDays} hari).</p>
           </div>
         )}
      </div>
    </GlassCard>
  );
}

// ==========================================
// 6. ADMIN DASHBOARD
// ==========================================
function AdminDashboard({ user, db, onLogout, isDarkMode, toggleTheme, dialogHelpers }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const allStudents = db.users.filter(u => u.role === 'siswa');
  const todayDate = getLocalYYYYMMDD();
  const activeToday = db.attendances.filter(a => a.date === todayDate && a.status === 'hadir').length;
  
  const getStudentProgress = (studentId) => {
    const student = allStudents.find(s => s.id === studentId);
    let manualBonus = 0;
    if (student && student.manualProgress !== undefined && student.manualProgress !== null && student.manualProgress !== '') {
      manualBonus = Number(student.manualProgress);
    }

    let totalScore = 0;
    const { weights, startDate, endDate } = db.settings;
    
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const todayObj = new Date(todayDate + 'T00:00:00');

    let elapsedDays = 1;
    if (todayObj < start) {
       elapsedDays = 1; 
    } else if (todayObj > end) {
       elapsedDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1); 
    } else {
       elapsedDays = Math.max(1, Math.round((todayObj - start) / (1000 * 60 * 60 * 24)) + 1);
    }

    const activities = db.activities.filter(a => a.studentId === studentId && !a.isDraft);
    
    activities.forEach(act => {
      // PROTEKSI CRASH UNTUK ADMIN
      const data = act.data || {};
      let dayScore = 0;
      const sholatCount = Object.values(data.sholat || {}).filter(Boolean).length;
      dayScore += (sholatCount / 5) * (weights.sholat || 40);
      if (data.tarawih) dayScore += (weights.tarawih || 10);
      if (data.tadarus?.startSurah) dayScore += (weights.tadarus || 20);
      if (['ya', 'sakit', 'haid'].includes(data.puasa?.status)) dayScore += (weights.puasa || 20);
      if (data.bantuOrtu?.status === 'ya') dayScore += (weights.bantuOrtu || 10);
      totalScore += dayScore;
    });
    
    const calculatedAvg = totalScore / elapsedDays;
    return Math.min(100, calculatedAvg + manualBonus);
  };

  const studentsWithProgress = allStudents.map(s => ({ ...s, progress: getStudentProgress(s.id) }));
  const schoolAvg = studentsWithProgress.length ? studentsWithProgress.reduce((sum, s) => sum + s.progress, 0) / studentsWithProgress.length : 0;
  const passedTarget = studentsWithProgress.filter(s => s.progress >= db.settings.minPercentage).length;

  const classStats = KELAS.map(k => {
    const studentsInClass = studentsWithProgress.filter(s => s.kelas === k);
    const avg = studentsInClass.length ? studentsInClass.reduce((sum, s) => sum + s.progress, 0) / studentsInClass.length : 0;
    return { name: k, avg };
  });

  return (
    <div className="flex flex-col md:flex-row w-full h-full overflow-hidden">
      {/* Sidebar Admin */}
      <div className="w-full md:w-72 bg-white/80 backdrop-blur-xl border-b md:border-r border-slate-200 flex flex-col shadow-sm shrink-0 z-20">
        <div className="p-4 md:p-6 border-b border-slate-200 flex justify-between items-center md:block text-center">
          <div className="flex items-center gap-3 md:justify-center md:flex-col">
            <ShieldCheck className="w-8 h-8 md:w-12 md:h-12 text-teal-500 md:mb-2 drop-shadow-sm" />
            <h2 className="font-bold text-slate-800 md:text-lg text-sm">Admin Panel</h2>
          </div>
          <div className="md:hidden flex gap-2">
            <button type="button" onClick={toggleTheme} className="p-2 text-slate-600 hover:bg-slate-200 rounded-xl transition-all">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button type="button" onClick={onLogout} className="p-2 text-red-500 hover:bg-red-100 rounded-xl transition-all">
              <LogOut size={20} />
            </button>
          </div>
        </div>
        
        <nav className="flex-none md:flex-1 p-2 md:p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto">
          {[
            { id: 'dashboard', icon: Activity, label: 'Dashboard & Statistik' },
            { id: 'approval', icon: CheckSquare, label: 'Approve Kehadiran', alert: db.attendances.filter(a => !a.approved).length },
            { id: 'siswa', icon: Users, label: 'Manajemen Siswa' },
            { id: 'monitoring', icon: Database, label: 'Monitoring Rekap' },
            { id: 'monitoring_detail', icon: Search, label: 'Monitoring Detail' },
            { id: 'pengaturan', icon: Settings, label: 'Pengaturan Sistem' },
          ].map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex-shrink-0 md:w-full flex items-center justify-between px-3 md:px-4 py-2 md:py-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' : 'text-slate-600 hover:bg-teal-50 hover:text-teal-700 font-medium'}`}>
              <div className="flex items-center gap-2 md:gap-3"><tab.icon size={18} className="md:w-5 md:h-5" /> <span className="text-sm whitespace-nowrap">{tab.label}</span></div>
              {tab.alert > 0 && <span className="ml-2 bg-rose-500 text-white text-xs font-bold px-2 py-0.5 md:py-1 rounded-full">{tab.alert}</span>}
            </button>
          ))}
        </nav>
        
        <div className="hidden md:block p-4 border-t border-slate-200">
          <button type="button" onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-semibold mb-2">
            {isDarkMode ? <><Sun size={20} /> <span>Mode Terang</span></> : <><Moon size={20} /> <span>Mode Gelap</span></>}
          </button>
          <button type="button" onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold">
            <LogOut size={20} /> <span className="font-medium">Keluar Admin</span>
          </button>
        </div>
      </div>

      {/* Main Content Admin */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {activeTab === 'dashboard' && (
            <div className="animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <GlassCard className="p-6 border-t-4 border-t-sky-500 rounded-2xl animate-fade-in-up"><div className="text-slate-500 font-semibold text-sm mb-1">Total Siswa</div><div className="text-3xl font-black text-slate-800">{allStudents.length}</div></GlassCard>
                <GlassCard className="p-6 border-t-4 border-t-teal-500 rounded-2xl animate-fade-in-up animate-delay-100"><div className="text-slate-500 font-semibold text-sm mb-1">Aktif Hari Ini</div><div className="text-3xl font-black text-slate-800">{activeToday}</div></GlassCard>
                <GlassCard className="p-6 border-t-4 border-t-indigo-500 rounded-2xl animate-fade-in-up animate-delay-200"><div className="text-slate-500 font-semibold text-sm mb-1">Rata-rata Sekolah</div><div className="text-3xl font-black text-slate-800">{schoolAvg.toFixed(1)}%</div></GlassCard>
                <GlassCard className="p-6 border-t-4 border-t-amber-500 rounded-2xl animate-fade-in-up"><div className="text-slate-500 font-semibold text-sm mb-1">Lulus Target ({'>'}={db.settings.minPercentage}%)</div><div className="text-3xl font-black text-slate-800">{passedTarget}</div></GlassCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <GlassCard className="p-6 rounded-3xl animate-fade-in-up animate-delay-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity className="text-teal-500"/> Top 5 Siswa Terbaik</h3>
                  <div className="space-y-3">
                    {studentsWithProgress.sort((a,b) => b.progress - a.progress).slice(0, 5).map((s, i) => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${i===0?'bg-amber-100 text-amber-600': i===1?'bg-slate-200 text-slate-600': i===2?'bg-orange-100 text-orange-700':'bg-teal-50 text-teal-600'}`}>#{i+1}</div>
                          <div><div className="font-bold text-slate-800">{s.name}</div><div className="text-xs text-slate-500 font-medium">{s.kelas} - {s.jurusan}</div></div>
                        </div>
                        <div className="font-black text-xl text-teal-600">{s.progress.toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                <GlassCard className="p-6 rounded-3xl animate-fade-in-up animate-delay-200 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2"><Activity className="text-sky-500"/> Grafik Rata-rata per Kelas</h3>
                  <p className="text-xs text-slate-500 mb-6 font-medium">Berdasarkan total progres seluruh siswa di setiap kelas.</p>
                  <div className="flex-1 flex items-end justify-between gap-2 border-b border-slate-200 pb-2 relative min-h-[200px]">
                    {classStats.map(stat => (
                      <div key={stat.name} className="flex flex-col items-center flex-1 group h-full justify-end">
                        <div className="w-full max-w-[40px] bg-gradient-to-t from-sky-400 to-teal-400 rounded-t-lg relative transition-all duration-500 hover:opacity-80" style={{ height: `${Math.max(stat.avg, 5)}%` }}>
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-700 bg-white/90 backdrop-blur px-2 py-1 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">{stat.avg.toFixed(1)}%</span>
                        </div>
                        <div className="mt-3 text-[10px] sm:text-xs font-bold text-slate-600">{stat.name}</div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </div>
          )}

          {activeTab === 'approval' && <AdminApprovalTab db={db} allStudents={allStudents} dialogHelpers={dialogHelpers} />}
          {activeTab === 'siswa' && <AdminSiswaTab db={db} allStudents={allStudents} dialogHelpers={dialogHelpers} />}
          {activeTab === 'monitoring' && <AdminMonitoringTab db={db} allStudents={allStudents} dialogHelpers={dialogHelpers} />}
          {activeTab === 'monitoring_detail' && <AdminMonitoringDetailTab db={db} allStudents={allStudents} dialogHelpers={dialogHelpers} />}
          {activeTab === 'pengaturan' && <AdminSettingsTab db={db} user={user} dialogHelpers={dialogHelpers} />}

          <div className="text-center text-xs font-medium text-slate-400 pt-8 pb-4">
            &copy; {new Date().getFullYear()} {db.settings.namaSekolah}. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Komponen Tab Admin ---

function AdminApprovalTab({ db, allStudents, dialogHelpers }) {
  const { showToast } = dialogHelpers;
  const [filterKelas, setFilterKelas] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('');
  const [searchName, setSearchName] = useState('');
  
  const unapproved = db.attendances.filter(a => !a.approved);

  const filteredUnapproved = unapproved.filter(att => {
    const s = allStudents.find(stu => stu.id === att.studentId);
    if (!s) return false;
    const matchKelas = filterKelas ? s.kelas === filterKelas : true;
    const matchJurusan = filterJurusan ? s.jurusan === filterJurusan : true;
    const matchName = searchName ? s.name.toLowerCase().includes(searchName.toLowerCase()) : true;
    return matchKelas && matchJurusan && matchName;
  });

  const handleApprove = (attToApprove) => {
    const ref = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'attendances', attToApprove.id);
    setDoc(ref, { ...attToApprove, approved: true }).then(() => {
        showToast('Kehadiran siswa berhasil disetujui', 'success');
    });
  };

  const handleApproveAll = async () => {
    const batch = writeBatch(firestoreDb);
    filteredUnapproved.forEach(att => {
       const ref = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'attendances', att.id);
       batch.update(ref, { approved: true });
    });
    await batch.commit();
    showToast('Kehadiran yang difilter berhasil disetujui!', 'success');
  };

  return (
    <GlassCard className="p-6 rounded-3xl animate-fade-in-up">
      <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Persetujuan Kehadiran</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input type="text" placeholder="Cari nama..." value={searchName} onChange={e=>setSearchName(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 w-full sm:w-auto" />
          <select value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="">Semua Kelas</option>
            {KELAS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <select value={filterJurusan} onChange={e=>setFilterJurusan(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="">Semua Jurusan</option>
            {JURUSAN.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          {filteredUnapproved.length > 0 && (
            <button type="button" onClick={handleApproveAll} className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-colors">Approve Ditampilkan</button>
          )}
        </div>
      </div>
      
      {filteredUnapproved.length === 0 ? (
        <div className="text-center text-slate-500 font-medium py-10">Tidak ada antrean persetujuan kehadiran yang sesuai filter.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="p-3 font-semibold">Tanggal</th><th className="p-3 font-semibold">Siswa</th><th className="p-3 font-semibold">Kelas & Jurusan</th><th className="p-3 font-semibold">Status</th><th className="p-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnapproved.map((att, i) => {
                const s = allStudents.find(stu => stu.id === att.studentId);
                return (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-slate-800">
                    <td className="p-3 font-medium">{att.date}</td>
                    <td className="p-3">
                      <div className="font-bold">{s?.name}</div>
                      {att.location && (
                        <a href={`https://maps.google.com/?q=${att.location.lat},${att.location.lng}`} target="_blank" rel="noreferrer" className="text-teal-600 hover:text-teal-800 hover:underline text-xs flex items-center gap-1 mt-1 font-medium w-max">
                          <MapPin size={12}/> Lihat Lokasi
                        </a>
                      )}
                    </td>
                    <td className="p-3 text-sm text-slate-600">{s?.kelas} {s?.jurusan}</td>
                    <td className="p-3 capitalize">
                       <span className={`px-3 py-1 rounded-full text-xs font-bold ${att.status==='hadir'?'bg-emerald-100 text-emerald-700':att.status==='sakit'?'bg-sky-100 text-sky-700':'bg-amber-100 text-amber-700'}`}>{att.status}</span>
                    </td>
                    <td className="p-3">
                      <button type="button" onClick={() => handleApprove(att)} className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm">Approve</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}

function AdminSiswaTab({ db, allStudents, dialogHelpers }) {
  const { showMessage, showConfirm, showToast } = dialogHelpers;
  const [showModal, setShowModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [modalData, setModalData] = useState(null);
  const [filterKelas, setFilterKelas] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('');
  const [search, setSearch] = useState('');

  const filtered = allStudents.filter(s => 
    (filterKelas ? s.kelas === filterKelas : true) &&
    (filterJurusan ? s.jurusan === filterJurusan : true) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.username.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSaveSiswa = (e) => {
    e.preventDefault();
    let processedData = { ...modalData };
    if (processedData.manualProgress === '') delete processedData.manualProgress;

    const id = processedData.id || 's' + Date.now();
    const ref = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'users', id);
    
    setDoc(ref, { ...processedData, role: 'siswa', id, certLink: processedData.certLink || '', allowDownload: processedData.allowDownload || false, ignoreTarget: processedData.ignoreTarget || false })
      .then(() => {
        showToast('Data siswa berhasil disimpan!', 'success');
        setShowModal(false);
      });
  };

  const handleDelete = async (id) => {
    showConfirm('Yakin hapus siswa ini beserta seluruh data kegiatannya?', async () => {
      const batch = writeBatch(firestoreDb);
      batch.delete(doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'users', id));
      
      // Delete their attendances and activities
      db.attendances.filter(a => a.studentId === id).forEach(a => batch.delete(doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'attendances', a.id)));
      db.activities.filter(a => a.studentId === id).forEach(a => batch.delete(doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'activities', a.id)));
      
      await batch.commit();
      showToast('Data siswa berhasil dihapus secara permanen.', 'success');
    });
  };

  const processCSVData = async (text) => {
    const lines = text.split('\n').filter(l => l.trim() !== '');
    const batch = writeBatch(firestoreDb);
    let addedCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const separator = lines[i].includes('\t') ? '\t' : ',';
      const cols = lines[i].split(separator).map(col => col.trim());
      
      if(cols.length >= 5) {
        const newId = 's_csv' + Date.now() + i;
        const ref = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'users', newId);
        batch.set(ref, {
          id: newId, 
          role: 'siswa', 
          name: cols[0], 
          kelas: cols[1] || KELAS[0], 
          jurusan: cols[2] || JURUSAN[0], 
          username: cols[3], 
          password: cols[4], 
          certLink: cols[5] || '', 
          allowDownload: false, 
          ignoreTarget: false, 
          manualProgress: cols[6] || ''
        });
        addedCount++;
      }
    }
    
    if (addedCount > 0) {
      await batch.commit();
      showToast(`Berhasil mengimpor ${addedCount} data siswa!`, 'success');
      setShowPasteModal(false);
      setPasteData('');
    } else {
      showMessage('Gagal mengimpor. Pastikan format data benar (termasuk melewati baris header).');
    }
  };

  const handleCSV = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => processCSVData(evt.target.result);
      reader.readAsText(file);
    }
    e.target.value = null; 
  };

  return (
    <>
      <GlassCard className="p-6 rounded-3xl animate-fade-in-up">
        <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <input type="text" placeholder="Cari nama/username..." value={search} onChange={e=>setSearch(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            <select value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400">
              <option value="">Semua Kelas</option>
              {KELAS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <select value={filterJurusan} onChange={e=>setFilterJurusan(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400">
              <option value="">Semua Jurusan</option>
              {JURUSAN.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
             <button type="button" onClick={() => {
                const header = "nama_lengkap,kelas,jurusan,username,password,link_sertifikat(opsional),override_progress(opsional)\n";
                const sample1 = "Budi Santoso,X-A,TKJ,budi123,pass123,,\n";
                const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(header + sample1);
                const a = document.createElement('a');
                a.setAttribute("href", dataStr);
                a.setAttribute("download", "template_siswa_ramadhan.csv");
                document.body.appendChild(a); a.click(); a.remove();
             }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors border border-slate-300" title="Download Template CSV">
               <Download size={14}/> Template
             </button>
             <button type="button" onClick={() => setShowPasteModal(true)} className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors border border-amber-300" title="Paste data dari Excel/Sheets">
               <FileText size={14}/> Paste Data
             </button>
             <label className="bg-sky-100 hover:bg-sky-200 text-sky-700 px-4 py-2 rounded-xl font-bold text-sm cursor-pointer flex items-center gap-2 transition-colors border border-sky-200">
               <UploadCloud size={16}/> Upload CSV <input type="file" accept=".csv" className="hidden" onChange={handleCSV}/>
             </label>
             <button type="button" onClick={() => {setModalData({name:'', username:'', password:'', kelas: KELAS[0], jurusan: JURUSAN[0], manualProgress: ''}); setShowModal(true)}} className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md shadow-teal-500/20 transition-all">
               + Tambah Manual
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600"><th className="p-3 font-semibold">Nama</th><th className="p-3 font-semibold">Akun</th><th className="p-3 font-semibold">Kelas / Jurusan</th><th className="p-3 text-center font-semibold">Aksi & Sertifikat</th></tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 text-slate-800 transition-colors">
                  <td className="p-3 font-bold">
                    {s.name}
                    {(s.manualProgress !== undefined && s.manualProgress !== null && s.manualProgress !== '' && Number(s.manualProgress) > 0) && (
                      <span className="ml-2 bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Bonus: +{s.manualProgress}%</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-slate-500 font-medium">U: {s.username}<br/>P: {s.password}</td>
                  <td className="p-3 font-medium text-slate-600">{s.kelas} - {s.jurusan}</td>
                  <td className="p-3 flex items-center justify-center gap-2">
                     <button type="button" onClick={() => {setModalData({...s, manualProgress: s.manualProgress || ''}); setShowModal(true)}} className="p-2 bg-sky-100 text-sky-600 hover:bg-sky-200 rounded-lg transition-colors" title="Edit Data & Sertifikat"><Edit size={16}/></button>
                     <button type="button" onClick={() => handleDelete(s.id)} className="p-2 bg-rose-100 text-rose-600 hover:bg-rose-200 rounded-lg transition-colors"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="4" className="text-center p-6 text-slate-500">Tidak ada data siswa.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Modal Paste Data */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <GlassCard className="w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-white border-none shadow-2xl flex flex-col animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800">Paste Data Siswa</h3>
              <button type="button" onClick={() => setShowPasteModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>
            <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl mb-4 text-sm text-sky-800">
              <p className="font-bold mb-1">Cara penggunaan:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Buka Microsoft Excel atau Google Sheets.</li>
                <li>Siapkan data dengan urutan kolom: <b>Nama, Kelas, Jurusan, Username, Password, Link Sertifikat (Opsional), Bonus Progress (Opsional)</b>.</li>
                <li>Pastikan baris pertama adalah <b>Header/Judul Kolom</b> (karena baris pertama akan diabaikan).</li>
                <li><i>Copy</i> semua data (termasuk header), lalu <i>Paste</i> ke dalam kotak di bawah ini.</li>
              </ol>
            </div>
            
            <textarea 
              value={pasteData} 
              onChange={e => setPasteData(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 min-h-[200px] text-sm font-mono focus:ring-2 focus:ring-teal-500 outline-none whitespace-pre text-slate-800"
              placeholder="Paste data di sini..."
            ></textarea>
            
            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowPasteModal(false)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">Batal</button>
              <button type="button" onClick={() => { if(pasteData.trim()) processCSVData(pasteData); }} className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold shadow-md shadow-teal-500/20 transition-all flex items-center gap-2">
                <CheckSquare size={18}/> Proses Data
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Modal CRUD & Sertifikat */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-6 overflow-y-auto">
          <GlassCard className="w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-white border-none shadow-2xl max-h-[90vh] overflow-y-auto my-auto flex flex-col animate-fade-in-up">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6">{modalData.id ? 'Edit Siswa & Sertifikat' : 'Tambah Siswa'}</h3>
            <form onSubmit={handleSaveSiswa} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="sm:col-span-2"><label className="text-xs font-semibold text-slate-600 mb-1 block">Nama Lengkap</label><input required type="text" value={modalData.name} onChange={e=>setModalData({...modalData, name: e.target.value})} className="w-full bg-slate-50 rounded-xl p-3 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none focus:bg-white transition-colors" /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1 block">Username</label><input required type="text" value={modalData.username} onChange={e=>setModalData({...modalData, username: e.target.value})} className="w-full bg-slate-50 rounded-xl p-3 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none focus:bg-white transition-colors" /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1 block">Password</label><input required type="text" value={modalData.password} onChange={e=>setModalData({...modalData, password: e.target.value})} className="w-full bg-slate-50 rounded-xl p-3 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none focus:bg-white transition-colors" /></div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Kelas</label>
                  <select value={modalData.kelas} onChange={e=>setModalData({...modalData, kelas: e.target.value})} className="w-full bg-slate-50 rounded-xl p-3 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none focus:bg-white transition-colors">{KELAS.map(k=><option key={k} value={k}>{k}</option>)}</select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Jurusan</label>
                  <select value={modalData.jurusan} onChange={e=>setModalData({...modalData, jurusan: e.target.value})} className="w-full bg-slate-50 rounded-xl p-3 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none focus:bg-white transition-colors">{JURUSAN.map(j=><option key={j} value={j}>{j}</option>)}</select>
                </div>
                <div className="sm:col-span-2 p-4 border border-amber-200 bg-amber-50 rounded-2xl">
                  <label className="text-xs font-bold text-amber-800 mb-1 block">Tambahan/Bonus Progress (%)</label>
                  <input type="number" min="0" max="100" placeholder="Contoh: 10 (untuk +10%)" value={modalData.manualProgress} onChange={e=>setModalData({...modalData, manualProgress: e.target.value})} className="w-full bg-white rounded-xl p-3 border border-amber-200 text-slate-800 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-colors" />
                  <p className="text-[11px] text-amber-700 mt-2 font-medium">Jika diisi, nilai ini akan ditambahkan ke progres aktivitas harian siswa (total maksimal 100%).</p>
                </div>
              </div>
              
              {modalData.id && (
                <div className="mt-6 p-5 border border-sky-200 bg-sky-50 rounded-2xl space-y-4">
                  <h4 className="font-bold text-sm text-sky-800">Pengaturan Sertifikat (Opsional)</h4>
                  <div><label className="text-xs font-semibold text-sky-700 mb-1 block">Link URL Sertifikat</label><input type="url" value={modalData.certLink||''} onChange={e=>setModalData({...modalData, certLink: e.target.value})} className="w-full bg-white rounded-xl p-3 border border-sky-200 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none text-slate-800 transition-colors" placeholder="https://drive.google.com/..." /></div>
                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 text-sm text-sky-900 font-medium cursor-pointer"><input type="checkbox" checked={modalData.allowDownload||false} onChange={e=>setModalData({...modalData, allowDownload: e.target.checked})} className="mt-1 w-4 h-4 rounded text-sky-500 border-sky-300 focus:ring-sky-500" /> <span className="leading-snug">Izin Download Langsung</span></label>
                    <label className="flex items-start gap-3 text-sm text-sky-900 font-medium cursor-pointer"><input type="checkbox" checked={modalData.ignoreTarget||false} onChange={e=>setModalData({...modalData, ignoreTarget: e.target.checked})} className="mt-1 w-4 h-4 rounded text-sky-500 border-sky-300 focus:ring-sky-500" /> <span className="leading-snug">Abaikan Target / Lulus Otomatis</span></label>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="w-full sm:flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">Batal</button>
                <button type="submit" className="w-full sm:flex-1 py-3.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold shadow-md shadow-teal-500/20 transition-all">Simpan Data</button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </>
  );
}

function AdminMonitoringTab({ db, allStudents, dialogHelpers }) {
  const { showToast } = dialogHelpers;
  const [filterKelas, setFilterKelas] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [searchName, setSearchName] = useState('');

  const getFilteredProgress = (studentId) => {
    const student = allStudents.find(s => s.id === studentId);
    let manualBonus = 0;
    if (student && student.manualProgress !== undefined && student.manualProgress !== null && student.manualProgress !== '') {
      manualBonus = Number(student.manualProgress);
    }

    let totalScore = 0;
    const { weights, startDate, endDate } = db.settings;
    
    const activities = db.activities.filter(a => 
      a.studentId === studentId && 
      !a.isDraft &&
      (filterDate ? a.date === filterDate : true)
    );
    
    activities.forEach(act => {
      // PROTEKSI CRASH: gunakan ?. dan || {}
      const data = act.data || {};
      let dayScore = 0;
      const sholatCount = Object.values(data.sholat || {}).filter(Boolean).length;
      dayScore += (sholatCount / 5) * (weights.sholat || 40);
      if (data.tarawih) dayScore += (weights.tarawih || 10);
      if (data.tadarus?.startSurah) dayScore += (weights.tadarus || 20);
      if (['ya', 'sakit', 'haid'].includes(data.puasa?.status)) dayScore += (weights.puasa || 20);
      if (data.bantuOrtu?.status === 'ya') dayScore += (weights.bantuOrtu || 10);
      totalScore += dayScore;
    });
    
    let targetDays = 1;
    if (!filterDate) {
        const todayDateStr = getLocalYYYYMMDD();
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');
        const todayObj = new Date(todayDateStr + 'T00:00:00');
        
        if (todayObj < start) {
            targetDays = 1;
        } else if (todayObj > end) {
            targetDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
        } else {
            targetDays = Math.max(1, Math.round((todayObj - start) / (1000 * 60 * 60 * 24)) + 1);
        }
    }
    
    const calculatedAvg = totalScore / targetDays;
    if (filterDate) return Math.min(100, calculatedAvg);
    return Math.min(100, calculatedAvg + manualBonus);
  };

  const processedStudents = allStudents
    .filter(s => filterKelas ? s.kelas === filterKelas : true)
    .filter(s => filterJurusan ? s.jurusan === filterJurusan : true)
    .filter(s => searchName ? s.name.toLowerCase().includes(searchName.toLowerCase()) : true)
    .map(s => ({ ...s, progress: getFilteredProgress(s.id) }));

  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Monitoring Rekap Ramadhan</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #e0f2fe; color: #0369a1; }
          </style>
        </head>
        <body>
          <h2>Laporan Monitoring Rekap Ramadhan ${filterDate ? `(Tanggal: ${filterDate})` : ''}</h2>
          <table>
            <thead><tr><th>Nama Siswa</th><th>Kelas & Jurusan</th><th>Progress Rata-rata</th><th>Status Target</th></tr></thead>
            <tbody>
              ${processedStudents.map(s => `<tr><td>${s.name}</td><td>${s.kelas} ${s.jurusan}</td><td>${s.progress.toFixed(1)}%</td><td>${s.progress >= db.settings.minPercentage ? 'LULUS' : 'BELUM'}</td></tr>`).join('')}
            </tbody>
          </table>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast('Laporan Rekap PDF berhasil dibuat!', 'success');
  };

  return (
    <GlassCard className="p-6 rounded-3xl animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <input type="text" placeholder="Cari nama..." value={searchName} onChange={e=>setSearchName(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 w-full sm:w-auto" />
          <select value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="">Semua Kelas</option>
            {KELAS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <select value={filterJurusan} onChange={e=>setFilterJurusan(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="">Semua Jurusan</option>
            {JURUSAN.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            {filterDate && <button type="button" onClick={() => setFilterDate('')} className="text-xs text-rose-500 hover:text-rose-700 font-bold">Clear</button>}
          </div>
        </div>
        <button type="button" onClick={exportPDF} className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"><Download size={16}/> Export PDF</button>
      </div>
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-white shadow-sm z-10">
            <tr className="border-b border-slate-200 text-slate-600"><th className="p-3 font-semibold">Siswa</th><th className="p-3 font-semibold">Kelas</th><th className="p-3 font-semibold">Jurusan</th><th className="p-3 text-right font-semibold">Persentase</th><th className="p-3 text-center font-semibold">Status</th></tr>
          </thead>
          <tbody>
            {processedStudents.sort((a,b)=>b.progress - a.progress).map(s => (
              <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 text-slate-800 transition-colors">
                <td className="p-3 font-bold">{s.name}</td>
                <td className="p-3 font-medium text-slate-600">{s.kelas}</td>
                <td className="p-3 font-medium text-slate-600">{s.jurusan}</td>
                <td className="p-3 text-right font-black text-teal-600">{s.progress.toFixed(1)}%</td>
                <td className="p-3 text-center">
                  {s.progress >= db.settings.minPercentage ? <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">Lulus Target</span> : <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold border border-rose-200">Belum Target</span>}
                </td>
              </tr>
            ))}
            {processedStudents.length === 0 && (
              <tr><td colSpan="5" className="text-center p-6 text-slate-500">Tidak ada data untuk filter yang dipilih.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

function AdminMonitoringDetailTab({ db, allStudents, dialogHelpers }) {
  const { showToast } = dialogHelpers;
  const [filterStudent, setFilterStudent] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const activities = db.activities.filter(a => !a.isDraft).sort((a,b) => new Date(b.date) - new Date(a.date));
  
  const filteredActivities = activities.filter(act => {
    const student = allStudents.find(s => s.id === act.studentId);
    if(!student) return false;
    const matchName = student.name.toLowerCase().includes(filterStudent.toLowerCase());
    const matchClass = filterKelas ? student.kelas === filterKelas : true;
    const matchJurusan = filterJurusan ? student.jurusan === filterJurusan : true;
    const matchDate = filterDate ? act.date === filterDate : true;
    return matchName && matchClass && matchJurusan && matchDate;
  });

  const exportDetailPDF = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Monitoring Detail Jurnal</title><style>body{font-family:sans-serif;padding:20px; color:#333;} .card{border:1px solid #ddd;padding:12px;margin-bottom:12px;border-radius:8px; background:#f8fafc;} .meta{font-size:12px;color:#64748b; margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:4px;}</style></head>
      <body><h2>Monitoring Detail Catatan Siswa ${filterDate ? `(${filterDate})` : ''}</h2>
      ${filteredActivities.map(act => {
        const s = allStudents.find(x => x.id === act.studentId);
        return `<div class="card"><div class="meta"><b>${s?.name}</b> (${s?.kelas} ${s?.jurusan}) - <span style="color:#0f766e">${act.date}</span></div><p><b>Refleksi:</b> ${act.data?.refleksi || '-'}</p><p><b>Bantu Ortu:</b> ${act.data?.bantuOrtu?.status === 'ya' ? act.data.bantuOrtu.desc : '-'}</p></div>`;
      }).join('')}
      <script>window.print(); window.close();</script></body></html>
    `);
    printWindow.document.close();
    showToast('Laporan Detail PDF berhasil dibuat!', 'success');
  };

  return (
    <GlassCard className="p-6 rounded-3xl animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <input type="text" placeholder="Cari Siswa..." value={filterStudent} onChange={e=>setFilterStudent(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
          <select value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="">Semua Kelas</option>
            {KELAS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <select value={filterJurusan} onChange={e=>setFilterJurusan(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="">Semua Jurusan</option>
            {JURUSAN.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            {filterDate && <button type="button" onClick={() => setFilterDate('')} className="text-xs text-rose-500 hover:text-rose-700 font-bold">Clear</button>}
          </div>
        </div>
        <button type="button" onClick={exportDetailPDF} className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm whitespace-nowrap"><Download size={16}/> Export PDF</button>
      </div>

      <div className="space-y-4">
        {filteredActivities.slice(0, 50).map((act, i) => { 
          const s = allStudents.find(x => x.id === act.studentId);
          return (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
               <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-3">
                 <span className="font-bold text-slate-800">{s?.name} <span className="text-xs font-semibold text-slate-500 ml-2 bg-slate-100 px-2 py-1 rounded-md">{s?.kelas} {s?.jurusan}</span></span>
                 <span className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">{act.date}</span>
               </div>
               <div className="text-sm space-y-2 mt-2">
                 <div className="text-slate-700"><span className="text-sky-600 font-bold">Refleksi Harian:</span> <span className="italic bg-slate-50 px-2 py-1 rounded">"{act.data?.refleksi || '-'}"</span></div>
                 {act.data?.bantuOrtu?.status === 'ya' && <div className="text-slate-700"><span className="text-pink-500 font-bold">Bantu Ortu:</span> {act.data.bantuOrtu.desc}</div>}
                 <div className="text-xs font-semibold text-slate-500 mt-3 flex gap-3 pt-2 border-t border-slate-100">
                    <span>Puasa: <b className="text-slate-700">{act.data?.puasa?.status || '-'}</b></span>
                    <span>Tarawih: <b className="text-slate-700">{act.data?.tarawih?'Ya':'Tidak'}</b></span> 
                    <span>Sholat: <b className="text-slate-700">{Object.values(act.data?.sholat || {}).filter(Boolean).length}/5</b></span>
                 </div>
               </div>
            </div>
          )
        })}
        {filteredActivities.length > 50 && <div className="text-center text-xs font-bold text-slate-400 mt-6">Hanya menampilkan 50 data terbaru. Gunakan Export PDF untuk semua data.</div>}
      </div>
    </GlassCard>
  );
}

function AdminSettingsTab({ db, user, dialogHelpers }) {
  const { showMessage, showPrompt, showToast, showConfirm } = dialogHelpers;
  const [sets, setSets] = useState(db.settings);
  const [adminCreds, setAdminCreds] = useState({ username: user.username, password: user.password });

  const handleSave = async () => {
    const batch = writeBatch(firestoreDb);
    
    // Save Settings
    batch.set(doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'settings', 'config'), sets);
    
    // Save Admin Credentials if changed
    if (adminCreds.username !== user.username || adminCreds.password !== user.password) {
      const adminRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'users', user.id);
      batch.update(adminRef, { username: adminCreds.username, password: adminCreds.password });
    }
    
    await batch.commit();
    showToast('Pengaturan sistem & profil admin berhasil disimpan!', 'success');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 150 * 1024) { // Batas 150KB
         showToast('Ukuran gambar terlalu besar! Maksimal 150KB agar database tidak penuh.', 'error');
         e.target.value = null;
         return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        setSets({...sets, logoUrl: evt.target.result});
        showToast('Logo berhasil dimuat! Jangan lupa klik Simpan Pengaturan.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    showPrompt('PERINGATAN! Ini akan menghapus SEMUA data Absensi dan Aktivitas Siswa. Ketik "RESET" untuk melanjutkan:', 'RESET', async () => {
      const batch = writeBatch(firestoreDb);
      
      // Menggunakan array lokal untuk menghapus dari database
      db.attendances.forEach(a => batch.delete(doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'attendances', a.id)));
      db.activities.forEach(a => batch.delete(doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'activities', a.id)));
      
      await batch.commit();
      showToast('Semua data aktivitas berhasil direset!', 'success');
    });
  };

  const handleBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "backup_ramadhan_" + new Date().getTime() + ".json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast('File backup database berhasil diunduh!', 'success');
  };

  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    showConfirm('PERINGATAN: Tindakan ini akan menimpa seluruh database saat ini dengan data dari file backup. Anda yakin ingin melanjutkan?', () => {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const restoredData = JSON.parse(evt.target.result);
          
          if (restoredData.users && restoredData.settings) {
            const batch = writeBatch(firestoreDb);
            
            // Restore settings
            batch.set(doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'settings', 'config'), restoredData.settings);
            
            if (Array.isArray(restoredData.users)) {
                restoredData.users.forEach(u => batch.set(doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'users', u.id), u));
            }
            if (Array.isArray(restoredData.attendances)) {
                restoredData.attendances.forEach(a => {
                    const attId = a.id || `${a.studentId}_${a.date}`;
                    batch.set(doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'attendances', attId), { ...a, id: attId });
                });
            }
            if (Array.isArray(restoredData.activities)) {
                restoredData.activities.forEach(a => {
                    const actId = a.id || `${a.studentId}_${a.date}`;
                    batch.set(doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'activities', actId), { ...a, id: actId });
                });
            }
            
            await batch.commit();
            setSets(restoredData.settings);
            showToast('Database berhasil direstore dari file backup!', 'success');
          } else {
            showMessage('Format file JSON tidak valid. Pastikan Anda mengunggah file backup yang benar.');
          }
        } catch (error) {
          showMessage('Gagal membaca file JSON. File mungkin rusak.');
          console.error("Restore Error:", error);
        }
      };
      reader.readAsText(file);
    });
    
    e.target.value = null;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <GlassCard className="p-8 rounded-3xl">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><ShieldCheck className="text-teal-500"/> Pengaturan Akun Admin</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-sm font-semibold text-slate-600 mb-1">Username Admin</label><input type="text" value={adminCreds.username} onChange={e=>setAdminCreds({...adminCreds, username: e.target.value})} className="w-full bg-white rounded-xl p-2.5 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none" /></div>
          <div><label className="block text-sm font-semibold text-slate-600 mb-1">Password Admin</label><input type="text" value={adminCreds.password} onChange={e=>setAdminCreds({...adminCreds, password: e.target.value})} className="w-full bg-white rounded-xl p-2.5 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none" /></div>
        </div>
      </GlassCard>

      <GlassCard className="p-8 rounded-3xl">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Settings className="text-teal-500"/> Pengaturan Sistem Utama</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Nama Sekolah</label>
            <input type="text" value={sets.namaSekolah || ''} onChange={e=>setSets({...sets, namaSekolah: e.target.value})} className="w-full bg-white rounded-xl p-2.5 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none" placeholder="Contoh: SMK Bina Siswa Mandiri" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Tahun Pelajaran</label>
            <input type="text" value={sets.tahunPelajaran || ''} onChange={e=>setSets({...sets, tahunPelajaran: e.target.value})} className="w-full bg-white rounded-xl p-2.5 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none" placeholder="Contoh: 2025/2026" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-600 mb-1">Logo Sekolah (URL / Upload)</label>
            <div className="flex gap-2">
              <input type="text" value={sets.logoUrl} onChange={e=>setSets({...sets, logoUrl: e.target.value})} className="flex-1 w-full bg-white rounded-xl p-2.5 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none" placeholder="Link URL Logo" />
              <label className="bg-sky-100 text-sky-700 px-4 py-2.5 rounded-xl font-bold cursor-pointer hover:bg-sky-200 transition-colors flex items-center justify-center shadow-sm" title="Upload Gambar Lokal">
                <UploadCloud size={18}/>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Gunakan URL gambar dari internet, atau upload gambar lokal (maks. 150KB).</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-slate-600 mb-1">Tanggal Mulai</label><input type="date" value={sets.startDate} onChange={e=>setSets({...sets, startDate: e.target.value})} className="w-full bg-white rounded-xl p-2.5 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none" /></div>
            <div><label className="block text-sm font-semibold text-slate-600 mb-1">Tanggal Selesai</label><input type="date" value={sets.endDate} onChange={e=>setSets({...sets, endDate: e.target.value})} className="w-full bg-white rounded-xl p-2.5 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-slate-600 mb-1">Batas Kelulusan (%)</label><input type="number" value={sets.minPercentage} onChange={e=>setSets({...sets, minPercentage: Number(e.target.value)})} className="w-full bg-white rounded-xl p-2.5 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none" /></div>
            <div><label className="block text-sm font-semibold text-slate-600 mb-1">Minimal Hari Aktif</label><input type="number" value={sets.minActiveDays} onChange={e=>setSets({...sets, minActiveDays: Number(e.target.value)})} className="w-full bg-white rounded-xl p-2.5 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none" /></div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-8 rounded-3xl">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><MapPin className="text-teal-500"/> Pengaturan Lokasi Absensi</h2>
        <div className="space-y-5">
          <label className="flex items-center gap-3 text-sm text-slate-800 font-bold cursor-pointer">
            <input type="checkbox" checked={sets.locationRestriction || false} onChange={e=>setSets({...sets, locationRestriction: e.target.checked})} className="w-5 h-5 rounded text-teal-500 border-slate-300 focus:ring-teal-500" /> 
            <span>Aktifkan Pembatasan Radius Lokasi Absensi (Geofence)</span>
          </label>
          
          {sets.locationRestriction && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Latitude (Garis Lintang)</label>
                <input type="number" step="any" value={sets.centerLat || ''} onChange={e=>setSets({...sets, centerLat: parseFloat(e.target.value)})} className="w-full bg-white rounded-xl p-2.5 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Longitude (Garis Bujur)</label>
                <input type="number" step="any" value={sets.centerLng || ''} onChange={e=>setSets({...sets, centerLng: parseFloat(e.target.value)})} className="w-full bg-white rounded-xl p-2.5 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Batas Radius (Meter)</label>
                <input type="number" value={sets.radius || 50} onChange={e=>setSets({...sets, radius: parseInt(e.target.value)})} className="w-full bg-white rounded-xl p-2.5 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none" />
              </div>
              <div className="md:col-span-3 pt-2">
                 <button type="button" onClick={() => {
                   navigator.geolocation.getCurrentPosition(
                     pos => setSets({...sets, centerLat: pos.coords.latitude, centerLng: pos.coords.longitude}), 
                     err => showMessage('Gagal mengambil lokasi Anda. Pastikan izin lokasi aktif.'), 
                     {enableHighAccuracy: true}
                   );
                 }} className="text-sm bg-sky-100 text-sky-700 px-4 py-2.5 rounded-xl font-bold hover:bg-sky-200 transition-colors flex items-center gap-2 w-max shadow-sm">
                   <MapPin size={16}/> Gunakan Lokasi Saya Saat Ini
                 </button>
                 <p className="text-xs text-slate-500 mt-3 font-medium">Siswa tidak akan bisa mengirim absen <b>Hadir</b> jika jarak mereka melebihi radius dari titik kordinat di atas.</p>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard className="p-8 rounded-3xl">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Pengaturan Bobot Penilaian <span className="text-sm text-slate-500 font-normal">(Total harus 100%)</span></h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
           {Object.keys(sets.weights).map(k => (
             <div key={k}><label className="block text-sm font-semibold text-slate-600 mb-1 capitalize">{k}</label><input type="number" value={sets.weights[k]} onChange={e=>setSets({...sets, weights: {...sets.weights, [k]: Number(e.target.value)}})} className="w-full bg-white rounded-xl p-2.5 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none" /></div>
           ))}
        </div>
        <div className="mt-8 pt-6 border-t border-slate-200 text-right">
          <button type="button" onClick={handleSave} className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-xl font-bold shadow-md shadow-teal-500/20 transition-all">Simpan Pengaturan</button>
        </div>
      </GlassCard>

      <GlassCard className="p-8 rounded-3xl border border-rose-200 bg-rose-50/30">
        <h2 className="text-xl font-bold mb-2 text-rose-600">Database & Pemeliharaan</h2>
        <p className="text-sm text-slate-600 font-medium mb-6">Lakukan backup secara berkala. Reset data hanya dilakukan di awal pergantian tahun/periode.</p>
        <div className="flex flex-wrap gap-4">
          <button type="button" onClick={handleBackup} className="bg-white text-sky-600 border border-sky-200 hover:bg-sky-50 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"><Database size={18}/> Backup JSON</button>
          
          <label className="bg-white text-amber-600 border border-amber-200 hover:bg-amber-50 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer">
            <UploadCloud size={18}/> Restore JSON
            <input type="file" accept=".json" className="hidden" onChange={handleRestore} />
          </label>

          <button type="button" onClick={handleReset} className="bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"><Trash2 size={18}/> Reset Semua Aktivitas</button>
        </div>
      </GlassCard>
    </div>
  );
}