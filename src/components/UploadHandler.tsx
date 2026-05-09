import React, { useState, useRef } from 'react';
import { Upload, X, ChevronDown, Zap, FileText, Image, Code2, Calculator, BookOpen, Presentation, Globe, Building2, PlusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

interface UploadHandlerProps {
  onLaunch: (files: File[], prompt: string, university?: string, course?: string, system?: string, reference?: string, missionType?: string, country?: string, major?: string) => void;
  isProcessing?: boolean;
}

// ── COUNTRY DATA ─────────────────────────────────────────────────────────────
const COUNTRIES = [
  { code: 'EG', en: 'Egypt 🇪🇬', ar: 'مصر 🇪🇬' },
  { code: 'SA', en: 'Saudi Arabia 🇸🇦', ar: 'السعودية 🇸🇦' },
  { code: 'AE', en: 'UAE 🇦🇪', ar: 'الإمارات 🇦🇪' },
  { code: 'KW', en: 'Kuwait 🇰🇼', ar: 'الكويت 🇰🇼' },
  { code: 'BH', en: 'Bahrain 🇧🇭', ar: 'البحرين 🇧🇭' },
  { code: 'JO', en: 'Jordan 🇯🇴', ar: 'الأردن 🇯🇴' },
  { code: 'LB', en: 'Lebanon 🇱🇧', ar: 'لبنان 🇱🇧' },
  { code: 'INT', en: 'International 🌍', ar: 'دولي 🌍' },
];

const UNIVERSITIES: Record<string, { en: string; ar: string }[]> = {
  EG: [
    // Public
    { en: 'Cairo University', ar: 'جامعة القاهرة' },
    { en: 'Ain Shams', ar: 'عين شمس' },
    { en: 'Alexandria University', ar: 'جامعة الإسكندرية' },
    { en: 'Mansoura University', ar: 'جامعة المنصورة' },
    { en: 'Tanta University', ar: 'جامعة طنطا' },
    { en: 'Zagazig University', ar: 'جامعة الزقازيق' },
    { en: 'Assiut University', ar: 'جامعة أسيوط' },
    { en: 'South Valley University', ar: 'جامعة جنوب الوادي' },
    { en: 'Helwan University', ar: 'جامعة حلوان' },
    { en: 'Suez Canal University', ar: 'جامعة قناة السويس' },
    { en: 'Benha University', ar: 'جامعة بنها' },
    { en: 'Kafr El-Sheikh University', ar: 'جامعة كفر الشيخ' },
    { en: 'Sohag University', ar: 'جامعة سوهاج' },
    { en: 'Menoufia University', ar: 'جامعة المنوفية' },
    { en: 'Damietta University', ar: 'جامعة دمياط' },
    { en: 'Port Said University', ar: 'جامعة بورسعيد' },
    { en: 'Fayoum University', ar: 'جامعة الفيوم' },
    { en: 'Minia University', ar: 'جامعة المنيا' },
    { en: 'Aswan University', ar: 'جامعة أسوان' },
    { en: 'Sadat City University', ar: 'جامعة مدينة السادات' },
    { en: 'Al-Azhar University', ar: 'جامعة الأزهر' },
    // Private
    { en: 'AUC', ar: 'الجامعة الأمريكية بالقاهرة (AUC)' },
    { en: 'GUC', ar: 'الجامعة الألمانية بالقاهرة (GUC)' },
    { en: 'BUE', ar: 'الجامعة البريطانية (BUE)' },
    { en: 'MIU', ar: 'جامعة مصر الدولية (MIU)' },
    { en: 'MSA University', ar: 'جامعة MSA' },
    { en: 'CIC', ar: 'CIC' },
    { en: 'MTI University', ar: 'جامعة MTI' },
    { en: 'PUA', ar: 'الأكاديمية العربية (PUA)' },
    { en: 'AAST', ar: 'أكاديمية العلوم والتكنولوجيا (AAST)' },
    { en: 'Nile University', ar: 'جامعة النيل' },
    { en: 'October 6 University', ar: 'جامعة أكتوبر 6' },
    { en: 'Horus University', ar: 'جامعة حورس' },
    { en: 'Must University', ar: 'جامعة مصر للعلوم والتكنولوجيا (Must)' },
    { en: 'Ahram Canadian University', ar: 'جامعة الأهرام الكندية' },
    { en: 'Pharos University', ar: 'جامعة فاروس' },
    { en: 'Al-Ittihad University', ar: 'جامعة الاتحاد' },
    { en: 'Delta University', ar: 'جامعة الدلتا' },
    { en: 'Egyptian Chinese University', ar: 'الجامعة المصرية الصينية' },
  ],
  SA: [
    { en: 'King Saud University', ar: 'جامعة الملك سعود' },
    { en: 'King Abdulaziz University', ar: 'جامعة الملك عبدالعزيز' },
    { en: 'KFUPM', ar: 'جامعة الملك فهد للبترول (KFUPM)' },
    { en: 'KAUST', ar: 'جامعة الملك عبدالله للعلوم (KAUST)' },
    { en: 'King Faisal University', ar: 'جامعة الملك فيصل' },
    { en: 'King Khalid University', ar: 'جامعة الملك خالد' },
    { en: 'Umm Al-Qura University', ar: 'جامعة أم القرى' },
    { en: 'Imam Muhammad University', ar: 'جامعة الإمام محمد بن سعود' },
    { en: 'Taibah University', ar: 'جامعة طيبة' },
    { en: 'Tabuk University', ar: 'جامعة تبوك' },
    { en: 'Al-Jouf University', ar: 'جامعة الجوف' },
    { en: "Ha'il University", ar: 'جامعة حائل' },
    { en: 'Najran University', ar: 'جامعة نجران' },
    { en: 'Al-Baha University', ar: 'جامعة الباحة' },
    { en: 'Prince Sultan University', ar: 'جامعة الأمير سلطان' },
    { en: 'Dar Al-Hekma University', ar: 'جامعة دار الحكمة' },
    { en: 'Effat University', ar: 'جامعة عفت' },
    { en: 'Alfaisal University', ar: 'جامعة الفيصل' },
    { en: 'BAU', ar: 'جامعة الأعمال والتكنولوجيا (BAU)' },
  ],
  AE: [
    { en: 'UAEU', ar: 'جامعة الإمارات العربية (UAEU)' },
    { en: 'AUS', ar: 'الجامعة الأمريكية بالشارقة (AUS)' },
    { en: 'Zayed University', ar: 'جامعة زايد' },
    { en: 'Khalifa University', ar: 'جامعة خليفة' },
    { en: 'HCT', ar: 'HCT' },
    { en: 'University of Sharjah', ar: 'جامعة الشارقة' },
    { en: 'Abu Dhabi University', ar: 'جامعة أبوظبي' },
    { en: 'Al Ain University', ar: 'جامعة العين' },
    { en: 'Gulf Medical University', ar: 'جامعة الخليج الطبية' },
    { en: 'Ajman University', ar: 'جامعة عجمان' },
    { en: 'BITS Pilani Dubai', ar: 'BITS Pilani دبي' },
    { en: 'Dubai University', ar: 'جامعة دبي' },
  ],
  KW: [
    { en: 'Kuwait University', ar: 'جامعة الكويت' },
    { en: 'GUST', ar: 'جامعة الخليج للعلوم والتكنولوجيا (GUST)' },
    { en: 'AUK', ar: 'الجامعة الأمريكية بالكويت (AUK)' },
    { en: 'Gulf University for Science & Technology', ar: 'جامعة الخليج' },
  ],
  BH: [
    { en: 'University of Bahrain', ar: 'جامعة البحرين' },
    { en: 'AMA International University', ar: 'جامعة AMA الدولية' },
    { en: 'RCSI Bahrain', ar: 'RCSI البحرين' },
    { en: 'Ahlia University', ar: 'جامعة أهلية' },
  ],
  JO: [
    { en: 'University of Jordan', ar: 'الجامعة الأردنية' },
    { en: 'Yarmouk University', ar: 'جامعة اليرموك' },
    { en: 'JUST', ar: 'جامعة العلوم والتكنولوجيا الأردنية (JUST)' },
    { en: 'German-Jordanian University', ar: 'الجامعة الألمانية الأردنية' },
    { en: 'Applied Science University', ar: 'جامعة العلوم التطبيقية' },
  ],
  LB: [
    { en: 'AUB', ar: 'الجامعة الأمريكية في بيروت (AUB)' },
    { en: 'LAU', ar: 'الجامعة اللبنانية الأمريكية (LAU)' },
    { en: 'Notre Dame University', ar: 'جامعة سيدة اللويزة (NDU)' },
    { en: 'Lebanese University', ar: 'الجامعة اللبنانية' },
  ],
  INT: [
    { en: 'IGCSE', ar: 'IGCSE' },
    { en: 'IB (International Baccalaureate)', ar: 'الباكالوريا الدولية (IB)' },
    { en: 'A-Level', ar: 'A-Level' },
    { en: 'SAT / AP', ar: 'SAT / AP' },
    { en: 'Edexcel', ar: 'إيدكسل' },
  ],
};

// ── MAJORS ────────────────────────────────────────────────────────────────────
const MAJORS_EN: Record<string, string[]> = {
  '⚙️ Engineering & Tech': ['Civil Engineering', 'Architecture', 'Electrical Engineering', 'Mechanical Engineering', 'Chemical Engineering', 'Electronics Engineering', 'Computer Science (CS)', 'Information Technology (IT)', 'Software Engineering', 'Cybersecurity', 'Artificial Intelligence', 'Information Systems (IS)', 'Petroleum Engineering', 'Industrial Engineering', 'Environmental Engineering'],
  '🏥 Medical & Health': ['Medicine (MBBS)', 'Dentistry', 'Pharmacy', 'Nursing', 'Physiotherapy', 'Nutrition & Food Sciences', 'Medical Lab Sciences', 'Hospital Administration', 'Veterinary Medicine', 'Biomedical Sciences'],
  '💼 Business & Admin': ['Business Administration (MBA)', 'Marketing', 'Accounting', 'Economics', 'Finance & Banking', 'Human Resources (HR)', 'Supply Chain Management', 'Entrepreneurship', 'International Trade', 'Management Information Systems (MIS)', 'Actuarial Science'],
  '⚖️ Law & Politics': ['Private Law', 'Public Law', 'Commercial Law', 'Political Science', 'International Relations', 'Sharia & Law', 'Legal Studies'],
  '📺 Media & Arts': ['Journalism & Mass Communication', 'Public Relations', 'Media Production', 'Graphic Design', 'Visual Arts', 'Film & TV Production', 'Digital Media', 'Advertising', 'Photography'],
  '📖 Humanities': ['English Literature', 'Arabic Literature', 'Translation & Linguistics', 'Psychology', 'Sociology', 'Philosophy', 'History', 'Education & Teaching', 'Social Work', 'Geography'],
  '🔬 Pure Sciences': ['Mathematics', 'Statistics', 'Physics', 'Chemistry', 'Biology', 'Geology', 'Environmental Science', 'Biotechnology', 'Biochemistry'],
};

const MAJORS_AR: Record<string, string[]> = {
  '⚙️ هندسة وتقنية': ['هندسة مدنية', 'هندسة معمارية', 'هندسة كهربائية', 'هندسة ميكانيكية', 'هندسة كيميائية', 'هندسة إلكترونيات', 'علوم حاسب (CS)', 'تقنية معلومات (IT)', 'هندسة برمجيات', 'أمن المعلومات والسيبراني', 'ذكاء اصطناعي', 'نظم معلومات', 'هندسة بترول', 'هندسة صناعية', 'هندسة بيئية'],
  '🏥 طب وصحة': ['طب بشري', 'طب أسنان', 'صيدلة', 'تمريض', 'علاج طبيعي', 'تغذية وعلوم غذائية', 'مختبرات طبية', 'إدارة مستشفيات', 'طب بيطري', 'علوم طبية حيوية'],
  '💼 أعمال وإدارة': ['إدارة أعمال (MBA)', 'تسويق', 'محاسبة', 'اقتصاد', 'مالية وبنوك', 'موارد بشرية', 'سلاسل إمداد', 'ريادة أعمال', 'تجارة دولية', 'نظم معلومات إدارية (MIS)', 'علوم اكتوارية'],
  '⚖️ قانون وسياسة': ['قانون خاص', 'قانون عام', 'قانون تجاري', 'علوم سياسية', 'علاقات دولية', 'شريعة وقانون', 'دراسات قانونية'],
  '📺 إعلام وفنون': ['إعلام وصحافة', 'علاقات عامة', 'إنتاج إعلامي', 'تصميم جرافيك', 'فنون بصرية', 'إنتاج سينمائي وتلفزيوني', 'إعلام رقمي', 'إعلان وتسويق', 'تصوير'],
  '📖 إنسانيات': ['أدب إنجليزي', 'أدب عربي', 'ترجمة ولغويات', 'علم نفس', 'علم اجتماع', 'فلسفة', 'تاريخ', 'تربية وتعليم', 'خدمة اجتماعية', 'جغرافيا'],
  '🔬 علوم بحتة': ['رياضيات', 'إحصاء', 'فيزياء', 'كيمياء', 'أحياء', 'جيولوجيا', 'علوم بيئية', 'تقنية حيوية', 'كيمياء حيوية'],
};

const SYSTEMS_EN = ['Egyptian Credit Hours', 'Egyptian Semester', 'APA 7th', 'Harvard', 'Vancouver', 'Chicago', 'MLA', 'IEEE', 'ISO', 'Other'];
const SYSTEMS_AR = ['ساعات معتمدة مصرية', 'فصلي مصري', 'APA الطبعة السابعة', 'هارفارد', 'فانكوفر', 'شيكاغو', 'MLA', 'IEEE', 'ISO', 'أخرى'];

const MISSION_TYPES_EN = [
  { value: 'essay', icon: '✍️', label: 'Essay / Report' },
  { value: 'presentation', icon: '📊', label: 'Presentation' },
  { value: 'computer_science', icon: '💻', label: 'Code / Project' },
  { value: 'math', icon: '📐', label: 'Math / Physics' },
  { value: 'research_paper', icon: '🔬', label: 'Research' },
  { value: 'case_study', icon: '📋', label: 'Case Study' },
  { value: 'data_analysis', icon: '📈', label: 'Data Analysis' },
  { value: 'law', icon: '⚖️', label: 'Legal' },
];
const MISSION_TYPES_AR = [
  { value: 'essay', icon: '✍️', label: 'مقال / تقرير' },
  { value: 'presentation', icon: '📊', label: 'بروزنتيشن' },
  { value: 'computer_science', icon: '💻', label: 'كود / مشروع' },
  { value: 'math', icon: '📐', label: 'رياضيات / فيزياء' },
  { value: 'research_paper', icon: '🔬', label: 'بحث' },
  { value: 'case_study', icon: '📋', label: 'دراسة حالة' },
  { value: 'data_analysis', icon: '📈', label: 'تحليل بيانات' },
  { value: 'law', icon: '⚖️', label: 'قانوني' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function UploadHandler({ onLaunch, isProcessing }: UploadHandlerProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState('');
  const [country, setCountry] = useState('');
  const [university, setUniversity] = useState('');
  const [customUni, setCustomUni] = useState('');
  const [showCustomUni, setShowCustomUni] = useState(false);
  const [major, setMajor] = useState('');
  const [system, setSystem] = useState('');
  const [missionType, setMissionType] = useState('');
  const [dragging, setDragging] = useState(false);

  const SYSTEMS = isAr ? SYSTEMS_AR : SYSTEMS_EN;
  const MISSION_TYPES = isAr ? MISSION_TYPES_AR : MISSION_TYPES_EN;
  const MAJORS = isAr ? MAJORS_AR : MAJORS_EN;
  const countryUnis = country ? (UNIVERSITIES[country] || []) : [];

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const arr = Array.from(newFiles).filter(f =>
      ['application/pdf', 'image/', 'text/', 'application/msword', '.docx'].some(t => f.type.startsWith(t) || f.name.endsWith('.docx') || f.name.endsWith('.txt'))
    );
    setFiles(prev => [...prev, ...arr].slice(0, 5));
  };

  const canLaunch = (prompt.trim().length >= 10 || files.length > 0) && !isProcessing;

  const handleLaunch = () => {
    if (!canLaunch) return;
    const finalUni = showCustomUni ? customUni : university;
    const allMajors = Object.values(isAr ? MAJORS_AR : MAJORS_EN).flat();
    onLaunch(files, prompt, finalUni, major, system, '', missionType, country, major);
  };

  return (
    <div className={cn('w-full space-y-4', isAr && 'font-[Cairo]')} dir={isAr ? 'rtl' : 'ltr'}>

      {/* Mission Type Pills */}
      <div>
        <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-2">
          {isAr ? 'نوع الواجب' : 'Assignment Type'}
        </p>
        <div className="flex flex-wrap gap-2">
          {MISSION_TYPES.map(t => (
            <button key={t.value} onClick={() => setMissionType(missionType === t.value ? '' : t.value)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border',
                missionType === t.value
                  ? 'bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/40'
                  : 'bg-[#0A0B0E] text-gray-500 border-gray-800 hover:border-gray-700 hover:text-gray-300')}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Context Row — Country + University + Major */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Country */}
        <div>
          <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-1.5">
            {isAr ? 'الدولة' : 'Country'}
          </p>
          <div className="relative">
            <select value={country} onChange={e => { setCountry(e.target.value); setUniversity(''); setShowCustomUni(false); }}
              className="w-full bg-[#0A0B0E] border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-gray-600 cursor-pointer">
              <option value="">{isAr ? 'اختار الدولة' : 'Select Country'}</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{isAr ? c.ar : c.en}</option>
              ))}
            </select>
            <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
          </div>
        </div>

        {/* University */}
        <div>
          <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-1.5">
            {isAr ? 'الجامعة' : 'University'}
          </p>
          {showCustomUni ? (
            <div className="flex gap-2">
              <input value={customUni} onChange={e => setCustomUni(e.target.value)}
                placeholder={isAr ? 'اكتب اسم جامعتك' : 'Type your university'}
                className="flex-1 bg-[#0A0B0E] border border-[#22D3EE]/40 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none placeholder-gray-700" />
              <button onClick={() => setShowCustomUni(false)} className="text-gray-600 hover:text-white text-xs px-2">✕</button>
            </div>
          ) : (
            <div className="relative">
              <select value={university} onChange={e => {
                if (e.target.value === '__custom__') { setShowCustomUni(true); setUniversity(''); }
                else setUniversity(e.target.value);
              }}
                className="w-full bg-[#0A0B0E] border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-gray-600 cursor-pointer">
                <option value="">{isAr ? 'اختار الجامعة' : 'Select University'}</option>
                {countryUnis.map(u => (
                  <option key={u.en} value={u.en}>{isAr ? u.ar : u.en}</option>
                ))}
                {!country && <option disabled>{isAr ? '← اختار الدولة أولاً' : '← Select country first'}</option>}
                <option value="__custom__">{isAr ? '➕ جامعتي مش في القائمة' : '➕ My uni is not listed'}</option>
              </select>
              <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Major */}
        <div>
          <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-1.5">
            {isAr ? 'التخصص' : 'Major'}
          </p>
          <div className="relative">
            <select value={major} onChange={e => setMajor(e.target.value)}
              className="w-full bg-[#0A0B0E] border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-gray-600 cursor-pointer">
              <option value="">{isAr ? 'اختار التخصص' : 'Select Major'}</option>
              {Object.entries(MAJORS).map(([category, items]) => (
                <optgroup key={category} label={category}>
                  {items.map(item => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Academic System */}
      <div>
        <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-1.5">
          {isAr ? 'النظام الأكاديمي / التوثيق' : 'Academic System / Reference Style'}
        </p>
        <div className="relative">
          <select value={system} onChange={e => setSystem(e.target.value)}
            className="w-full bg-[#0A0B0E] border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-gray-600 cursor-pointer">
            <option value="">{isAr ? 'اختياري' : 'Optional'}</option>
            {SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
        </div>
      </div>

      {/* File Upload */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={cn('border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all',
          dragging ? 'border-[#22D3EE]/60 bg-[#22D3EE]/5' : 'border-gray-800 hover:border-gray-700 bg-[#0A0B0E]/50')}>
        <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp,.csv" className="hidden"
          onChange={e => handleFiles(e.target.files)} />
        <Upload className="w-5 h-5 text-gray-600 mx-auto mb-2" />
        <p className="text-gray-600 text-xs">{isAr ? 'ارفع الملف أو اسحبه هنا' : 'Drop files or click to upload'}</p>
        <p className="text-gray-700 text-[10px] mt-1">PDF · Images · Word · Text</p>
      </div>

      {/* Files preview */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 bg-[#0A0B0E] border border-gray-800 rounded-xl px-3 py-1.5">
              <FileText className="w-3 h-3 text-[#22D3EE]" />
              <span className="text-xs text-gray-400 max-w-[120px] truncate">{f.name}</span>
              <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-gray-700 hover:text-red-400 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Prompt */}
      <div>
        <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-1.5">
          {isAr ? 'اكتب الواجب أو التعليمات' : 'Assignment / Instructions'}
        </p>
        <textarea
          value={prompt} onChange={e => setPrompt(e.target.value)}
          rows={5}
          placeholder={isAr
            ? 'الصق الواجب هنا أو اشرح المطلوب بالتفصيل...'
            : 'Paste your assignment here or describe exactly what is needed...'}
          className="w-full bg-[#0A0B0E] border border-gray-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#22D3EE]/50 transition-all resize-none placeholder:text-gray-700"
        />
      </div>

      {/* Launch */}
      <button
        onClick={handleLaunch}
        disabled={!canLaunch}
        className={cn('w-full py-4 rounded-2xl font-black text-sm tracking-wide transition-all',
          canLaunch
            ? 'bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black hover:opacity-90 active:scale-[0.99]'
            : 'bg-gray-900 text-gray-700 cursor-not-allowed')}>
        {isProcessing
          ? (isAr ? '⏳ جاري الحل...' : '⏳ Processing...')
          : (isAr ? '🚀 ابدأ المهمة' : '🚀 Launch Mission')}
      </button>

      {!canLaunch && !isProcessing && (
        <p className="text-center text-gray-700 text-xs">
          {isAr ? 'ارفع ملف أو اكتب ١٠ حروف على الأقل' : 'Upload a file or write at least 10 characters'}
        </p>
      )}
    </div>
  );
}
