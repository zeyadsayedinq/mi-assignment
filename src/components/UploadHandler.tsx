import React, { useCallback, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X, Zap, Image, FileText, Code, BookOpen, Calculator, Presentation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

interface UploadHandlerProps {
  onLaunch: (files: File[], prompt: string, university?: string, course?: string, system?: string, reference?: string, missionType?: string) => void;
}

// ─── Bilingual data ─────────────────────────────────────────────────────────
const UNIVERSITIES_EN = ["AUC", "GUC", "CIC", "BUE", "MIU", "MSA", "Ain Shams", "Cairo University", "Alexandria", "KFUPM", "King Abdulaziz", "King Saud", "AUS", "UAEU", "Zayed University", "Ivy League", "Russell Group", "Other"];
const UNIVERSITIES_AR = ["AUC", "GUC", "CIC", "BUE", "MIU", "MSA", "عين شمس", "جامعة القاهرة", "الإسكندرية", "جامعة الملك فهد (KFUPM)", "جامعة الملك عبدالعزيز", "جامعة الملك سعود", "AUS", "UAEU", "جامعة زايد", "جامعة دولية أخرى"];

const SYSTEMS_EN = ["IGCSE (Cambridge/Edexcel)", "IB Diploma (SL/HL)", "American Diploma (SAT/AP)", "Egyptian National", "Saudi National", "Undergraduate", "Postgraduate/Masters"];
const SYSTEMS_AR = ["IGCSE (كامبريدج / إيدكسل)", "IB دبلوما (SL/HL)", "الدبلومة الأمريكية (SAT/AP)", "نظام مصري", "نظام سعودي", "بكالوريوس", "ماجستير / دراسات عليا"];

const COURSES_EN = ["Mass Communication / PR", "Marketing / Business", "Engineering", "Computer Science / IT", "Medicine / Pharmacy", "Graphic Design", "Law", "Humanities / English", "Mathematics", "Science (Physics/Chem/Bio)", "Architecture", "Economics", "Education"];
const COURSES_AR = ["إعلام / علاقات عامة", "تسويق / إدارة أعمال", "هندسة", "علوم حاسب / تقنية معلومات", "طب / صيدلة", "تصميم جرافيك", "قانون", "إنسانيات / أدب إنجليزي", "رياضيات", "علوم (فيزياء / كيمياء / أحياء)", "عمارة", "اقتصاد", "تربية"];

const REFERENCES_EN = ["APA 7th Edition", "MLA 9th Edition", "Harvard", "Chicago", "IEEE", "None / Not Required"];
const REFERENCES_AR = ["APA الإصدار السابع", "MLA الإصدار التاسع", "هارفارد", "شيكاغو", "IEEE", "بدون توثيق"];

const MISSION_TYPES_EN = [
  { id: 'essay', label: 'Essay / Report', icon: FileText, color: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400' },
  { id: 'presentation', label: 'Presentation', icon: Presentation, color: 'from-[#A855F7]/20 to-[#A855F7]/5 border-[#A855F7]/30 text-[#A855F7]' },
  { id: 'code', label: 'Code / Project', icon: Code, color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400' },
  { id: 'math', label: 'Math / Physics', icon: Calculator, color: 'from-orange-500/20 to-orange-500/5 border-orange-500/30 text-orange-400' },
  { id: 'research', label: 'Research', icon: BookOpen, color: 'from-[#22D3EE]/20 to-[#22D3EE]/5 border-[#22D3EE]/30 text-[#22D3EE]' },
  { id: 'design', label: 'Design / Visual', icon: Image, color: 'from-pink-500/20 to-pink-500/5 border-pink-500/30 text-pink-400' },
];

const MISSION_TYPES_AR = [
  { id: 'essay', label: 'مقال / تقرير', icon: FileText, color: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400' },
  { id: 'presentation', label: 'بروزنتيشن', icon: Presentation, color: 'from-[#A855F7]/20 to-[#A855F7]/5 border-[#A855F7]/30 text-[#A855F7]' },
  { id: 'code', label: 'كود / مشروع', icon: Code, color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400' },
  { id: 'math', label: 'رياضيات / فيزياء', icon: Calculator, color: 'from-orange-500/20 to-orange-500/5 border-orange-500/30 text-orange-400' },
  { id: 'research', label: 'بحث', icon: BookOpen, color: 'from-[#22D3EE]/20 to-[#22D3EE]/5 border-[#22D3EE]/30 text-[#22D3EE]' },
  { id: 'design', label: 'تصميم / فيجوال', icon: Image, color: 'from-pink-500/20 to-pink-500/5 border-pink-500/30 text-pink-400' },
];

const QUICK_PROMPTS_EN = [
  { label: 'Solve & Explain', prompt: 'Solve this assignment completely. Show all working and explain every step clearly.' },
  { label: 'Full Essay', prompt: 'Write a comprehensive, well-structured essay with introduction, body paragraphs with evidence, and conclusion.' },
  { label: 'Presentation', prompt: 'Create a professional presentation with compelling slides, visuals, and speaker notes.' },
  { label: 'Debug Code', prompt: 'Analyze this code, fix all bugs, optimize performance, and explain every change.' },
  { label: 'Research', prompt: 'Write a deep research report with analysis, citations, and academic conclusion.' },
  { label: 'Summarize', prompt: 'Extract core intelligence. Executive summary + key takeaways + critical analysis.' },
];

const QUICK_PROMPTS_AR = [
  { label: 'احلّها كاملة', prompt: 'احل الواجب ده كامل. وريني كل خطوة بالتفصيل بالعربي.' },
  { label: 'اكتب مقال', prompt: 'اكتب مقال أكاديمي متكامل بمقدمة وعرض وخاتمة، مع حجج وأدلة.' },
  { label: 'بروزنتيشن', prompt: 'اعمل بروزنتيشن احترافي مع شرائح، صور، ونوتس للعرض.' },
  { label: 'صحّح الكود', prompt: 'افحص الكود ده، صلح كل الأخطاء، وشرحلي كل تعديل.' },
  { label: 'بحث عميق', prompt: 'اكتب تقرير بحثي متكامل بالتحليل والمراجع والخاتمة الأكاديمية.' },
  { label: 'لخّص', prompt: 'لخّصلي المحتوى ده في نقاط أساسية وتحليل مختصر.' },
];

export function UploadHandler({ onLaunch }: UploadHandlerProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const location = useLocation();

  const [files, setFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState('');
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [system, setSystem] = useState('');
  const [reference, setReference] = useState('');
  const [missionType, setMissionType] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const UNIVERSITIES = isAr ? UNIVERSITIES_AR : UNIVERSITIES_EN;
  const SYSTEMS = isAr ? SYSTEMS_AR : SYSTEMS_EN;
  const COURSES = isAr ? COURSES_AR : COURSES_EN;
  const REFERENCES = isAr ? REFERENCES_AR : REFERENCES_EN;
  const MISSION_TYPES = isAr ? MISSION_TYPES_AR : MISSION_TYPES_EN;
  const QUICK_PROMPTS = isAr ? QUICK_PROMPTS_AR : QUICK_PROMPTS_EN;

  useEffect(() => {
    if (location.state?.template) {
      const mapEn: Record<string, string> = {
        math: 'Solve step-by-step. Show full working. Final answers clearly formatted.',
        essay: 'Write a structured essay with intro, body paragraphs with arguments and evidence, and a compelling conclusion.',
        code: 'Debug, fix, and optimize. Explain all changes.',
        summarize: 'Executive summary + key takeaways.',
        presentation: 'Create a professional presentation with slides, visuals, and speaker notes.',
        research: 'Deep research with citations, critical analysis, and academic conclusion.',
      };
      const mapAr: Record<string, string> = {
        math: 'احل خطوة بخطوة. وريني كل الحسابات. الإجابات واضحة.',
        essay: 'اكتب مقال أكاديمي بمقدمة وعرض وخاتمة مع حجج وأدلة.',
        code: 'صحّح الكود وشرحلي كل تعديل.',
        summarize: 'ملخص تنفيذي + نقاط أساسية.',
        presentation: 'اعمل بروزنتيشن احترافي مع شرائح وصور ونوتس.',
        research: 'بحث عميق بمراجع وتحليل وخاتمة أكاديمية.',
      };
      const map = isAr ? mapAr : mapEn;
      if (map[location.state.template]) setPrompt(map[location.state.template]);
      if (location.state.missionType) setMissionType(location.state.missionType);
    }
  }, [location.state, isAr]);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles(prev => [...prev, ...accepted]);
    const img = accepted.find(f => f.type.startsWith('image/'));
    if (img) setPreviewUrl(URL.createObjectURL(img));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'text/*': ['.txt', '.md', '.csv'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    }
  });

  const removeFile = (idx: number) => {
    setFiles(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length === 0) setPreviewUrl(null);
      return next;
    });
  };

  const canLaunch = files.length > 0 || prompt.trim().length > 10;

  const fields = [
    {
      label: isAr ? 'الجامعة' : 'University',
      value: university, setter: setUniversity, options: UNIVERSITIES,
      placeholder: isAr ? 'اختار الجامعة' : 'Select University',
    },
    {
      label: isAr ? 'التخصص / المادة' : 'Course / Major',
      value: course, setter: setCourse, options: COURSES,
      placeholder: isAr ? 'اختار المادة' : 'Select Course',
    },
    {
      label: isAr ? 'النظام الأكاديمي' : 'Academic System',
      value: system, setter: setSystem, options: SYSTEMS,
      placeholder: isAr ? 'اختار النظام' : 'Select System',
    },
    {
      label: isAr ? 'أسلوب التوثيق' : 'Reference Style',
      value: reference, setter: setReference, options: REFERENCES,
      placeholder: isAr ? 'اختار التوثيق' : 'Select Style',
    },
  ];

  return (
    <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Mission type */}
      <div>
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3 block">
          {isAr ? 'نوع الواجب' : 'Assignment Type'}
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {MISSION_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setMissionType(missionType === t.id ? '' : t.id)}
              className={cn(
                'flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-medium transition-all bg-gradient-to-b',
                missionType === t.id ? t.color : 'from-transparent border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
              )}
            >
              <t.icon className="w-4 h-4" />
              <span className="text-[10px] text-center leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Context fields */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {fields.map(({ label, value, setter, options, placeholder }) => (
          <div key={label}>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{label}</label>
            <select
              value={value}
              onChange={e => setter(e.target.value)}
              className="w-full bg-[#0A0B0E] border border-gray-800 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-[#22D3EE] transition-all cursor-pointer"
              dir={isAr ? 'rtl' : 'ltr'}
            >
              <option value="">{placeholder}</option>
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* Upload zone */}
      <div>
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 block">
          {isAr ? 'ارفع الملف' : 'Upload Files'}{' '}
          <span className="text-gray-700">{isAr ? '(PDF، صور، نص — اختياري)' : '(PDF, Images, Text — Optional)'}</span>
        </label>
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
            isDragActive ? 'border-[#22D3EE] bg-[#22D3EE]/5' : 'border-gray-800 hover:border-gray-600 hover:bg-white/[0.02]'
          )}
        >
          <input {...getInputProps()} />
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-28 object-contain rounded-lg mx-auto mb-3 border border-gray-800" />
          ) : (
            <UploadCloud className={cn('w-10 h-10 mx-auto mb-3 transition-colors', isDragActive ? 'text-[#22D3EE]' : 'text-gray-700')} />
          )}
          <p className="text-gray-500 text-sm">
            {isDragActive
              ? (isAr ? 'افلت الملف هنا...' : 'Drop it here...')
              : (isAr ? 'اسحب الملف هنا أو انقر للرفع' : 'Drag & drop or click to upload')}
          </p>
          <p className="text-gray-700 text-xs mt-1">PDF, DOCX, PNG, JPG, TXT, MD, CSV</p>
        </div>

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-2">
              {files.map((file, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 bg-[#0A0B0E] border border-gray-800 rounded-xl px-4 py-2.5">
                  <File className="w-4 h-4 text-[#22D3EE] shrink-0" />
                  <span className="text-gray-300 text-xs flex-1 truncate">{file.name}</span>
                  <span className="text-gray-600 text-[10px] shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                  <button onClick={() => removeFile(i)} className="text-gray-600 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Prompt */}
      <div>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
            {isAr ? 'اكتب الواجب أو التعليمات' : 'Mission Brief / Prompt'}
          </label>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {QUICK_PROMPTS.map(q => (
              <button key={q.label} onClick={() => setPrompt(q.prompt)}
                className="px-2 py-0.5 text-[9px] font-mono bg-[#0A0B0E] border border-gray-800 text-gray-500 rounded hover:border-[#22D3EE]/50 hover:text-[#22D3EE] transition-all">
                {q.label}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder={isAr ? 'اكتب الواجب كامل أو أي تعليمات خاصة من الدكتور...' : 'Describe your assignment, requirements, or paste it directly...'}
          rows={4}
          dir={isAr ? 'rtl' : 'ltr'}
          className="w-full bg-[#0A0B0E] border border-gray-800 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#22D3EE] transition-all resize-none placeholder:text-gray-600"
        />
        <p className={cn('text-gray-700 text-[10px] mt-1', isAr ? 'text-start' : 'text-end')}>{prompt.length} {isAr ? 'حرف' : 'characters'}</p>
      </div>

      {/* Launch */}
      <button
        onClick={() => onLaunch(files, prompt, university, course, system, reference, missionType)}
        disabled={!canLaunch}
        className="w-full py-5 bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-black font-black text-sm uppercase tracking-[0.2em] rounded-2xl hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(34,211,238,0.15)]"
      >
        <Zap className="w-5 h-5" />
        {isAr ? '🚀 ابدأ المهمة' : 'Launch Mission'}
        <Zap className="w-5 h-5" />
      </button>

      {!canLaunch && (
        <p className="text-center text-gray-600 text-xs">
          {isAr ? 'ارفع ملف أو اكتب ١٠ حروف على الأقل.' : 'Upload a file or write at least 10 characters to launch.'}
        </p>
      )}
    </div>
  );
}
