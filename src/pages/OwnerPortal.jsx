import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRealtime } from '../lib/useRealtime'
import LiveBadge from '../components/LiveBadge'
import ImageUpload from '../components/ImageUpload'
import {
  User, Lock, LogOut, Building2, Plus, Phone, Mail, MapPin,
  Calendar, Trash2, Edit, Crown, Sparkles, Eye, EyeOff,
  Users, Activity, TrendingUp, CheckCircle, Clock, Copy,
  ExternalLink, Settings, Home, Save, X, Stethoscope
} from 'lucide-react'

export default function OwnerPortal() {
  const [view, setView] = useState('login')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('owner_session')
    if (saved) {
      try { setUser(JSON.parse(saved)); setView('dashboard') } catch (e) {}
    }
  }, [])

  const handleLogout = () => { localStorage.removeItem('owner_session'); setUser(null); setView('login') }
  const handleSuccess = (u) => { localStorage.setItem('owner_session', JSON.stringify(u)); setUser(u); setView('dashboard') }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {view === 'login' && (
        <>
          <div className="fixed inset-0 bg-pattern-subtle -z-10"></div>
          <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
            <div className="floating-shape w-96 h-96 bg-sky-300 top-10 -right-20"></div>
            <div className="floating-shape w-80 h-80 bg-cyan-300 bottom-20 -left-20" style={{animationDelay: '2s'}}></div>
          </div>
          <OwnerLogin onSuccess={handleSuccess} />
        </>
      )}
      {view === 'dashboard' && <OwnerDashboard user={user} onLogout={handleLogout} />}
    </div>
  )
}

function OwnerLogin({ onSuccess }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { data } = await supabase.from('admin_users').select('*')
        .eq('username', credentials.username.trim()).eq('password', credentials.password)
        .eq('role', 'owner').eq('is_active', true).limit(1)
      if (data?.length > 0) onSuccess(data[0])
      else setError('بيانات الدخول غير صحيحة')
    } catch (err) { setError('صار خطأ، حاول مرة ثانية') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 page-enter" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-large icon-pulse-ring mb-5">
            <Crown className="w-12 h-12 text-white" />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 border border-primary-100 rounded-full mb-4">
            <ShieldCheck className="w-4 h-4 text-primary-600" />
            <span className="text-primary-700 font-bold text-xs">بوابة مالك النظام</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 mb-2">لوحة المالك</h1>
          <p className="text-slate-500">إدارة العيادات والاشتراكات من مكان واحد</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-large border border-slate-100 animate-slide-up">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">اسم المستخدم</label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500" />
                <input type="text" value={credentials.username} onChange={(e) => setCredentials({...credentials, username: e.target.value})} placeholder="1111" required
                  className="w-full pr-12 pl-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-800 placeholder-slate-400 text-right focus:border-primary-400 focus:bg-white outline-none transition font-medium" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500" />
                <input type={showPassword ? 'text' : 'password'} value={credentials.password} onChange={(e) => setCredentials({...credentials, password: e.target.value})} placeholder="1111" required
                  className="w-full pr-12 pl-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-800 placeholder-slate-400 text-right focus:border-primary-400 focus:bg-white outline-none transition font-medium" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <div className="bg-red-50 border-2 border-red-100 text-red-700 p-4 rounded-2xl text-sm font-bold animate-fade-in">❌ {error}</div>}

            <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-br from-primary-500 to-accent-500 text-white font-bold rounded-2xl disabled:opacity-50 shadow-medium hover:shadow-large transition text-lg flex items-center justify-center gap-2">
              <Crown className="w-5 h-5" /> {loading ? 'جاري الدخول...' : 'دخول المالك'}
            </button>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-slate-100">
            <Link to="/" className="text-slate-500 hover:text-primary-600 text-sm inline-flex items-center gap-1 font-bold">
              <Home className="w-4 h-4" /> الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function OwnerDashboard({ user, onLogout }) {
  const [clinics, setClinics] = useState([])
  const [clinicStats, setClinicStats] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [editingClinic, setEditingClinic] = useState(null)
  const [stats, setStats] = useState({ total: 0, active: 0, trial: 0, expired: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  // 🔴 Realtime
  useRealtime('clinics', () => load())

  const load = async () => {
    const { data } = await supabase.from('clinics').select('*').order('created_at', { ascending: false })
    setClinics(data || [])
    setStats({
      total: data?.length || 0,
      active: data?.filter(c => c.subscription_status === 'active').length || 0,
      trial: data?.filter(c => c.subscription_status === 'trial').length || 0,
      expired: data?.filter(c => c.subscription_status === 'expired').length || 0,
    })

    if (data?.length > 0) {
      const statsObj = {}
      await Promise.all(data.map(async (c) => {
        const [p, d, a, comp] = await Promise.all([
          supabase.from('patients').select('id', { count: 'exact', head: true }).eq('clinic_id', c.id),
          supabase.from('doctors').select('id', { count: 'exact', head: true }).eq('clinic_id', c.id),
          supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('clinic_id', c.id),
          supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('clinic_id', c.id).eq('status', 'open'),
        ])
        statsObj[c.id] = { patients: p.count || 0, doctors: d.count || 0, appointments: a.count || 0, openComplaints: comp.count || 0 }
      }))
      setClinicStats(statsObj)
    }
    setLoading(false)
  }

  const deleteClinic = async (id) => {
    if (!confirm('⚠️ حذف العيادة وكل بياناتها؟')) return
    await supabase.from('clinics').delete().eq('id', id)
  }

  const updateStatus = async (id, status) => {
    await supabase.from('clinics').update({ subscription_status: status }).eq('id', id)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-slate-50 page-enter" dir="rtl">
      <header className="bg-gradient-to-br from-primary-600 via-sky-600 to-accent-600 shadow-2xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white font-black text-xl flex items-center gap-2">
                  لوحة المالك <LiveBadge small />
                </h1>
                <p className="text-white/80 text-xs">{user.full_name || user.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition text-sm">
                <Home className="w-4 h-4" /> <span className="hidden sm:inline">الرئيسية</span>
              </Link>
              <button onClick={onLogout} className="bg-white/10 hover:bg-red-500/40 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition">
                <LogOut className="w-4 h-4" /> <span className="hidden sm:inline text-sm font-bold">خروج</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <OwnerStat icon={Building2} label="العيادات" value={stats.total} gradient="gradient-medical" />
          <OwnerStat icon={CheckCircle} label="نشطة" value={stats.active} gradient="gradient-success" />
          <OwnerStat icon={Clock} label="تجريبية" value={stats.trial} gradient="gradient-warning" />
          <OwnerStat icon={X} label="منتهية" value={stats.expired} gradient="gradient-danger" />
        </div>

        <div className="flex justify-end">
          <button onClick={() => { setShowForm(!showForm); setEditingClinic(null) }}
            className="gradient-medical text-white px-6 py-3 rounded-2xl font-bold shadow-xl btn-medical flex items-center gap-2">
            <Plus className="w-5 h-5" /> {showForm ? 'إلغاء' : 'عيادة جديدة'}
          </button>
        </div>

        {showForm && <ClinicForm clinic={editingClinic} onSuccess={() => { setShowForm(false); setEditingClinic(null) }} onCancel={() => { setShowForm(false); setEditingClinic(null) }} />}

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12"><div className="spinner-medical w-16 h-16 mx-auto"></div></div>
          ) : clinics.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-sky-100">
              <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-600 font-bold text-lg">لا توجد عيادات</p>
              <p className="text-slate-500 text-sm mt-1">ابدأ بإضافة أول عيادة</p>
            </div>
          ) : clinics.map(clinic => (
            <ClinicCard key={clinic.id} clinic={clinic} stats={clinicStats[clinic.id] || {}}
              onDelete={() => deleteClinic(clinic.id)}
              onEdit={() => { setEditingClinic(clinic); setShowForm(true); window.scrollTo({top: 0, behavior: 'smooth'}) }}
              onStatusChange={(s) => updateStatus(clinic.id, s)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function OwnerStat({ icon: Icon, label, value, gradient }) {
  return (
    <div className={`${gradient} text-white rounded-3xl p-6 shadow-xl card-medical`}>
      <Icon className="w-8 h-8 mb-2 opacity-80" />
      <p className="text-4xl font-black">{value}</p>
      <p className="text-white/80 text-sm font-medium mt-1">{label}</p>
    </div>
  )
}

function ClinicCard({ clinic, stats, onDelete, onEdit, onStatusChange }) {
  const [copied, setCopied] = useState(false)
  const clinicUrl = `${window.location.origin}/${clinic.slug}`
  const staffUrl = `${window.location.origin}/${clinic.slug}/staff`

  const copyLink = (link) => {
    navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-sky-100 card-medical">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div className="flex items-start gap-4 flex-1">
          {clinic.logo_url ? (
            <img src={clinic.logo_url} alt={clinic.name} className="w-16 h-16 rounded-2xl object-cover shadow-lg" />
          ) : (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{background: `linear-gradient(135deg, ${clinic.primary_color || '#0EA5E9'}, ${clinic.primary_color || '#0EA5E9'}dd)`}}>
              <Building2 className="w-8 h-8 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-2xl font-black text-slate-800">{clinic.name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                clinic.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                clinic.subscription_status === 'trial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
              }`}>
                {clinic.subscription_status === 'active' ? 'نشط' : clinic.subscription_status === 'trial' ? 'تجريبي' : 'منتهي'}
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-2">🔗 {clinic.slug}</p>

            <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-700">
              {clinic.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {clinic.phone}</div>}
              {clinic.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> {clinic.email}</div>}
              {clinic.address && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> {clinic.address}</div>}
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> {new Date(clinic.created_at).toLocaleDateString('ar-SA')}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-[160px]">
          <select value={clinic.subscription_status} onChange={(e) => onStatusChange(e.target.value)}
            className="px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-bold focus:border-sky-500 outline-none">
            <option value="trial">تجريبي</option>
            <option value="active">نشط</option>
            <option value="expired">منتهي</option>
          </select>
          <div className="flex gap-2">
            <button onClick={onEdit} className="flex-1 bg-sky-50 hover:bg-sky-100 text-sky-600 px-3 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-1">
              <Edit className="w-4 h-4" /> تعديل
            </button>
            <button onClick={onDelete} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-1">
              <Trash2 className="w-4 h-4" /> حذف
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 pt-5 border-t border-slate-100">
        <MiniStat icon={Users} label="مرضى" value={stats.patients || 0} color="text-sky-600" />
        <MiniStat icon={Stethoscope} label="أطباء" value={stats.doctors || 0} color="text-emerald-600" />
        <MiniStat icon={Calendar} label="مواعيد" value={stats.appointments || 0} color="text-cyan-600" />
        <MiniStat icon={Activity} label="شكاوى" value={stats.openComplaints || 0} color="text-amber-600" />
      </div>

      <div className="pt-5 border-t border-slate-100 space-y-2">
        <p className="text-xs font-bold text-slate-500 mb-2">🔗 الروابط:</p>
        <LinkRow label="👤 المريض" url={clinicUrl} onCopy={() => copyLink(clinicUrl)} copied={copied} />
        <LinkRow label="⚙️ الموظفين" url={staffUrl} onCopy={() => copyLink(staffUrl)} copied={copied} />
      </div>
    </div>
  )
}

function MiniStat({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-3 text-center">
      <Icon className={`w-6 h-6 mx-auto mb-1 ${color}`} />
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-slate-600 font-medium">{label}</p>
    </div>
  )
}

function LinkRow({ label, url, onCopy, copied }) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2 flex-wrap">
      <span className="text-sm font-bold text-slate-700 min-w-[100px]">{label}</span>
      <code className="flex-1 text-xs text-slate-600 bg-white px-2 py-1 rounded truncate min-w-[200px]">{url}</code>
      <button onClick={onCopy} className="bg-sky-100 hover:bg-sky-200 text-sky-700 p-2 rounded-lg" title="نسخ">
        {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
      </button>
      <a href={url} target="_blank" rel="noopener noreferrer" className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 p-2 rounded-lg" title="فتح">
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  )
}

function ClinicForm({ clinic, onSuccess, onCancel }) {
  const isEditing = !!clinic
  const [form, setForm] = useState({
    name: clinic?.name || '', slug: clinic?.slug || '',
    phone: clinic?.phone || '', whatsapp: clinic?.whatsapp || '',
    email: clinic?.email || '', address: clinic?.address || '',
    primary_color: clinic?.primary_color || '#0EA5E9',
    subscription_status: clinic?.subscription_status || 'trial',
    logo_url: clinic?.logo_url || '',
    about: clinic?.about || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generateSlug = (name) => {
    const transliterate = name.toLowerCase()
      .replace(/[\u0600-\u06FF]/g, c => {
        const map = {'ا':'a','ب':'b','ت':'t','ث':'th','ج':'g','ح':'h','خ':'kh','د':'d','ذ':'th','ر':'r','ز':'z','س':'s','ش':'sh','ص':'s','ض':'d','ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'q','ك':'k','ل':'l','م':'m','ن':'n','ه':'h','و':'w','ي':'y','ة':'h','ى':'a','ء':'','أ':'a','إ':'a','آ':'a','ؤ':'o','ئ':'e'}
        return map[c] || ''
      })
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 30)
    return transliterate + '-' + Math.random().toString(36).substring(2, 5)
  }

  const handleNameChange = (name) => {
    setForm(prev => ({ ...prev, name, slug: !isEditing && !prev.slug ? generateSlug(name) : prev.slug }))
  }

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (isEditing) {
        const { error: err } = await supabase.from('clinics').update(form).eq('id', clinic.id)
        if (err) throw err
        onSuccess()
      } else {
        const { data: newClinic, error: err } = await supabase.from('clinics').insert([form]).select().single()
        if (err) throw err

        await supabase.from('admin_users').insert([{
          clinic_id: newClinic.id, username: '1111', password: '1111',
          full_name: 'مدير العيادة', role: 'clinic_admin'
        }])
        await supabase.from('doctors').insert([{
          clinic_id: newClinic.id, name: 'د. مثال', specialization: 'عام',
          username: '1111', password: '1111'
        }])

        onSuccess()
        alert(`✓ تم إنشاء العيادة!\n\n🔗 ${window.location.origin}/${newClinic.slug}\n\n🔐 الكل / 1111`)
      }
    } catch (err) { setError('❌ ' + (err.message || 'صار خطأ')) }
    finally { setLoading(false) }
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl animate-slide-up border-2 border-sky-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-sky-500" />
          {isEditing ? 'تعديل العيادة' : 'إضافة عيادة جديدة'}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <ImageUpload bucket="clinic-logos" currentUrl={form.logo_url} onUpload={(url) => setForm({...form, logo_url: url})} label="🏥 لوجو العيادة" shape="square" prefix="logo-" />

        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1">اسم العيادة *</label>
            <input required value={form.name} onChange={(e) => handleNameChange(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1">🔗 الرابط (slug) *</label>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-sm whitespace-nowrap">{window.location.origin}/</span>
              <input required value={form.slug} onChange={(e) => setForm({...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                placeholder="smile-clinic" className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none font-mono" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">📞 الهاتف</label>
            <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">📱 واتساب</label>
            <input value={form.whatsapp} onChange={(e) => setForm({...form, whatsapp: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">📧 البريد</label>
            <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">🎨 اللون</label>
            <div className="flex items-center gap-2 px-3 py-2 border-2 border-slate-200 rounded-xl">
              <input type="color" value={form.primary_color} onChange={(e) => setForm({...form, primary_color: e.target.value})} className="w-12 h-10 rounded cursor-pointer" />
              <input value={form.primary_color} onChange={(e) => setForm({...form, primary_color: e.target.value})} className="flex-1 outline-none font-mono text-sm" />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1">📍 العنوان</label>
            <input value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1">عن العيادة</label>
            <textarea value={form.about} onChange={(e) => setForm({...form, about: e.target.value})} rows="3" className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none resize-none" />
          </div>

          {isEditing && (
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">💎 الاشتراك</label>
              <select value={form.subscription_status} onChange={(e) => setForm({...form, subscription_status: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none">
                <option value="trial">تجريبي</option>
                <option value="active">نشط</option>
                <option value="expired">منتهي</option>
              </select>
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-2xl text-sm font-medium animate-fade-in">{error}</div>}

        <button type="submit" disabled={loading} className="w-full py-4 gradient-medical text-white rounded-xl font-bold shadow-xl btn-medical disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? '⏳' : isEditing ? <><Save className="w-5 h-5" /> حفظ</> : <><Sparkles className="w-5 h-5" /> إنشاء</>}
        </button>
      </form>
    </div>
  )
}
