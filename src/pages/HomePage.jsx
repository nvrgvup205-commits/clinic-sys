import { Link } from 'react-router-dom'
import {
  Shield, Zap, Users, Calendar, MessageSquare, BarChart3,
  Phone, Mail, CheckCircle, Stethoscope, Activity, Heart,
  Lock, Globe, Smartphone, Award, ArrowLeft, Building2,
  TrendingUp, FileText, DollarSign, Clock
} from 'lucide-react'
import Logo from '../components/Logo'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-pattern-subtle" dir="rtl">
      {/* زر المالك - في الزاوية بهدوء */}
      <Link
        to="/owner"
        className="fixed top-6 left-6 z-50 w-11 h-11 bg-white hover:bg-primary-50 rounded-full border border-slate-200 hover:border-primary-300 flex items-center justify-center transition-all shadow-soft hover:shadow-medium icon-pulse-ring"
        title="دخول المالك"
      >
        <Lock className="w-5 h-5 text-slate-600" />
      </Link>

      {/* Hero Section - وقور وبسيط */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* اللوجو الكبير */}
          <div className="inline-block mb-8 animate-fade-in">
            <Logo size="xl" showText={false} />
          </div>

          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-primary-50 border border-primary-100 rounded-full mb-6">
              <Activity className="w-4 h-4 text-primary-600 icon-pulse" />
              <span className="text-primary-700 font-bold text-sm">PREMIUM HEALTHCARE PLATFORM</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight">
              <span className="text-gradient-primary">حُلول</span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-slate-800 font-bold mb-3">
              نظام إدارة العيادات الطبية
            </p>
            <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              منصة شاملة لإدارة كافة أنواع العيادات الطبية بكفاءة واحترافية
              <br/>
              <span className="text-sm">يدعم جميع التخصصات • متكامل مع الأنظمة الحكومية • آمن وموثوق</span>
            </p>
          </div>

          {/* أزرار CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <a href="#features" className="btn-primary inline-flex items-center justify-center gap-2 group">
              <Award className="w-5 h-5" />
              <span>اكتشف المميزات</span>
            </a>
            <a href="#contact" className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold px-6 py-3 rounded-xl border border-slate-200 hover:border-slate-300 shadow-soft transition">
              <Phone className="w-5 h-5" />
              <span>تواصل معنا</span>
            </a>
          </div>

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-16 animate-fade-in" style={{animationDelay: '0.4s'}}>
            {[
              { num: '13+', label: 'تخصص طبي', icon: Stethoscope },
              { num: '24/7', label: 'دعم متواصل', icon: Activity },
              { num: '100%', label: 'آمن وموثوق', icon: Shield },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-soft stat-card">
                <s.icon className="w-7 h-7 mx-auto mb-2 text-primary-500 icon-pulse" />
                <p className="text-3xl font-black text-gradient-primary">{s.num}</p>
                <p className="text-slate-600 text-xs font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 border border-primary-100 rounded-full mb-4">
              <Award className="w-4 h-4 text-primary-600" />
              <span className="text-primary-700 font-bold text-xs">المميزات الأساسية</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-3">
              <span className="text-gradient-primary">حلول شاملة</span> لإدارة عيادتك
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">كل ما تحتاجه لإدارة عيادتك باحترافية في مكان واحد</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Users, title: 'إدارة المرضى', desc: 'سجل طبي إلكتروني شامل لكل مريض', color: 'gradient-primary' },
              { icon: Calendar, title: 'حجز المواعيد', desc: 'نظام حجز ذكي مع تأكيدات تلقائية', color: 'gradient-success' },
              { icon: Shield, title: 'إدارة التأمين', desc: 'دعم كامل لشركات التأمين السعودية', color: 'gradient-purple' },
              { icon: BarChart3, title: 'تقارير شاملة', desc: 'إحصائيات وتحليلات تفصيلية', color: 'gradient-warning' },
              { icon: DollarSign, title: 'إدارة مالية', desc: 'حسابات + مصروفات + فواتير', color: 'gradient-danger' },
              { icon: Smartphone, title: 'متاح في كل مكان', desc: 'يعمل على كل الأجهزة بسلاسة', color: 'gradient-primary' },
            ].map((f, i) => (
              <div key={i} className="group bg-white border border-slate-100 rounded-2xl p-6 shadow-soft card-hover">
                <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center mb-4 shadow-soft icon-pulse`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className="py-20 px-4 bg-white">
        <div className="max_w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-3">
              يدعم <span className="text-gradient-primary">جميع التخصصات</span>
            </h2>
            <p className="text-slate-600">منصة موحدة لكل أنواع العيادات الطبية</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
            {[
              'عيادات الأسنان',
              'الأطفال',
              'الأمراض الجلدية',
              'النساء والولادة',
              'العيون',
              'الباطنة',
              'العظام',
              'القلب',
              'العامة',
              'التجميل',
              'التحاليل',
              'الأشعة',
            ].map((spec, i) => (
              <div key={i} className="bg-slate-50 hover:bg-primary-50 border border-slate-100 hover:border-primary-200 rounded-xl p-4 text-center transition card-hover">
                <Stethoscope className="w-6 h-6 mx-auto mb-2 text-primary-500" />
                <p className="text-sm font-bold text-slate-700">{spec}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white border border-slate-100 rounded-3xl p-8 md:p-12 shadow-large">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-3">
                لماذا <span className="text-gradient-primary">حُلول؟</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                'منصة سحابية شاملة للعيادات الطبية',
                'يعمل على كافة الأجهزة بسلاسة',
                'دعم كامل للغة العربية',
                'إدارة شركات التأمين السعودية',
                'تقارير ورسوم بيانية متقدمة',
                'تكامل مع واتساب والبريد',
                'استيراد البيانات القديمة بسهولة',
                'تجربة مجانية لمدة 14 يوم',
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
                  <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-slate-700 font-medium text-sm">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-3">
              <span className="text-gradient-primary">جاهز للبدء؟</span>
            </h2>
            <p className="text-slate-600">تواصل معنا للحصول على عرضك الخاص</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: MessageSquare, label: 'واتساب', value: '+966 50 000 0000', href: 'https://wa.me/966500000000', gradient: 'gradient-success' },
              { icon: Phone, label: 'اتصال', value: '+966 50 000 0000', href: 'tel:+966500000000', gradient: 'gradient-primary' },
              { icon: Mail, label: 'البريد', value: 'info@hulool.app', href: 'mailto:info@hulool.app', gradient: 'gradient-purple' },
            ].map((c, i) => (
              <a key={i} href={c.href} target="_blank" rel="noopener noreferrer"
                className="group bg-white border border-slate-100 hover:border-primary-200 rounded-2xl p-6 text-center shadow-soft card-hover">
                <div className={`w-14 h-14 mx-auto ${c.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-medium icon-pulse`}>
                  <c.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-slate-800 font-bold text-lg mb-1">{c.label}</h3>
                <p className="text-slate-600 text-sm" dir="ltr">{c.value}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-4 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} حُلول - Solutions. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  )
}
