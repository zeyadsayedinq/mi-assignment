import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, FileText, Image, Rocket, Globe } from 'lucide-react';
import { cn } from '../lib/utils';

// ── Universities & Countries ──────────────────────────────────────────────────
const COUNTRIES = [
  'Egypt', 'Saudi Arabia', 'UAE', 'Kuwait', 'Bahrain', 'Jordan', 'Lebanon', 'Other',
];

const UNIVERSITIES_BY_COUNTRY: Record<string, string[]> = {
  'Egypt': [
    'German University in Cairo (GUC)',
    'American University in Cairo (AUC)',
    'Cairo University',
    'Ain Shams University',
    'Alexandria University',
    'Misr International University (MIU)',
    'Modern Sciences & Arts University (MSA)',
    'British University in Egypt (BUE)',
    'Helwan University',
    'Mansoura University',
    'Al-Azhar University',
    'Nile University',
    'Sinai University',
    'Pharos University',
    'Assiut University',
    'Other Egyptian University',
  ],
  'Saudi Arabia': [
    'King Saud University (KSU)',
    'King Fahd University of Petroleum & Minerals (KFUPM)',
    'King Abdullah University of Science & Technology (KAUST)',
    'Alfaisal University',
    'King Abdulaziz University (KAU)',
    'Princess Nourah University',
    'Imam Muhammad Ibn Saud University',
    'Taibah University',
    'Other Saudi University',
  ],
  'UAE': [
    'UAE University (UAEU)',
    'American University of Sharjah (AUS)',
    'American University in Dubai (AUD)',
    'Khalifa University',
    'Zayed University',
    'University of Sharjah',
    'British University in Dubai (BUiD)',
    'Other UAE University',
  ],
  'Kuwait': ['Kuwait University (KU)', 'American University of Kuwait', 'Gulf University for Science & Technology', 'Other Kuwait University'],
  'Bahrain': ['University of Bahrain (UOB)', 'Arabian Gulf University', 'Royal University for Women', 'Other Bahrain University'],
  'Jordan': ['University of Jordan (UJ)', 'Jordan University of Science & Technology (JUST)', 'American University of Madaba', 'German Jordanian University', 'Other Jordan University'],
  'Lebanon': ['American University of Beirut (AUB)', 'Lebanese American University (LAU)', 'Notre Dame University (NDU)', 'Saint Joseph University (USJ)', 'Other Lebanon University'],
  'Other': ['Other International University'],
};

const MAJORS = [
  'Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering',
  'Computer Engineering', 'Chemical Engineering', 'Architecture',
  'Computer Science', 'Software Engineering', 'Information Technology',
  'Data Science / AI', 'Cybersecurity',
  'Medicine / MBBS', 'Pharmacy', 'Nursing', 'Dentistry', 'Biomedical Sciences',
  'Law / Legal Studies', 'Business Administration', 'Finance & Accounting',
  'Marketing', 'Economics', 'Management',
  'Mathematics / Statistics', 'Physics', 'Chemistry', 'Biology',
  'Environmental Science',
  'Arabic Literature', 'English Literature', 'History', 'Philosophy',
  'Sociology', 'Psychology', 'Education',
  'Media & Communications', 'Graphic Design', 'Interior Design',
  'Sports Management', 'Tourism & Hospitality',
  'Other',
];

const ASSIGNMENT_TYPES = [
  { value: 'essay',        labelEn: '📝 Essay / Report',     labelAr: 'مقال / تقرير' },
  { value: 'presentation', labelEn: '🎞️ Presentation',       labelAr: 'عرض تقديمي' },
  { value: 'code',         labelEn: '💻 Code / Programming',  labelAr: 'كود / برمجة' },
  { value: 'math',         labelEn: '🔢 Math / Calculations', labelAr: 'رياضيات / حسابات' },
  { value: 'research',     labelEn: '🔬 Research Paper',      labelAr: 'ورقة بحثية' },
  { value: 'design',       labelEn: '🎨 Design / Diagram',    labelAr: 'تصميم / مخطط' },
  { value: 'other',        labelEn: '📚 Other',               labelAr: 'أخرى' },
];

// ── Props ─────────────────────────────────────────────────────────────────────
interface UploadHandlerProps {
  onLaunch: (
    files: File[], prompt: string,
    university?: string, course?: string,
    system?: string, reference?: string,
    missionType?: string, country?: string,
    major?: string, lang?: string,
  ) => void;
  isProcessing?: boolean;
  userProfile?: { country: string; university: string; major: string } | null;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function UploadHandler({ onLaunch, isProcessing, userProfile }: UploadHandlerProps) {
  const { i18n } = useTranslation();
  const isAr     = i18n.language === 'ar';

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [country,      setCountry]      = useState('');
  const [university,   setUniversity]   = useState('');
  const [customUni,    setCustomUni]    = useState('');
  const [showCustomUni, setShowCustomUni] = useState(false);
  const [major,        setMajor]        = useState('');
  const [missionType,  setMissionType]  = useState('essay');
  const [prompt,       setPrompt]       = useState('');
  const [files,        setFiles]        = useState<File[]>([]);
  const [dragging,     setDragging]     = useState(false);

  // ── Language selector — assignment output language ────────────────────────
  // This is the language the AI generates the assignment IN (ar or en)
  // Default: match UI language
  const [outputLang, setOutputLang] = useState<'ar' | 'en'>(isAr ? 'ar' : 'en');

  // Pre-fill from profile when it loads
  useEffect(() => {
    if (userProfile) {
      if (userProfile.country   && !country)    setCountry(userProfile.country);
      if (userProfile.university && !university) setUniversity(userProfile.university);
      if (userProfile.major     && !major)      setMajor(userProfile.major);
    }
  }, [userProfile]);

  // Universities for selected country
  const unis = country ? (UNIVERSITIES_BY_COUNTRY[country] || []) : [];

  const handleCountryChange = (c: string) => {
    setCountry(c);
    setUniversity('');
    setShowCustomUni(false);
  };

  const handleUniversityChange = (u: string) => {
    setUniversity(u);
    setShowCustomUni(u.toLowerCase().startsWith('other'));
  };

  // File handling
  const addFiles = useCallback((newFiles: File[]) => {
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...newFiles.filter(f => !existing.has(f.name + f.size))];
    });
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  // Launch
  const handleLaunch = () => {
    if (!prompt.trim() && files.length === 0) return;
    const uniName = showCustomUni && customUni.trim() ? customUni.trim() : university;
    onLaunch(
      files, prompt,
      uniName || undefined,
      major   || undefined,
      undefined,            // system
      undefined,            // reference
      missionType,
      country || undefined,
      major   || undefined,
      outputLang,           // ← pass output language
    );
  };

  const canLaunch = (prompt.trim() || files.length > 0) && !isProcessing;

  return (
    <div className={cn('space-y-4', isAr && 'font-[Cairo]')} dir={isAr ? 'rtl' : 'ltr'}>

      {/* Row 1: Country + University */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1.5">
            {isAr ? 'الدولة' : 'Country'}
          </label>
          <select
            value={country}
            onChange={e => handleCountryChange(e.target.value)}
            className="w-full bg-[#0A0B0E] border border-gray-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22D3EE]/50 appearance-none"
          >
            <option value="">{isAr ? 'اختر الدولة…' : 'Select country…'}</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1.5">
            {isAr ? 'الجامعة' : 'University'}
          </label>
          <select
            value={university}
            onChange={e => handleUniversityChange(e.target.value)}
            disabled={unis.length === 0}
            className="w-full bg-[#0A0B0E] border border-gray-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22D3EE]/50 appearance-none disabled:opacity-40"
          >
            <option value="">{isAr ? 'اختر الجامعة…' : 'Select university…'}</option>
            {unis.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          {showCustomUni && (
            <input
              type="text"
              value={customUni}
              onChange={e => setCustomUni(e.target.value)}
              placeholder={isAr ? 'اسم الجامعة…' : 'University name…'}
              className="mt-2 w-full bg-[#0A0B0E] border border-gray-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22D3EE]/50"
            />
          )}
        </div>
      </div>

      {/* Row 2: Major + Assignment Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1.5">
            {isAr ? 'التخصص' : 'Major / Field'}
          </label>
          <select
            value={major}
            onChange={e => setMajor(e.target.value)}
            className="w-full bg-[#0A0B0E] border border-gray-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22D3EE]/50 appearance-none"
          >
            <option value="">{isAr ? 'اختر التخصص…' : 'Select major…'}</option>
            {MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1.5">
            {isAr ? 'نوع الواجب' : 'Assignment Type'}
          </label>
          <select
            value={missionType}
            onChange={e => setMissionType(e.target.value)}
            className="w-full bg-[#0A0B0E] border border-gray-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#22D3EE]/50 appearance-none"
          >
            {ASSIGNMENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>
                {isAr ? t.labelAr : t.labelEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── LANGUAGE SELECTOR ─────────────────────────────────────────────────
           This is the submission output language — what language the
           AI generates the assignment in. Clearly labelled and always visible.
      ──────────────────────────────────────────────────────────────────────── */}
      <div>
        <label className="flex items-center gap-1.5 text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-2">
          <Globe className="w-3 h-3" />
          {isAr ? 'لغة الحل (لغة الإخراج)' : 'Submission Language'}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOutputLang('en')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border',
              outputLang === 'en'
                ? 'bg-[#22D3EE]/10 border-[#22D3EE]/50 text-[#22D3EE]'
                : 'bg-[#0A0B0E] border-gray-800 text-gray-500 hover:border-gray-600',
            )}
          >
            🇬🇧 English
          </button>
          <button
            type="button"
            onClick={() => setOutputLang('ar')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border',
              outputLang === 'ar'
                ? 'bg-[#A855F7]/10 border-[#A855F7]/50 text-[#A855F7]'
                : 'bg-[#0A0B0E] border-gray-800 text-gray-500 hover:border-gray-600',
            )}
          >
            🇸🇦 عربي
          </button>
        </div>
        <p className="text-gray-700 text-[10px] mt-1.5">
          {isAr
            ? 'اختر اللغة التي سيُكتب بها الحل — عربي أو إنجليزي'
            : 'Choose the language your assignment will be written in'}
        </p>
      </div>

      {/* File drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all',
          dragging ? 'border-[#22D3EE]/50 bg-[#22D3EE]/5' : 'border-gray-800 hover:border-gray-600',
        )}
      >
        <Upload className="w-5 h-5 text-gray-600 mx-auto mb-2" />
        <p className="text-gray-500 text-xs">
          {isAr ? 'اسحب ملفاتك هنا أو اضغط لرفعها' : 'Drop files here or click to upload'}
        </p>
        <p className="text-gray-700 text-[10px] mt-1">PDF, images, Word docs, code files</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.py,.js,.ts,.cpp,.java"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 bg-[#0A0B0E] border border-gray-800 rounded-lg px-3 py-2">
              {f.type.startsWith('image/') ? (
                <Image className="w-3.5 h-3.5 text-[#22D3EE] shrink-0" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-[#A855F7] shrink-0" />
              )}
              <span className="text-gray-300 text-xs flex-1 truncate">{f.name}</span>
              <span className="text-gray-600 text-[10px] shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
              <button
                onClick={e => { e.stopPropagation(); removeFile(i); }}
                className="text-gray-600 hover:text-red-400 transition-colors ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Prompt textarea */}
      <div>
        <label className="block text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1.5">
          {isAr ? 'نص الواجب / التعليمات' : 'Assignment Brief'}
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={5}
          placeholder={isAr
            ? 'الصق نص الواجب هنا، أو اكتب التعليمات…'
            : 'Paste your assignment brief here, or describe what you need…'}
          dir={outputLang === 'ar' ? 'rtl' : 'ltr'}
          className="w-full bg-[#0A0B0E] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-[#22D3EE]/50 resize-none leading-relaxed"
        />
      </div>

      {/* Launch button */}
      <button
        onClick={handleLaunch}
        disabled={!canLaunch}
        className={cn(
          'w-full py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2',
          canLaunch
            ? 'bg-[#22D3EE] text-black hover:bg-white'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed',
        )}
      >
        {isProcessing ? (
          <>
            <span className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
            {isAr ? 'Mi شغّال…' : 'Mi is working…'}
          </>
        ) : (
          <>
            <Rocket className="w-4 h-4" />
            {isAr ? 'ابعت المهمة' : 'Launch Mission'}
          </>
        )}
      </button>
    </div>
  );
}
