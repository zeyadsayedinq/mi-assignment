import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';

export function ContactPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <div className="min-h-screen bg-[#020617] text-white" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Nav */}
        <div className="flex items-center gap-4 mb-12">
          <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-[#22D3EE] transition-colors text-sm">
            <Home className="w-4 h-4" />
            {isAr ? 'الرئيسية' : 'Home'}
          </Link>
          <span className="text-gray-800">/</span>
          <span className="text-gray-400 text-sm">{isAr ? 'تواصل معنا' : 'Contact Us'}</span>
        </div>

        <h1 className="text-3xl font-black mb-2">{isAr ? 'تواصل معنا' : 'Contact Us'}</h1>
        <p className="text-gray-500 text-sm mb-10">
          {isAr ? 'فريقنا موجود ٧ أيام في الأسبوع للرد عليك.' : 'Our team is available 7 days a week.'}
        </p>

        <div className="space-y-4 mb-12">
          {/* WhatsApp */}
          <a href="https://wa.me/201107743984"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5 hover:border-green-500/40 hover:bg-green-500/5 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-0.5">WhatsApp</p>
              <p className="text-green-400 font-mono text-sm">+20 110 774 3984</p>
              <p className="text-gray-600 text-xs mt-1">{isAr ? 'رد خلال ساعة في أوقات العمل' : 'Reply within 1 hour during working hours'}</p>
            </div>
          </a>

          {/* Email */}
          <a href="mailto:support@mi-assignment.com"
            className="flex items-center gap-4 bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5 hover:border-[#22D3EE]/40 hover:bg-[#22D3EE]/5 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-[#22D3EE]" />
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-0.5">{isAr ? 'البريد الإلكتروني' : 'Email'}</p>
              <p className="text-[#22D3EE] font-mono text-sm">support@mi-assignment.com</p>
              <p className="text-gray-600 text-xs mt-1">{isAr ? 'رد خلال ٢٤ ساعة' : 'Reply within 24 hours'}</p>
            </div>
          </a>

          {/* Location */}
          <div className="flex items-center gap-4 bg-[#0A0B0E] border border-gray-800 rounded-2xl p-5">
            <div className="w-12 h-12 rounded-xl bg-[#A855F7]/10 border border-[#A855F7]/20 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[#A855F7]" />
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-0.5">{isAr ? 'الموقع' : 'Location'}</p>
              <p className="text-gray-300 text-sm">{isAr ? 'المعادي، القاهرة، مصر' : 'Maadi, Cairo, Egypt'}</p>
              <p className="text-gray-600 text-xs mt-1">{isAr ? 'نخدم كل دول MENA' : 'Serving all MENA countries'}</p>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-[#0A0B0E] border border-gray-800 rounded-2xl p-6">
          <p className="text-white font-bold mb-4 text-sm">{isAr ? 'روابط سريعة' : 'Quick Links'}</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { to: '/pricing', label: isAr ? 'خطط الأسعار' : 'Pricing' },
              { to: '/refund', label: isAr ? 'سياسة الاسترداد' : 'Refund Policy' },
              { to: '/terms', label: isAr ? 'الشروط والأحكام' : 'Terms of Service' },
              { to: '/privacy', label: isAr ? 'سياسة الخصوصية' : 'Privacy Policy' },
            ].map(link => (
              <Link key={link.to} to={link.to}
                className="py-2.5 px-4 bg-[#050608] border border-gray-800 rounded-xl text-gray-400 hover:text-[#22D3EE] hover:border-[#22D3EE]/30 transition-all text-center">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
