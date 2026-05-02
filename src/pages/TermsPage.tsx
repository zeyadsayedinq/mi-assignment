import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Shield } from 'lucide-react';

const UPDATED = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const UPDATED_AR = new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });

export function TermsPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <div className={cn('w-full min-h-screen bg-[#020617] text-white font-sans', isAr && 'font-[Cairo]')} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto px-6 py-12">

        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="text-[#22D3EE] hover:underline text-sm">Mi-Assignment</Link>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400 text-sm">{isAr ? 'شروط الاستخدام' : 'Terms of Service'}</span>
        </div>

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE] text-[10px] font-mono uppercase tracking-widest mb-4">
            <Shield className="w-3 h-3" /> {isAr ? 'وثيقة قانونية' : 'Legal Document'}
          </div>
          <h1 className="text-4xl font-black mb-2">{isAr ? 'شروط الاستخدام' : 'Terms of Service'}</h1>
          <p className="text-gray-500 text-sm">{isAr ? `آخر تحديث: ${UPDATED_AR}` : `Last updated: ${UPDATED}`}</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300 text-sm leading-relaxed">

          {isAr ? <>
            <section>
              <h2 className="text-white font-bold text-lg mb-3">١. وصف الخدمة</h2>
              <p>Mi-Assignment هي منصة مساعدة أكاديمية مدعومة بالذكاء الاصطناعي، تساعد الطلاب في فهم المواد الدراسية وصياغة المحتوى الأكاديمي. الخدمة متاحة عبر www.mi-assignment.com لطلاب الجامعات والثانوية في منطقة الشرق الأوسط وشمال أفريقيا.</p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">٢. إخلاء مسؤولية النزاهة الأكاديمية</h2>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-200">
                <p className="font-bold mb-2">تحذير مهم — اقرأ بعناية</p>
                <p>Mi-Assignment هي أداة تعليمية ومساعدة في الصياغة. أنت مسؤول مسؤولية كاملة عن مراجعة وتعديل والتأكد من أن أي محتوى تقدمه يتوافق مع سياسة النزاهة الأكاديمية لمؤسستك. Mi-Assignment لا تشجع على الغش الأكاديمي أو الانتهاك الصريح للوائح الجامعية.</p>
              </div>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">٣. الحسابات والتسجيل</h2>
              <p>يجب أن تكون في الثامنة عشرة من عمرك أو أكثر للتسجيل. أنت مسؤول عن الحفاظ على سرية كلمة مرور حسابك. Mi-Assignment تحتفظ بالحق في إنهاء حسابات تنتهك هذه الشروط.</p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">٤. شروط الاشتراك والفوترة</h2>
              <p>الخطة المجانية: ٣ مهام شهرياً، تتجدد في أول كل شهر.</p>
              <p className="mt-2">خطة Pro: الاشتراك ربع السنوي (٩٠ يوماً) أو السنوي يُجدَّد تلقائياً ما لم يُلغى قبل ٢٤ ساعة من انتهاء الفترة الحالية. المدفوعات غير قابلة للاسترداد خارج نافذة ٧ أيام من تاريخ الدفع.</p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">٥. سياسة الاسترداد</h2>
              <p>يمكنك طلب استرداد كامل خلال ٧ أيام من تاريخ الدفع. لطلب الاسترداد، تواصل مع <a href="mailto:support@mi-assignment.com" className="text-[#22D3EE]">support@mi-assignment.com</a> مع رقم المرجع. بعد ٧ أيام، لا يمكن إجراء أي استردادات.</p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">٦. حدود المسؤولية</h2>
              <p>Mi-Assignment غير مسؤولة عن أي خسائر ناجمة عن الاعتماد على المحتوى المُنشأ بالذكاء الاصطناعي، أو عن أي عواقب أكاديمية أو قانونية تنتج عن استخدام المنصة. الخدمة مقدمة "كما هي" دون ضمانات صريحة أو ضمنية.</p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">٧. القانون الحاكم</h2>
              <p>تخضع هذه الشروط لقوانين جمهورية مصر العربية. أي نزاعات يُفضَّل حلها ودياً في المقام الأول.</p>
            </section>

          </> : <>
            <section>
              <h2 className="text-white font-bold text-lg mb-3">1. Service Description</h2>
              <p>Mi-Assignment is a Mi-powered academic assistance platform that helps students understand course material and draft academic content. The service is available at www.mi-assignment.com for university and high school students across the MENA region.</p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">2. Academic Integrity Disclaimer</h2>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-200">
                <p className="font-bold mb-2">Important — please read carefully</p>
                <p>Mi-Assignment is a learning and drafting assistance tool. You are solely responsible for reviewing, editing, and ensuring that any content you submit complies with your institution's academic integrity policy. Mi-Assignment does not condone academic fraud, plagiarism, or any violation of your institution's academic regulations.</p>
              </div>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">3. Accounts & Registration</h2>
              <p>You must be 18 or older to register. You are responsible for maintaining the confidentiality of your account password. Mi-Assignment reserves the right to terminate accounts that violate these terms.</p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">4. Subscription & Billing</h2>
              <p>Free plan: 3 missions per month, resets on the 1st of each month.</p>
              <p className="mt-2">Pro plan: Quarterly (90 days) or annual subscriptions renew automatically unless cancelled at least 24 hours before the current period ends. Payments are processed by Tap Payments.</p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">5. Refund Policy</h2>
              <p>You may request a full refund within 7 days of your payment date. To request a refund, contact <a href="mailto:support@mi-assignment.com" className="text-[#22D3EE]">support@mi-assignment.com</a> with your reference number. No refunds are issued after the 7-day window.</p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">6. Limitation of Liability</h2>
              <p>Mi-Assignment is not liable for any losses arising from reliance on Mi-generated content, or for any academic or legal consequences resulting from use of the platform. The service is provided "as is" without express or implied warranties.</p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">7. Governing Law</h2>
              <p>These terms are governed by the laws of the Arab Republic of Egypt. Any disputes should first be attempted to be resolved amicably.</p>
            </section>

            <section>
              <h2 className="text-white font-bold text-lg mb-3">8. Contact</h2>
              <p>For any questions about these terms: <a href="mailto:info@mi-assignment.com" className="text-[#22D3EE]">info@mi-assignment.com</a></p>
            </section>
          </>}
        </div>

        <div className="mt-12 pt-6 border-t border-gray-800 flex flex-wrap gap-4 text-xs text-gray-600">
          <Link to="/privacy" className="hover:text-[#22D3EE] transition-colors">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link>
          <Link to="/sops" className="hover:text-[#22D3EE] transition-colors">{isAr ? 'المساعدة' : 'Help & FAQ'}</Link>
          <Link to="/" className="hover:text-[#22D3EE] transition-colors">{isAr ? 'العودة للتطبيق' : 'Back to app'}</Link>
        </div>
      </div>
    </div>
  );
}
