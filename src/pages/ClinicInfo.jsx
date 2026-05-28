import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  MapPin, Phone, Mail, Clock, Stethoscope, ArrowLeft, Home,
  Calendar, Award, Heart, MessageCircle, CheckCircle, Activity
} from 'lucide-react'
import Logo from '../components/Logo'
import PulseIcon from '../components/PulseIcon'
import { formatTime } from '../utils/formatters'

export default function ClinicInfo() {
  const { clinicSlug } = useParams()
  const [clinic, setClinic] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [clinicSlug])

  const load = async () => {
    const { data: c } = await supabase.from('clinics').select('*')
      .eq('slug', clinicSlug).eq('is_active', true).maybeSingle()
    if (!c) { setLoading(false); return }
    setClinic(c)
    const [d, s] = await Promise.all([
      supabase.from('doctors').select('*').eq('clinic_id', c.id).eq('is_active', true),
      supabase.from('clinic_services').select('*').eq('clinic_id', c.id).eq('is_active', true)
    ])
    setDoctors(d.data || [])
    setServices(s.data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pattern-subtle">
        <div className="spinner-lg"></div>
      </div>
    )
  }

  if (!clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pattern-subtle p-4">
        <div className="bg-white border border-slate-100 rounded-3xl p-12 max-w-md w-full text-center shadow-large">
          <div className="text-7xl mb-4">😔</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">العيادة غير موجودة</h2>
          <Link to="/" className="btn-primary inline-flex items-center gap-2 mt-4">
            <Home className="w-5 h-5" /> الرئيسية
          </Link>
        </div>
      </div>
    )
  }

  const primary = clinic.primary_color || '#0EA5E9'
  const workingDaysNames = {
    sat: 'السبت', sun: 'الأحد', mon: 'الإثنين',
    tue: 'الثلاثاء', wed: 'الأربعاء', thu: 'الخميس', fri: 'الجمعة'
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700">
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <Link to="/" className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 transition">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">العودة للرئيسية</span>
          </Link>

          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-right">
            {clinic.logo_url ? (
              <img src={clinic.logo_url} alt={clinic.name} className="w-28 h-28 bg-white rounded-3xl shadow-large object-cover" />
            ) : (
              <div className="w-28 h-28 bg-white rounded-3xl shadow-large flex items-center justify-center icon-pulse">
                <Stethoscope className="w-14 h-14 text-primary-600" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3">{clinic.name}</h1>
              {clinic.address && (
                <p className="text-white/90 text-lg flex items-center gap-2 justify-center md:justify-start">
                  <MapPin className="w-5 h-5" /> {clinic.address}
                </p>
              )}
            </div>
            <Link to={`/${clinic.slug}`} className="bg-white text-primary-700 px-6 py-3 rounded-xl font-bold shadow-large hover:shadow-medium transition flex items-center gap-2">
              <Calendar className="w-5 h-5" /> احجز موعد
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        {clinic.about && (
          <section className="bg-white rounded-3xl p-8 shadow-soft border border-slate-100">
            <h2 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary-600 icon-pulse" /> عن العيادة
            </h2>
            <p className="text-slate-700 text-base leading-relaxed">{clinic.about}</p>
          </section>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* تواصل */}
          <section className="bg-white rounded-3xl p-8 shadow-soft border border-slate-100">
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <Phone className="w-6 h-6 text-primary-600" /> معلومات التواصل
            </h2>
            <div className="space-y-3">
              {clinic.phone && <ContactCard icon={Phone} label="الهاتف" value={clinic.phone} href={`tel:${clinic.phone}`} gradient="gradient-primary" />}
              {clinic.whatsapp && <ContactCard icon={MessageCircle} label="واتساب" value={clinic.whatsapp} href={`https://wa.me/${clinic.whatsapp.replace(/\D/g, '')}`} gradient="gradient-success" />}
              {clinic.email && <ContactCard icon={Mail} label="البريد" value={clinic.email} href={`mailto:${clinic.email}`} gradient="gradient-purple" />}
              {clinic.address && <ContactCard icon={MapPin} label="العنوان" value={clinic.address} gradient="gradient-warning" />}
            </div>
          </section>

          {/* ساعات العمل */}
          <section className="bg-white rounded-3xl p-8 shadow-soft border border-slate-100">
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary-600" /> ساعات العمل
            </h2>
            <div className="space-y-2">
              {['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'].map(day => {
                const isWorking = clinic.working_days?.includes(day)
                return (
                  <div key={day} className={`flex items-center justify-between p-3 rounded-xl border ${isWorking ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="font-bold text-slate-800">{workingDaysNames[day]}</span>
                    {isWorking ? (
                      <span className="text-emerald-700 font-bold text-sm flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(clinic.working_hours_start || '09:00')} - {formatTime(clinic.working_hours_end || '21:00')}
                      </span>
                    ) : (
                      <span className="text-red-600 font-bold text-sm">مغلق</span>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* الأطباء */}
        {doctors.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <Stethoscope className="w-7 h-7 text-primary-600" /> أطباؤنا
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map(d => (
                <div key={d.id} className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100 card-hover text-center">
                  {d.photo_url ? (
                    <img src={d.photo_url} alt={d.name} className="w-24 h-24 mx-auto rounded-2xl shadow-soft mb-3 object-cover" />
                  ) : (
                    <div className="w-24 h-24 mx-auto gradient-primary rounded-2xl flex items-center justify-center shadow-soft mb-3 icon-pulse">
                      <Stethoscope className="w-12 h-12 text-white" />
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-slate-800">{d.name}</h3>
                  {d.specialization && (
                    <p className="text-primary-600 font-medium text-sm mt-1 flex items-center justify-center gap-1">
                      <Award className="w-4 h-4" /> {d.specialization}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="text-white rounded-3xl p-8 sm:p-12 text-center shadow-large gradient-primary">
          <Heart className="w-12 h-12 mx-auto mb-3 icon-pulse" />
          <h2 className="text-2xl sm:text-3xl font-black mb-3">جاهز لزيارتنا؟</h2>
          <p className="text-white/90 mb-6">احجز موعدك الآن بكل سهولة</p>
          <Link to={`/${clinic.slug}`} className="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-xl font-bold shadow-large hover:shadow-medium transition">
            <Calendar className="w-5 h-5" /> احجز موعدك الآن
          </Link>
        </section>
      </div>
    </div>
  )
}

function ContactCard({ icon: Icon, label, value, href, gradient }) {
  const content = (
    <div className={`flex items-center gap-3 p-4 rounded-xl ${href ? 'hover:bg-slate-50 cursor-pointer' : ''} transition`}>
      <div className={`w-11 h-11 ${gradient} rounded-xl flex items-center justify-center text-white shadow-soft`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500">{label}</p>
        <p className="text-slate-800 font-bold text-sm">{value}</p>
      </div>
    </div>
  )
  return href ? <a href={href} target="_blank" rel="noopener noreferrer">{content}</a> : content
}
