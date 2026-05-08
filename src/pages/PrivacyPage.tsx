import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Lock } from 'lucide-react';

const UPDATED = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const UPDATED_AR = new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });

export function PrivacyPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <div className={cn('w-full min-h-screen bg-[#020617] text-white font-sans', isAr && 'font-[Cairo]')} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto px-6 py-12">

        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="text-[#22D3EE] hover:underline text-sm">Mi-Assignment</Link>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400 text-sm">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</span>
        </div>

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A855F7]/10 border border-[#A855F7]/20 text-[#A855F7] text-[10px] font-mono uppercase tracking-widest mb-4">
            <Lock className="w-3 h-3" /> {isAr ? 'بياناتك آمنة' : 'Your data is safe'}
          </div>
          <h1 className="text-4xl font-black mb-2">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</h1>
          <p className="text-gray-500 text-sm">{isAr ? `آخر تحديث: ${UPDATED_AR}` : `Last updated: ${UPDATED}`}</p>
        </div>

        <div className="space-y-8 text-gray-300 text-sm leading-relaxed">
          {isAr ? <>
            <section>
              <h2 className="text-white font-bold text-lg mb-3">١. البيانات التي نجمعها</h2>
              <div className="space-y-2">
                <p><strong className="text-white">بيانات الحساب:</strong> البريد الإلكتروني، الاسم (اختياري)، وتفضيلات اللغة.</p>
                <p><strong className="text-white">بيانات الاستخدام:</strong> نوع الواجب، عدد الكلمات التقريبي، الجامعة (اختياري)، الطابع الزمني للمهمة. <strong>لا نحتفظ بمحتوى المهام.</strong></p>
                <p><strong className="text-white">بيانات الدفع:</strong> رقم المرجع ومعرف المعاملة فقط. لا نحتفظ ببيانات البطاقة — هذا يتولاه Tap Payments بشكل كامل.</p>
                <p><strong className="text-white">بيانات التحليلات:</strong> الصفحات المُشاهدة، المهام المكتملة، معدل الاحتفاظ. لا توجد بيانات تعريفية شخصية.</p>
              </div>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">٢. كيف نستخدم بياناتك</h2>
              <ul className="space-y-1.5 list-none">
                {['تشغيل الخدمة وحفظ سجل المهام', 'إرسال إيصالات الدفع وتحذيرات انتهاء الاشتراك', 'تحسين جودة الخدمة عبر التحليلات المجمعة', 'الامتثال للمتطلبات القانونية عند الضرورة'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2"><span className="text-[#22D3EE] mt-0.5">✓</span>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">٣. الأطراف الثالثة</h2>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { name: 'Anthropic', role: 'معالجة الذكاء الاصطناعي — لا يتم تخزين محتوى المهام بعد المعالجة', link: 'https://www.anthropic.com/privacy' },
                  { name: 'Tap Payments', role: 'معالجة المدفوعات — متوافق مع PCI DSS', link: 'https://tap.company/privacy' },
                  { name: 'Supabase', role: 'تخزين قاعدة البيانات — خوادم منطقة الاتحاد الأوروبي', link: 'https://supabase.com/privacy' },
                  { name: 'PostHog', role: 'التحليلات — متوافق مع GDPR، بلا ملفات تتبع إعلانية', link: 'https://posthog.com/privacy' },
                  { name: 'Resend', role: 'إرسال البريد الإلكتروني — إيصالات وتنبيهات فقط', link: 'https://resend.com/privacy' },
                ].map(t => (
                  <div key={t.name} className="bg-[#0A0B0E] border border-gray-800 rounded-xl p-4">
                    <div className="font-bold text-white text-sm mb-1">{t.name}</div>
                    <div className="text-gray-400 text-xs">{t.role}</div>
                    <a href={t.link} target="_blank" rel="noopener noreferrer" className="text-[#22D3EE] text-xs mt-1 inline-block hover:underline">سياسة الخصوصية ←</a>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">٤. الاحتفاظ بالبيانات وحذفها</h2>
              <p>يتم الاحتفاظ ببيانات الحساب طالما كان الحساب نشطاً. عند طلب حذف الحساب، يتم حذف جميع البيانات الشخصية خلال ٣٠ يوماً. لطلب الحذف: <a href="mailto:info@mi-assignment.com" className="text-[#22D3EE]">info@mi-assignment.com</a></p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">٥. حقوقك</h2>
              <p>يحق لك الاطلاع على بياناتك، تصحيحها، حذفها، أو طلب نسخة منها في أي وقت. تواصل معنا على <a href="mailto:info@mi-assignment.com" className="text-[#22D3EE]">info@mi-assignment.com</a></p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">٦. الامتثال — GDPR وPDPL</h2>
              <p>Mi-Assignment تمتثل للائحة الأوروبية العامة لحماية البيانات (GDPR) ونظام حماية البيانات الشخصية السعودي (PDPL). لا نبيع بياناتك لأي طرف ثالث. لا نستخدم ملفات تعريف الارتباط الإعلانية.</p>
            </section>

          </> : <>
            <section>
              <h2 className="text-white font-bold text-lg mb-3">1. Data We Collect</h2>
              <div className="space-y-2">
                <p><strong className="text-white">Account data:</strong> Email address, name (optional), and language preference.</p>
                <p><strong className="text-white">Usage data:</strong> Assignment type, approximate word count, university (optional), mission timestamps. <strong>We do not store the content of your missions.</strong></p>
                <p><strong className="text-white">Payment data:</strong> Transaction reference ID only. We never store card data — this is handled entirely by Tap Payments.</p>
                <p><strong className="text-white">Analytics data:</strong> Pages viewed, missions completed, retention. No personally identifiable information.</p>
              </div>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">2. How We Use Your Data</h2>
              <ul className="space-y-1.5">
                {['Operate the service and save your mission history', 'Send payment receipts and subscription expiry warnings', 'Improve service quality through aggregated analytics', 'Comply with legal requirements when necessary'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2"><span className="text-[#22D3EE] mt-0.5">✓</span>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">3. Third Parties</h2>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { name: 'Anthropic', role: 'Mi processing — mission content is not stored after processing', link: 'https://www.anthropic.com/privacy' },
                  { name: 'Tap Payments', role: 'Payment processing — PCI DSS compliant', link: 'https://tap.company/privacy' },
                  { name: 'Supabase', role: 'Database storage — EU region servers', link: 'https://supabase.com/privacy' },
                  { name: 'PostHog', role: 'Analytics — GDPR compliant, no advertising cookies', link: 'https://posthog.com/privacy' },
                  { name: 'Resend', role: 'Email delivery — receipts and alerts only', link: 'https://resend.com/privacy' },
                ].map(t => (
                  <div key={t.name} className="bg-[#0A0B0E] border border-gray-800 rounded-xl p-4">
                    <div className="font-bold text-white text-sm mb-1">{t.name}</div>
                    <div className="text-gray-400 text-xs">{t.role}</div>
                    <a href={t.link} target="_blank" rel="noopener noreferrer" className="text-[#22D3EE] text-xs mt-1 inline-block hover:underline">Privacy policy →</a>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">4. Data Retention & Deletion</h2>
              <p>Account data is retained while the account is active. Upon account deletion request, all personal data is removed within 30 days. To request deletion: <a href="mailto:info@mi-assignment.com" className="text-[#22D3EE]">info@mi-assignment.com</a></p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">5. Your Rights</h2>
              <p>You have the right to access, correct, delete, or export your data at any time. Contact us at <a href="mailto:info@mi-assignment.com" className="text-[#22D3EE]">info@mi-assignment.com</a></p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">6. Compliance — GDPR & Saudi PDPL</h2>
              <p>Mi-Assignment complies with the EU General Data Protection Regulation (GDPR) and the Saudi Personal Data Protection Law (PDPL). We do not sell your data to any third party. We do not use advertising cookies.</p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">7. Cookie Policy</h2>
              <p>We use one analytics cookie (PostHog) to understand how students use the app. No advertising or tracking cookies. You can opt out of analytics in your browser settings.</p>
            </section>
          </>}
        </div>

        <div className="mt-12 pt-6 border-t border-gray-800 flex flex-wrap gap-4 text-xs text-gray-600">
          <Link to="/terms" className="hover:text-[#22D3EE] transition-colors">{isAr ? 'شروط الاستخدام' : 'Terms of Service'}</Link>
          <Link to="/sops" className="hover:text-[#22D3EE] transition-colors">{isAr ? 'المساعدة' : 'Help & FAQ'}</Link>
          <Link to="/" className="hover:text-[#22D3EE] transition-colors">{isAr ? 'العودة للتطبيق' : 'Back to app'}</Link>
        </div>
      </div>
    </div>
  );
}
