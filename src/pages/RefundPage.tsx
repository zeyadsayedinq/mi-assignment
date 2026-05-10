import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ArrowLeft } from 'lucide-react';

export function RefundPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <div className="min-h-screen bg-[#020617] text-white" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Nav */}
        <div className="flex items-center gap-4 mb-12">
          <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-[#22D3EE] transition-colors text-sm">
            <Home className="w-4 h-4" />
            {isAr ? 'الرئيسية' : 'Home'}
          </Link>
          <span className="text-gray-800">/</span>
          <span className="text-gray-400 text-sm">{isAr ? 'سياسة الاسترداد' : 'Refund Policy'}</span>
        </div>

        <h1 className="text-3xl font-black mb-2">{isAr ? 'سياسة الاسترداد' : 'Refund Policy'}</h1>
        <p className="text-gray-500 text-sm mb-10">{isAr ? 'آخر تحديث: مايو ٢٠٢٦' : 'Last updated: May 2026'}</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">

          {isAr ? (
            <>
              <section>
                <h2 className="text-lg font-bold text-white mb-3">١. طبيعة الخدمة</h2>
                <p>Mi-Assignment هي خدمة رقمية تعليمية تُقدّم حلولاً أكاديمية فورية بمجرد تقديم الطلب. نظراً لأن الخدمة تُستهلك فور تقديمها، فإن سياسة الاسترداد محدودة وفق الشروط التالية.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-white mb-3">٢. حالات عدم الاسترداد</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>تم استخدام مهمة واحدة أو أكثر من الاشتراك.</li>
                  <li>تم تسليم الحل الأكاديمي بشكل كامل وقابل للتنزيل.</li>
                  <li>الاشتراك نشط ومنتهٍ مدته خلال الفترة المدفوعة.</li>
                  <li>تقديم شكوى بعد مرور ٢٤ ساعة من تاريخ الشراء.</li>
                  <li>رفض الخدمة بسبب انتهاك سياسة النزاهة الأكاديمية.</li>
                </ul>
              </section>
              <section>
                <h2 className="text-lg font-bold text-white mb-3">٣. الحالات الاستثنائية</h2>
                <p>في حال وجود خلل تقني مثبّت منعك من الوصول إلى الخدمة تماماً رغم إتمام الدفع، يحق لك التواصل معنا خلال ٢٤ ساعة لدراسة الحالة وتقديم رصيد مهام إضافية أو تمديد الاشتراك — لا استرداداً نقدياً.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-white mb-3">٤. إخلاء المسؤولية الأكاديمية</h2>
                <p>Mi-Assignment أداة تعليمية مساعِدة. أنت المسؤول الكامل عن استخدام المخرجات وفق سياسة النزاهة الأكاديمية لجامعتك. لا يحق المطالبة بالاسترداد بسبب نتيجة أكاديمية أو قرار من جهة التعليم.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-white mb-3">٥. التواصل</h2>
                <p>للاستفسارات: <a href="mailto:support@mi-assignment.com" className="text-[#22D3EE] hover:underline">support@mi-assignment.com</a></p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-lg font-bold text-white mb-3">1. Nature of Service</h2>
                <p>Mi-Assignment is a digital educational service that delivers Mi-powered academic solutions instantly upon request. Because the service is consumed immediately upon delivery, our refund policy is limited as described below.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-white mb-3">2. Non-Refundable Situations</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>One or more missions have been used from the subscription.</li>
                  <li>A complete academic solution has been delivered and made available for download.</li>
                  <li>The subscription is active and within its paid period.</li>
                  <li>A complaint is raised more than 24 hours after the purchase date.</li>
                  <li>Service denied due to violation of academic integrity policy.</li>
                </ul>
              </section>
              <section>
                <h2 className="text-lg font-bold text-white mb-3">3. Exceptional Cases</h2>
                <p>If a verified technical failure prevented you from accessing the service entirely despite completing payment, you may contact us within 24 hours. We will review the case and offer bonus mission credits or subscription extension — not a cash refund.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-white mb-3">4. Academic Disclaimer</h2>
                <p>Mi-Assignment is an educational assistance tool. You are solely responsible for using outputs in accordance with your institution's academic integrity policy. Refunds cannot be claimed based on academic outcomes or institutional decisions.</p>
              </section>
              <section>
                <h2 className="text-lg font-bold text-white mb-3">5. Contact</h2>
                <p>For inquiries: <a href="mailto:support@mi-assignment.com" className="text-[#22D3EE] hover:underline">support@mi-assignment.com</a></p>
              </section>
            </>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-wrap gap-4 text-xs text-gray-600">
          <Link to="/terms" className="hover:text-[#22D3EE] transition-colors">{isAr ? 'الشروط والأحكام' : 'Terms of Service'}</Link>
          <Link to="/privacy" className="hover:text-[#22D3EE] transition-colors">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link>
          <Link to="/contact" className="hover:text-[#22D3EE] transition-colors">{isAr ? 'تواصل معنا' : 'Contact Us'}</Link>
        </div>
      </div>
    </div>
  );
}
