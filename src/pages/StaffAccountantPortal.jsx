import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, uploadImage } from '../lib/supabase'
import { useRealtime } from '../lib/useRealtime'
import * as XLSX from 'xlsx'
import LiveBadge from '../components/LiveBadge'
import ImageUpload from '../components/ImageUpload'
import {
  User, Lock, LogOut, Users, Calendar, AlertCircle, Plus,
  Search, Edit, Trash2, CheckCircle, XCircle, Stethoscope,
  Settings, Phone, CreditCard, Activity, Clock, ShieldCheck,
  Eye, EyeOff, Sparkles, Home, FileText, Pill, DollarSign,
  TrendingUp, BarChart3, X, Save, Award, Bell, Image as ImageIcon,
  Heart, Receipt, Upload, Download, FileSpreadsheet
} from 'lucide-react'

function StaffPortalUnused() {
  const { clinicSlug } = useParams()
  const [clinic, setClinic] = useState(null)
  const [clinicLoading, setClinicLoading] = useState(true)
  const [view, setView] = useState('login')
  const [user, setUser] = useState(null)

  useEffect(() => { loadClinic() }, [clinicSlug])

  const loadClinic = async () => {
    setClinicLoading(true)
    const { data } = await supabase.from('clinics').select('*')
      .eq('slug', clinicSlug).eq('is_active', true).maybeSingle()

    if (data) {
      setClinic(data)
      const saved = localStorage.getItem(`staff_session_${data.id}`)
      if (saved) {
        try {
          const s = JSON.parse(saved)
          setUser(s.user); setView(s.view)
        } catch (e) {}
      }
    }
    setClinicLoading(false)
  }

  const handleLogout = () => {
    if (clinic) localStorage.removeItem(`staff_session_${clinic.id}`)
    setUser(null); setView('login')
  }

  const handleLoginSuccess = (user, viewType) => {
    if (clinic) localStorage.setItem(`staff_session_${clinic.id}`, JSON.stringify({ user, view: viewType }))
    setUser(user); setView(viewType)
  }

  if (clinicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-medical-dark">
        <div className="text-center text-white">
          <div className="spinner-medical w-16 h-16 mx-auto"></div>
          <p className="mt-4 font-medium">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-medical-dark p-4">
        <div className="glass-dark rounded-3xl p-12 max-w-md w-full text-center shadow-2xl">
          <div className="text-7xl mb-4">😕</div>
          <h2 className="text-2xl font-black text-white mb-2">العيادة غير موجودة</h2>
          <Link to="/" className="inline-flex items-center gap-2 gradient-medical text-white px-6 py-3 rounded-2xl font-bold shadow-xl btn-medical">
            <Home className="w-5 h-5" /> الرئيسية
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {view === 'login' && (
        <>
          <div className="fixed inset-0 gradient-medical-dark -z-10"></div>
          <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
            <div className="floating-shape w-96 h-96 bg-sky-500 top-10 -right-20"></div>
            <div className="floating-shape w-80 h-80 bg-cyan-500 bottom-20 -left-20" style={{animationDelay: '2s'}}></div>
          </div>
          <StaffLogin clinic={clinic} onSuccess={handleLoginSuccess} />
        </>
      )}
      {view === 'admin' && <AdminDashboard user={user} clinic={clinic} onLogout={handleLogout} setClinic={setClinic} />}
      {view === 'reception' && <ReceptionDashboard user={user} clinic={clinic} onLogout={handleLogout} />}
      {view === 'accountant' && <AccountantDashboard user={user} clinic={clinic} onLogout={handleLogout} />}
      {view === 'doctor' && <DoctorDashboard user={user} clinic={clinic} onLogout={handleLogout} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Login
// ═══════════════════════════════════════════════════════════
function StaffLogin({ clinic, onSuccess }) {
  const [userType, setUserType] = useState('admin')
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (userType === 'reception' && clinic.reception_enabled === false) { setError('خدمة الاستقبال غير مفعّلة لهذه العيادة'); setLoading(false); return }
      if (userType === 'accountant' && clinic.accounting_enabled === false) { setError('خدمة الحسابات غير مفعّلة لهذه العيادة'); setLoading(false); return }
      if (userType === 'doctor' && clinic.doctor_portal_enabled === false) { setError('صفحة الطبيب غير مفعّلة لهذه العيادة'); setLoading(false); return }
      if (userType === 'doctor') {
        const { data } = await supabase.from('doctors').select('*')
          .eq('clinic_id', clinic.id).eq('username', credentials.username.trim())
          .eq('password', credentials.password).eq('is_active', true).limit(1)
        if (data?.length > 0) onSuccess(data[0], 'doctor')
        else setError('❌ بيانات الدخول غير صحيحة')
      } else {
        const allowedRoles = {
          admin: ['clinic_admin', 'super_admin'],
          reception: ['receptionist'],
          accountant: ['accountant'],
        }[userType]

        const { data } = await supabase.from('admin_users').select('*')
          .eq('clinic_id', clinic.id).eq('username', credentials.username.trim())
          .eq('password', credentials.password).in('role', allowedRoles).eq('is_active', true).limit(1)

        if (data?.length > 0) onSuccess(data[0], userType)
        else setError('❌ بيانات الدخول غير صحيحة أو الدور غير مفعّل')
      }
    } catch (err) { setError('❌ صار خطأ') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 page-enter">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block mb-4 relative">
            <div className="absolute inset-0 bg-sky-500/30 rounded-full blur-2xl"></div>
            {clinic.logo_url ? (
              <img src={clinic.logo_url} alt={clinic.name} className="relative w-24 h-24 mx-auto bg-white rounded-3xl shadow-2xl object-cover" />
            ) : (
              <div className="relative w-24 h-24 mx-auto gradient-medical rounded-3xl shadow-2xl flex items-center justify-center">
                <ShieldCheck className="w-12 h-12 text-white" />
              </div>
            )}
          </div>
          <h1 className="text-3xl font-black text-white mb-1">{clinic.name}</h1>
          <p className="text-white/70 text-sm">بوابة الموظفين</p>
        </div>

        <div className="glass-dark rounded-3xl p-8 shadow-2xl animate-slide-up">
          <div className="grid grid-cols-2 gap-2 mb-6 bg-white/5 p-1.5 rounded-2xl">
            {[
              { id: 'admin', label: 'أدمن', icon: Settings, activeClass: 'gradient-medical', enabled: true },
              { id: 'reception', label: 'استقبال', icon: Users, activeClass: 'gradient-warning', enabled: clinic.reception_enabled !== false },
              { id: 'accountant', label: 'محاسب', icon: DollarSign, activeClass: 'gradient-purple', enabled: clinic.accounting_enabled !== false },
              { id: 'doctor', label: 'دكتور', icon: Stethoscope, activeClass: 'gradient-success', enabled: clinic.doctor_portal_enabled !== false },
            ].filter(t => t.enabled).map(t => (
              <button key={t.id} type="button" onClick={() => setUserType(t.id)}
                className={`py-3 rounded-xl font-bold transition ${userType === t.id ? `${t.activeClass} text-white shadow-lg` : 'text-white/70 hover:text-white'}`}>
                <t.icon className="w-4 h-4 inline mr-1" /> {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-white/90 mb-2">اسم المستخدم</label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input type="text" value={credentials.username} onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                  placeholder='1111' required
                  className="w-full pr-12 pl-4 py-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder-white/40 text-right focus:border-sky-400 outline-none transition font-medium" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-white/90 mb-2">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input type={showPassword ? 'text' : 'password'} value={credentials.password} onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  placeholder="••••••" required
                  className="w-full pr-12 pl-12 py-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder-white/40 text-right focus:border-sky-400 outline-none transition font-medium" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <div className="bg-red-500/20 border-2 border-red-500/40 text-red-200 p-4 rounded-2xl text-sm font-medium animate-fade-in">{error}</div>}

            <button type="submit" disabled={loading}
              className={`w-full py-4 text-white font-bold rounded-2xl btn-medical disabled:opacity-50 shadow-xl text-lg ${userType === 'doctor' ? 'gradient-success' : userType === 'reception' ? 'gradient-warning' : userType === 'accountant' ? 'gradient-purple' : 'gradient-medical'}`}>
              {loading ? '⏳ جاري الدخول...' : 'دخول'}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Admin Dashboard
// ═══════════════════════════════════════════════════════════
function AdminDashboard({ user, clinic, onLogout, setClinic }) {
  const [tab, setTab] = useState('dashboard')
  const [notification, setNotification] = useState(null)
  const [stats, setStats] = useState({ patients: 0, doctors: 0, todayAppts: 0, openComplaints: 0, totalRevenue: 0, monthRevenue: 0 })
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [appointments, setAppointments] = useState([])
  const [complaints, setComplaints] = useState([])
  const [services, setServices] = useState([])
  const [records, setRecords] = useState([])

  useEffect(() => { loadAll() }, [])

  // 🔴 Realtime على المواعيد
  useRealtime('appointments', (payload) => {
    if (payload.new?.clinic_id === clinic.id || payload.old?.clinic_id === clinic.id) {
      loadAll()
      if (payload.eventType === 'INSERT') {
        setNotification({ type: 'new', msg: '🆕 موعد جديد!' })
        setTimeout(() => setNotification(null), 5000)
      }
    }
  }, { column: 'clinic_id', value: clinic.id })

  // 🔴 Realtime على الشكاوى
  useRealtime('complaints', (payload) => {
    if (payload.new?.clinic_id === clinic.id) {
      loadAll()
      if (payload.eventType === 'INSERT') {
        setNotification({ type: 'complaint', msg: '⚠️ شكوى جديدة!' })
        setTimeout(() => setNotification(null), 5000)
      }
    }
  })

  const loadAll = async () => {
    const today = new Date().toISOString().split('T')[0]
    const startOfMonth = new Date(); startOfMonth.setDate(1)
    const monthStart = startOfMonth.toISOString().split('T')[0]

    const [p, d, a, c, s, r] = await Promise.all([
      supabase.from('patients').select('*').eq('clinic_id', clinic.id).order('created_at', { ascending: false }),
      supabase.from('doctors').select('*').eq('clinic_id', clinic.id).order('created_at', { ascending: false }),
      supabase.from('appointments').select('*, patients(*), doctors(*)').eq('clinic_id', clinic.id).order('appointment_date', { ascending: false }),
      supabase.from('complaints').select('*, patients(*)').eq('clinic_id', clinic.id).order('created_at', { ascending: false }),
      supabase.from('clinic_services').select('*').eq('clinic_id', clinic.id).order('name'),
      supabase.from('medical_records').select('*, patients(name), doctors(name)').eq('clinic_id', clinic.id).order('created_at', { ascending: false })
    ])

    setPatients(p.data || [])
    setDoctors(d.data || [])
    setAppointments(a.data || [])
    setComplaints(c.data || [])
    setServices(s.data || [])
    setRecords(r.data || [])

    const totalRev = (r.data || []).reduce((sum, x) => sum + (parseFloat(x.paid_amount) || 0), 0)
    const monthRev = (r.data || []).filter(x => x.created_at >= monthStart).reduce((sum, x) => sum + (parseFloat(x.paid_amount) || 0), 0)

    setStats({
      patients: p.data?.length || 0,
      doctors: d.data?.length || 0,
      todayAppts: a.data?.filter(x => x.appointment_date === today).length || 0,
      openComplaints: c.data?.filter(x => x.status === 'open').length || 0,
      totalRevenue: totalRev, monthRevenue: monthRev,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 page-enter" dir="rtl">
      <RealtimeToast notification={notification} />
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-2 gradient-medical text-white">
            <Bell className="w-5 h-5" /> {notification.msg}
          </div>
        </div>
      )}

      <header className="gradient-medical-dark shadow-2xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white font-black text-xl flex items-center gap-2">
                  {clinic?.name}
                  <LiveBadge small />
                </h1>
                <p className="text-white/80 text-xs">{user.full_name || user.username}</p>
              </div>
            </div>
            <button onClick={async () => { if (work?.active) await work.endShift(); onLogout() }} className="bg-white/20 hover:bg-red-500/40 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-bold">خروج</span>
            </button>
          </div>

          <div className="flex gap-2 mt-5 overflow-x-auto pb-1">
            {[
              { id: 'dashboard', label: 'الرئيسية', icon: BarChart3 },
              { id: 'reports', label: 'التقارير', icon: TrendingUp },
              { id: 'patients', label: 'المرضى', icon: Users },
              { id: 'doctors', label: 'الأطباء', icon: Stethoscope },
              { id: 'appointments', label: 'المواعيد', icon: Calendar },
              { id: 'schedules', label: 'جداول الأطباء', icon: Clock },
              { id: 'services', label: 'الخدمات', icon: DollarSign },
              { id: 'complaints', label: 'الشكاوى', icon: AlertCircle },
              { id: 'settings', label: 'إعدادات', icon: Settings },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition flex items-center gap-1.5 ${tab === t.id ? 'bg-white text-sky-600 shadow-lg' : 'text-white/80 hover:bg-white/10'}`}>
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {tab === 'dashboard' && <DashTab stats={stats} appointments={appointments} setTab={setTab} />}
        {tab === 'reports' && <ReportsTab appointments={appointments} records={records} patients={patients} doctors={doctors} />}
        {tab === 'patients' && <PatientsTab patients={patients} clinic={clinic} />}
        {tab === 'doctors' && <DoctorsTab doctors={doctors} clinic={clinic} />}
        {tab === 'appointments' && <AppointmentsManageTab appointments={appointments} />}
        {tab === 'schedules' && <SchedulesManageTab doctors={doctors} clinic={clinic} />}
        {tab === 'services' && <ServicesTab services={services} clinic={clinic} />}
        {tab === 'complaints' && <ComplaintsManageTab complaints={complaints} />}
        {tab === 'settings' && <ClinicSettingsTab clinic={clinic} setClinic={setClinic} />}
      </div>
    </div>
  )
}

function DashTab({ stats, appointments, setTab }) {
  const today = new Date().toISOString().split('T')[0]
  const todayAppts = appointments.filter(a => a.appointment_date === today)
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-slate-800 flex items-center gap-2">
        <BarChart3 className="w-8 h-8 text-sky-600" /> نظرة عامة
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <BigStat icon={Users} label="إجمالي المرضى" value={stats.patients} gradient="gradient-medical" onClick={() => setTab('patients')} />
        <BigStat icon={Stethoscope} label="الأطباء" value={stats.doctors} gradient="gradient-success" onClick={() => setTab('doctors')} />
        <BigStat icon={Calendar} label="مواعيد اليوم" value={stats.todayAppts} gradient="gradient-medical-dark" onClick={() => setTab('appointments')} />
        <BigStat icon={AlertCircle} label="شكاوى مفتوحة" value={stats.openComplaints} gradient="gradient-warning" onClick={() => setTab('complaints')} />
        <BigStat icon={DollarSign} label="إيراد الشهر" value={`${stats.monthRevenue.toFixed(0)}`} suffix="ر.س" gradient="gradient-success" onClick={() => setTab('reports')} />
        <BigStat icon={TrendingUp} label="الإجمالي" value={`${stats.totalRevenue.toFixed(0)}`} suffix="ر.س" gradient="gradient-medical" onClick={() => setTab('reports')} />
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl border border-sky-100">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-sky-600" /> مواعيد اليوم
        </h3>
        {todayAppts.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>لا توجد مواعيد اليوم</p>
          </div>
        ) : (
          <div className="space-y-3">{todayAppts.map(apt => <AdminApptCard key={apt.id} apt={apt} />)}</div>
        )}
      </div>
    </div>
  )
}

function BigStat({ icon: Icon, label, value, gradient, onClick, suffix }) {
  return (
    <button onClick={onClick} className={`${gradient} text-white rounded-3xl p-6 text-right shadow-xl card-medical`}>
      <Icon className="w-8 h-8 mb-2 opacity-80" />
      <p className="text-3xl font-black">{value}{suffix && <span className="text-sm mr-1 opacity-80"> {suffix}</span>}</p>
      <p className="text-white/80 text-sm font-medium mt-1">{label}</p>
    </button>
  )
}

function AdminApptCard({ apt }) {
  const colors = { pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-emerald-100 text-emerald-700', completed: 'bg-sky-100 text-sky-700', cancelled: 'bg-red-100 text-red-700' }
  return (
    <div className="border-2 border-slate-100 rounded-2xl p-4 hover:border-sky-200 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-slate-800">{apt.patients?.name}</p>
          <p className="text-sm text-slate-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {apt.patients?.phone}</p>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1"><Stethoscope className="w-3 h-3" /> {apt.doctors?.name}</p>
        </div>
        <div className="text-left">
          <p className="font-bold text-sky-600 flex items-center gap-1"><Clock className="w-4 h-4" /> {apt.appointment_time}</p>
          <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${colors[apt.status]}`}>
            {apt.status === 'pending' ? 'قيد التأكيد' : apt.status === 'confirmed' ? 'مؤكد' : apt.status === 'completed' ? 'مكتمل' : 'ملغي'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ───── Reports ─────
function ReportsTab({ appointments, records, patients, doctors }) {
  const apptByType = {
    first_visit: appointments.filter(a => a.type === 'first_visit').length,
    follow_up: appointments.filter(a => a.type === 'follow_up').length,
    emergency: appointments.filter(a => a.type === 'emergency').length,
    consultation: appointments.filter(a => a.type === 'consultation').length,
  }
  const totalAppt = appointments.length || 1

  const apptByStatus = {
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  }

  const monthlyRevenue = {}
  records.forEach(r => {
    const month = r.created_at?.substring(0, 7)
    if (month) monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (parseFloat(r.paid_amount) || 0)
  })
  const sortedMonths = Object.keys(monthlyRevenue).sort().slice(-6)
  const maxRevenue = Math.max(...Object.values(monthlyRevenue), 1)

  const doctorStats = doctors.map(d => ({
    name: d.name,
    appointments: appointments.filter(a => a.doctor_id === d.id).length,
    revenue: records.filter(r => r.doctor_id === d.id).reduce((sum, r) => sum + (parseFloat(r.paid_amount) || 0), 0)
  })).sort((a, b) => b.appointments - a.appointments)

  const exportCSV = () => {
    const rows = [['الاسم', 'الجوال', 'تاريخ التسجيل']]
    patients.forEach(p => rows.push([p.name, p.phone, new Date(p.created_at).toLocaleDateString('ar-SA')]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `patients-${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-emerald-600" /> التقارير
        </h2>
        <button onClick={exportCSV} className="gradient-success text-white px-5 py-3 rounded-2xl font-bold shadow-xl btn-medical flex items-center gap-2">
          📥 تصدير CSV
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl border border-sky-100">
        <h3 className="text-xl font-bold text-slate-800 mb-4">المواعيد حسب النوع</h3>
        <div className="space-y-3">
          {[
            { key: 'first_visit', label: 'كشف أول', gradient: 'gradient-medical' },
            { key: 'follow_up', label: 'متابعة', gradient: 'gradient-success' },
            { key: 'emergency', label: 'طوارئ', gradient: 'gradient-warning' },
            { key: 'consultation', label: 'استشارة', gradient: 'gradient-medical-dark' },
          ].map(t => (
            <div key={t.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-700">{t.label}</span>
                <span className="text-sm font-bold text-slate-600">{apptByType[t.key]}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${t.gradient} transition-all duration-700`} style={{width: `${(apptByType[t.key] / totalAppt) * 100}%`}}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-sky-100">
          <h3 className="text-xl font-bold text-slate-800 mb-4">حالات المواعيد</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatusCircle label="قيد التأكيد" value={apptByStatus.pending} gradient="gradient-warning" icon={Clock} />
            <StatusCircle label="مؤكد" value={apptByStatus.confirmed} gradient="gradient-success" icon={CheckCircle} />
            <StatusCircle label="مكتمل" value={apptByStatus.completed} gradient="gradient-medical" icon={CheckCircle} />
            <StatusCircle label="ملغي" value={apptByStatus.cancelled} gradient="gradient-danger" icon={XCircle} />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl border border-sky-100">
          <h3 className="text-xl font-bold text-slate-800 mb-4">إيرادات آخر 6 شهور</h3>
          {sortedMonths.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <DollarSign className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p>لا توجد إيرادات بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedMonths.map(month => (
                <div key={month}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-bold text-slate-700">{month}</span>
                    <span className="text-sm font-bold text-emerald-600">{monthlyRevenue[month].toFixed(0)} ر.س</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full gradient-success transition-all duration-700" style={{width: `${(monthlyRevenue[month] / maxRevenue) * 100}%`}}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl border border-sky-100">
        <h3 className="text-xl font-bold text-slate-800 mb-4">أداء الأطباء</h3>
        {doctorStats.length === 0 ? (
          <div className="text-center py-8 text-slate-500"><Stethoscope className="w-12 h-12 mx-auto mb-2 text-slate-300" /><p>لا يوجد أطباء</p></div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {doctorStats.map((d, i) => (
              <div key={i} className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl p-4 border-2 border-sky-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 gradient-medical rounded-xl flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-bold text-slate-800">{d.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-sky-600">{d.appointments}</p>
                    <p className="text-xs text-slate-600">مواعيد</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-emerald-600">{d.revenue.toFixed(0)}</p>
                    <p className="text-xs text-slate-600">إيراد</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusCircle({ label, value, gradient, icon: Icon }) {
  return (
    <div className={`${gradient} rounded-2xl p-4 text-white text-center`}>
      <Icon className="w-8 h-8 mx-auto mb-1" />
      <p className="text-3xl font-black">{value}</p>
      <p className="text-xs font-medium opacity-90">{label}</p>
    </div>
  )
}

// ───── Patients ─────
function PatientsTab({ patients, clinic }) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', national_id: '', gender: 'male', password: '123456' })

  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search) || p.national_id?.includes(search)
  )

  const startEdit = (p) => {
    setEditing(p)
    setForm({ name: p.name, phone: p.phone, national_id: p.national_id || '', gender: p.gender || 'male', password: p.password })
    setShowForm(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (editing) {
      const { error } = await supabase.from('patients').update(form).eq('id', editing.id)
      if (error) return alert('❌ ' + error.message)
    } else {
      const { error } = await supabase.from('patients').insert([{ ...form, clinic_id: clinic.id }])
      if (error) return alert('❌ ' + error.message)
    }
    setForm({ name: '', phone: '', national_id: '', gender: 'male', password: '123456' })
    setShowForm(false); setEditing(null)
  }

  const del = async (id) => {
    if (!confirm('حذف المريض؟')) return
    await supabase.from('patients').delete().eq('id', id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-2"><Users className="w-8 h-8 text-sky-600" /> المرضى</h2>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', phone: '', national_id: '', gender: 'male', password: '123456' }) }}
          className="gradient-medical text-white px-5 py-3 rounded-2xl font-bold shadow-xl btn-medical flex items-center gap-2">
          <Plus className="w-5 h-5" /> {showForm ? 'إلغاء' : 'مريض جديد'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl p-6 shadow-xl animate-slide-up border border-sky-100">
          <h3 className="text-xl font-bold mb-4 text-slate-800">{editing ? '✏️ تعديل' : '➕ مريض جديد'}</h3>
          <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
            <input required placeholder="الاسم *" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
            <input required placeholder="رقم الجوال *" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
            <input placeholder="رقم الهوية" value={form.national_id} onChange={(e) => setForm({...form, national_id: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
            <select value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none">
              <option value="male">ذكر</option><option value="female">أنثى</option>
            </select>
            <input placeholder="كلمة المرور" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none md:col-span-2" />
            <button type="submit" className="md:col-span-2 py-3 gradient-success text-white rounded-xl font-bold shadow-lg">
              {editing ? '💾 حفظ' : '✅ إضافة'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 shadow-xl border border-sky-100">
        <div className="relative mb-4">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input placeholder="🔍 بحث..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-12 pl-4 py-3 border-2 border-slate-200 rounded-2xl input-medical outline-none" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500"><Users className="w-12 h-12 mx-auto mb-2 text-slate-300" /><p>{patients.length === 0 ? 'لا يوجد مرضى' : 'لا توجد نتائج'}</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => (
              <div key={p.id} className="border-2 border-slate-100 rounded-2xl p-4 hover:border-sky-200 hover:shadow-md transition">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 gradient-medical rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {p.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{p.name}</p>
                      <p className="text-sm text-slate-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {p.phone}</p>
                      {p.national_id && <p className="text-xs text-slate-500 flex items-center gap-1"><CreditCard className="w-3 h-3" /> {p.national_id}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(p)} className="text-sky-600 hover:bg-sky-50 p-2 rounded-lg"><Edit className="w-5 h-5" /></button>
                    <button onClick={() => del(p.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ───── Doctors (with photo upload) ─────
function DoctorsTab({ doctors, clinic }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', specialization: '', phone: '', username: '', password: '123456', photo_url: '' })

  const startEdit = (d) => {
    setEditing(d)
    setForm({ name: d.name, specialization: d.specialization || '', phone: d.phone || '', username: d.username, password: d.password, photo_url: d.photo_url || '' })
    setShowForm(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (editing) {
      const { error } = await supabase.from('doctors').update(form).eq('id', editing.id)
      if (error) return alert('❌ ' + error.message)
    } else {
      const { error } = await supabase.from('doctors').insert([{ ...form, clinic_id: clinic.id }])
      if (error) return alert('❌ ' + error.message)
    }
    setForm({ name: '', specialization: '', phone: '', username: '', password: '123456', photo_url: '' })
    setShowForm(false); setEditing(null)
  }

  const del = async (id) => {
    if (!confirm('حذف الطبيب؟')) return
    await supabase.from('doctors').delete().eq('id', id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-2"><Stethoscope className="w-8 h-8 text-emerald-600" /> الأطباء</h2>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', specialization: '', phone: '', username: '', password: '123456', photo_url: '' }) }}
          className="gradient-success text-white px-5 py-3 rounded-2xl font-bold shadow-xl btn-medical flex items-center gap-2">
          <Plus className="w-5 h-5" /> {showForm ? 'إلغاء' : 'طبيب جديد'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl p-6 shadow-xl animate-slide-up border border-emerald-100">
          <h3 className="text-xl font-bold mb-4 text-slate-800">{editing ? '✏️ تعديل' : '➕ طبيب جديد'}</h3>
          <form onSubmit={submit} className="space-y-4">
            <ImageUpload
              bucket="doctor-photos"
              currentUrl={form.photo_url}
              onUpload={(url) => setForm({...form, photo_url: url})}
              label="صورة الطبيب"
              shape="circle"
              prefix={`doctor-${clinic.id}-`}
            />
            <div className="grid md:grid-cols-2 gap-4">
              <input required placeholder="اسم الطبيب *" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
              <input placeholder="التخصص" value={form.specialization} onChange={(e) => setForm({...form, specialization: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
              <input placeholder="رقم الجوال" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
              <input required placeholder="اسم المستخدم *" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
              <input placeholder="كلمة المرور" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none md:col-span-2" />
            </div>
            <button type="submit" className="w-full py-3 gradient-success text-white rounded-xl font-bold shadow-lg">
              {editing ? '💾 حفظ' : '✅ إضافة الطبيب'}
            </button>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {doctors.length === 0 ? (
          <div className="md:col-span-2 bg-white rounded-3xl p-12 text-center text-slate-500 shadow-xl">
            <Stethoscope className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>لا يوجد أطباء</p>
          </div>
        ) : doctors.map(d => (
          <div key={d.id} className="bg-white rounded-2xl p-5 shadow-lg card-medical border border-emerald-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {d.photo_url ? (
                  <img src={d.photo_url} alt={d.name} className="w-14 h-14 rounded-2xl object-cover shadow-md" />
                ) : (
                  <div className="w-14 h-14 gradient-success rounded-2xl flex items-center justify-center">
                    <Stethoscope className="w-7 h-7 text-white" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-slate-800 text-lg">{d.name}</p>
                  <p className="text-sm text-slate-600">{d.specialization}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Phone className="w-3 h-3" /> {d.phone}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><User className="w-3 h-3" /> {d.username}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => startEdit(d)} className="text-sky-600 hover:bg-sky-50 p-2 rounded-lg"><Edit className="w-5 h-5" /></button>
                <button onClick={() => del(d.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ───── Schedules ─────
function SchedulesManageTab({ doctors, clinic }) {
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-slate-800 flex items-center gap-2"><Clock className="w-8 h-8 text-sky-600" /> جداول الأطباء</h2>

      <div className="bg-white rounded-3xl p-6 shadow-xl border border-sky-100">
        <h3 className="font-bold text-slate-800 mb-3">اختر طبيب:</h3>
        {doctors.length === 0 ? (
          <p className="text-slate-500 text-center py-6">⚠️ لا يوجد أطباء.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {doctors.map(d => (
              <button key={d.id} onClick={() => setSelectedDoctor(d)}
                className={`p-4 rounded-2xl text-right transition ${selectedDoctor?.id === d.id ? 'gradient-medical text-white shadow-xl scale-105' : 'bg-slate-50 hover:bg-sky-50 border-2 border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  {d.photo_url ? <img src={d.photo_url} className="w-12 h-12 rounded-xl object-cover" /> : <Stethoscope className="w-8 h-8" />}
                  <div>
                    <p className="font-bold">{d.name}</p>
                    <p className={`text-xs ${selectedDoctor?.id === d.id ? 'text-white/80' : 'text-slate-500'}`}>{d.specialization}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedDoctor && <ScheduleEditor doctor={selectedDoctor} clinic={clinic} />}
    </div>
  )
}

function ScheduleEditor({ doctor, clinic }) {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [timePerSlot, setTimePerSlot] = useState(doctor.time_per_slot || 30)

  const dayNames = [
    { num: 6, name: 'السبت' }, { num: 0, name: 'الأحد' },
    { num: 1, name: 'الإثنين' }, { num: 2, name: 'الثلاثاء' },
    { num: 3, name: 'الأربعاء' }, { num: 4, name: 'الخميس' }, { num: 5, name: 'الجمعة' },
  ]

  useEffect(() => { load() }, [doctor.id])

  const load = async () => {
    const { data } = await supabase.from('doctor_schedules').select('*').eq('doctor_id', doctor.id).order('day_of_week')
    setSchedules(data || [])
    setTimePerSlot(doctor.time_per_slot || 30)
  }

  const toggleDay = (dayNum) => {
    const existing = schedules.find(s => s.day_of_week === dayNum)
    if (existing) setSchedules(schedules.filter(s => s.day_of_week !== dayNum))
    else setSchedules([...schedules, { day_of_week: dayNum, start_time: '09:00', end_time: '21:00', is_available: true }])
  }

  const updateTime = (dayNum, field, value) => {
    setSchedules(schedules.map(s => s.day_of_week === dayNum ? {...s, [field]: value} : s))
  }

  const saveAll = async () => {
    if (schedules.length === 0) return alert('⚠️ اختر يوم واحد على الأقل')
    setLoading(true)
    await supabase.from('doctor_schedules').delete().eq('doctor_id', doctor.id)
    const toInsert = schedules.map(s => ({
      clinic_id: clinic.id, doctor_id: doctor.id,
      day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time, is_available: true
    }))
    const { data: inserted, error } = await supabase.from('doctor_schedules').insert(toInsert).select()
    if (error) { setLoading(false); return alert('❌ ' + error.message) }
    await supabase.from('doctors').update({ time_per_slot: parseInt(timePerSlot) }).eq('id', doctor.id)
    setSchedules(inserted || [])
    setLoading(false)
    setSavedMsg(`✓ تم حفظ ${inserted?.length || 0} أيام عمل`)
    setTimeout(() => setSavedMsg(''), 4000)
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl animate-slide-up border border-sky-100">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Clock className="w-6 h-6 text-sky-600" /> جدول {doctor.name}</h3>
        {savedMsg && <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl font-bold animate-fade-in">{savedMsg}</div>}
      </div>

      <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-4 mb-6">
        <label className="block text-sm font-bold text-sky-900 mb-2 flex items-center gap-1"><Clock className="w-4 h-4" /> مدة الموعد:</label>
        <div className="grid grid-cols-5 gap-2">
          {[15, 20, 30, 45, 60].map(m => (
            <button key={m} onClick={() => setTimePerSlot(m)}
              className={`py-3 rounded-xl font-bold transition ${timePerSlot === m ? 'gradient-medical text-white shadow-lg scale-105' : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-sky-400'}`}>
              {m} د
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <p className="font-bold text-slate-700 mb-2">أيام العمل:</p>
        {dayNames.map(day => {
          const schedule = schedules.find(s => s.day_of_week === day.num)
          const isWorking = !!schedule
          return (
            <div key={day.num} className={`border-2 rounded-2xl p-4 transition ${isWorking ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleDay(day.num)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${isWorking ? 'gradient-success text-white shadow-lg' : 'bg-white border-2 border-slate-300 text-slate-400'}`}>
                    {isWorking ? <CheckCircle className="w-6 h-6" /> : <X className="w-6 h-6" />}
                  </button>
                  <div>
                    <p className="font-bold text-slate-800">{day.name}</p>
                    <p className={`text-xs ${isWorking ? 'text-emerald-700' : 'text-slate-500'}`}>{isWorking ? 'يوم عمل' : 'إجازة'}</p>
                  </div>
                </div>
                {isWorking && (
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <label className="text-xs text-slate-600 mb-1">من</label>
                      <input type="time" value={schedule.start_time?.substring(0,5)} onChange={(e) => updateTime(day.num, 'start_time', e.target.value)}
                        className="px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-bold" />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs text-slate-600 mb-1">إلى</label>
                      <input type="time" value={schedule.end_time?.substring(0,5)} onChange={(e) => updateTime(day.num, 'end_time', e.target.value)}
                        className="px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-bold" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <button onClick={saveAll} disabled={loading} className="w-full py-4 gradient-success text-white font-black rounded-2xl btn-medical disabled:opacity-50 shadow-2xl text-lg">
        {loading ? '⏳ جاري الحفظ...' : '💾 حفظ الجدول'}
      </button>
    </div>
  )
}

// ───── Services ─────
function ServicesTab({ services, clinic }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', price: 0, duration_minutes: 30 })

  const startEdit = (s) => {
    setEditing(s)
    setForm({ name: s.name, description: s.description || '', price: s.price, duration_minutes: s.duration_minutes })
    setShowForm(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (editing) {
      const { error } = await supabase.from('clinic_services').update(form).eq('id', editing.id)
      if (error) return alert('❌ ' + error.message)
    } else {
      const { error } = await supabase.from('clinic_services').insert([{ ...form, clinic_id: clinic.id }])
      if (error) return alert('❌ ' + error.message)
    }
    setForm({ name: '', description: '', price: 0, duration_minutes: 30 })
    setShowForm(false); setEditing(null)
    window.location.reload()
  }

  const del = async (id) => {
    if (!confirm('حذف الخدمة؟')) return
    await supabase.from('clinic_services').delete().eq('id', id)
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-2"><DollarSign className="w-8 h-8 text-amber-600" /> الخدمات</h2>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', description: '', price: 0, duration_minutes: 30 }) }}
          className="gradient-warning text-white px-5 py-3 rounded-2xl font-bold shadow-xl btn-medical flex items-center gap-2">
          <Plus className="w-5 h-5" /> {showForm ? 'إلغاء' : 'خدمة جديدة'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl p-6 shadow-xl animate-slide-up border border-amber-100">
          <h3 className="text-xl font-bold mb-4 text-slate-800">{editing ? '✏️ تعديل' : '➕ خدمة جديدة'}</h3>
          <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
            <input required placeholder="اسم الخدمة *" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none md:col-span-2" />
            <input type="number" required placeholder="السعر *" value={form.price} onChange={(e) => setForm({...form, price: parseFloat(e.target.value) || 0})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
            <input type="number" required placeholder="المدة (دقيقة)" value={form.duration_minutes} onChange={(e) => setForm({...form, duration_minutes: parseInt(e.target.value) || 30})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
            <textarea placeholder="الوصف" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows="2" className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none md:col-span-2 resize-none" />
            <button type="submit" className="md:col-span-2 py-3 gradient-warning text-white rounded-xl font-bold shadow-lg">{editing ? '💾 حفظ' : '✅ إضافة'}</button>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {services.length === 0 ? (
          <div className="md:col-span-2 bg-white rounded-3xl p-12 text-center text-slate-500 shadow-xl">
            <DollarSign className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>لا توجد خدمات</p>
          </div>
        ) : services.map(s => (
          <div key={s.id} className="bg-white rounded-2xl p-5 shadow-lg card-medical border border-amber-100">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-lg">{s.name}</h3>
                {s.description && <p className="text-sm text-slate-600 mt-1">{s.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-2xl font-black text-amber-600">{s.price} ر.س</span>
                  <span className="text-slate-500 flex items-center gap-1"><Clock className="w-4 h-4" /> {s.duration_minutes}د</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(s)} className="text-sky-600 hover:bg-sky-50 p-2 rounded-lg"><Edit className="w-5 h-5" /></button>
                <button onClick={() => del(s.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ───── Appointments ─────
function AppointmentsManageTab({ appointments }) {
  const updateStatus = async (id, status) => {
    await supabase.from('appointments').update({ status }).eq('id', id)
  }
  const del = async (id) => {
    if (!confirm('حذف الموعد؟')) return
    await supabase.from('appointments').delete().eq('id', id)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-slate-800 flex items-center gap-2"><Calendar className="w-8 h-8 text-sky-600" /> المواعيد</h2>
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-sky-100">
        {appointments.length === 0 ? (
          <div className="text-center py-12 text-slate-500"><Calendar className="w-12 h-12 mx-auto mb-2 text-slate-300" /><p>لا توجد مواعيد</p></div>
        ) : (
          <div className="space-y-3">
            {appointments.map(apt => (
              <div key={apt.id} className="border-2 border-slate-100 rounded-2xl p-4 hover:border-sky-200 hover:shadow-md transition">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-bold text-slate-800 text-lg">{apt.patients?.name}</p>
                    <p className="text-sm text-slate-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {apt.patients?.phone}</p>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1"><Stethoscope className="w-3 h-3" /> {apt.doctors?.name}</p>
                    <p className="text-sm text-sky-600 font-bold mt-2 flex items-center gap-1"><Calendar className="w-3 h-3" /> {apt.appointment_date} <Clock className="w-3 h-3 mr-2" /> {apt.appointment_time}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <select value={apt.status} onChange={(e) => updateStatus(apt.id, e.target.value)}
                      className="px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-bold focus:border-sky-500 outline-none">
                      <option value="pending">قيد التأكيد</option>
                      <option value="confirmed">مؤكد</option>
                      <option value="completed">مكتمل</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                    <button onClick={() => del(apt.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg flex items-center gap-1 text-sm justify-center"><Trash2 className="w-4 h-4" /> حذف</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ───── Complaints ─────
function ComplaintsManageTab({ complaints }) {
  const [editingId, setEditingId] = useState(null)
  const [response, setResponse] = useState('')

  const respond = async (id, status) => {
    await supabase.from('complaints').update({ response, status, resolved_at: status === 'resolved' ? new Date().toISOString() : null }).eq('id', id)
    setEditingId(null); setResponse('')
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-slate-800 flex items-center gap-2"><AlertCircle className="w-8 h-8 text-amber-600" /> الشكاوى</h2>
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-amber-100">
        {complaints.length === 0 ? (
          <div className="text-center py-12 text-slate-500"><CheckCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" /><p>لا توجد شكاوى</p></div>
        ) : (
          <div className="space-y-3">
            {complaints.map(c => (
              <div key={c.id} className="border-2 border-slate-100 rounded-2xl p-5 hover:border-amber-200 transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-800">{c.subject}</p>
                    <p className="text-sm text-slate-500">{c.patients?.name} • {c.patients?.phone}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${c.status === 'open' ? 'bg-red-100 text-red-700' : c.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {c.status === 'open' ? 'مفتوحة' : c.status === 'in_progress' ? 'قيد المعالجة' : 'تم الحل'}
                  </span>
                </div>
                <p className="text-slate-700 mb-3">{c.description}</p>
                {c.response && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-3">
                    <p className="text-xs font-bold text-emerald-700 mb-1">الرد:</p>
                    <p className="text-sm text-emerald-800">{c.response}</p>
                  </div>
                )}
                {editingId === c.id ? (
                  <div className="space-y-2">
                    <textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="اكتب الرد..." rows="3"
                      className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-sky-500 outline-none" />
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => respond(c.id, 'in_progress')} className="gradient-warning text-white px-4 py-2 rounded-lg font-bold text-sm">قيد المعالجة</button>
                      <button onClick={() => respond(c.id, 'resolved')} className="gradient-success text-white px-4 py-2 rounded-lg font-bold text-sm">تم الحل</button>
                      <button onClick={() => setEditingId(null)} className="bg-slate-200 px-4 py-2 rounded-lg text-sm">إلغاء</button>
                    </div>
                  </div>
                ) : (
                  c.status !== 'resolved' && (
                    <button onClick={() => { setEditingId(c.id); setResponse(c.response || '') }} className="text-sky-600 hover:bg-sky-50 px-4 py-2 rounded-lg font-bold text-sm">
                      💬 الرد
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ───── Clinic Settings ─────
function ClinicSettingsTab({ clinic, setClinic }) {
  const [form, setForm] = useState({
    name: clinic.name || '',
    phone: clinic.phone || '',
    whatsapp: clinic.whatsapp || '',
    email: clinic.email || '',
    address: clinic.address || '',
    about: clinic.about || '',
    logo_url: clinic.logo_url || '',
    primary_color: clinic.primary_color || '#0EA5E9',
  })
  const [loading, setLoading] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const save = async (e) => {
    e.preventDefault(); setLoading(true)
    const { data, error } = await supabase.from('clinics').update(form).eq('id', clinic.id).select().single()
    setLoading(false)
    if (!error) {
      setClinic(data)
      setSavedMsg('✓ تم الحفظ')
      setTimeout(() => setSavedMsg(''), 3000)
    } else alert('❌ ' + error.message)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-slate-800 flex items-center gap-2"><Settings className="w-8 h-8 text-sky-600" /> إعدادات العيادة</h2>

      <div className="bg-white rounded-3xl p-6 shadow-xl border border-sky-100">
        <form onSubmit={save} className="space-y-5">
          <ImageUpload
            bucket="clinic-logos"
            currentUrl={form.logo_url}
            onUpload={(url) => setForm({...form, logo_url: url})}
            label="🏥 لوجو العيادة"
            shape="square"
            prefix={`logo-${clinic.id}-`}
          />

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">اسم العيادة</label>
              <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">رقم الهاتف</label>
              <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">واتساب</label>
              <input value={form.whatsapp} onChange={(e) => setForm({...form, whatsapp: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">العنوان</label>
            <input value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">عن العيادة</label>
            <textarea value={form.about} onChange={(e) => setForm({...form, about: e.target.value})} rows="4"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none resize-none" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">اللون الأساسي</label>
            <div className="flex items-center gap-2 px-3 py-2 border-2 border-slate-200 rounded-xl">
              <input type="color" value={form.primary_color} onChange={(e) => setForm({...form, primary_color: e.target.value})} className="w-12 h-10 rounded cursor-pointer" />
              <input value={form.primary_color} onChange={(e) => setForm({...form, primary_color: e.target.value})} className="flex-1 outline-none font-mono text-sm" />
            </div>
          </div>

          {savedMsg && <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-700 p-4 rounded-2xl font-bold animate-fade-in">{savedMsg}</div>}

          <button type="submit" disabled={loading} className="w-full py-4 gradient-medical text-white font-bold rounded-2xl btn-medical disabled:opacity-50 shadow-xl flex items-center justify-center gap-2">
            <Save className="w-5 h-5" /> {loading ? '⏳ جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Doctor Dashboard
// ═══════════════════════════════════════════════════════════
function DoctorDashboard({ user, clinic, onLogout }) {
  const [appointments, setAppointments] = useState([])
  const [services, setServices] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [examiningApt, setExaminingApt] = useState(null)
  const [doctorTab, setDoctorTab] = useState('patients')
  const [notification, setNotification] = useState(null)
  const work = useWorkSession({ clinic, userType: 'doctor', userId: user.id, userName: user.name, role: 'doctor' })

  useEffect(() => { if (work.active) load() }, [work.active])

  // 🔴 Realtime
  useRealtime('payment_requests', (payload) => {
    if (payload.new?.doctor_id === user.id || payload.old?.doctor_id === user.id) {
      load()
      if (payload.eventType === 'UPDATE' && payload.new?.status === 'paid') {
        setNotification('✅ تم دفع خدمة إضافية')
        setTimeout(() => setNotification(null), 5000)
      }
    }
  })

  useRealtime('appointments', (payload) => {
    if (payload.new?.doctor_id === user.id || payload.old?.doctor_id === user.id) {
      load()
      if (payload.eventType === 'INSERT') {
        setNotification('🆕 موعد جديد لك!')
        setTimeout(() => setNotification(null), 5000)
      }
    }
  })

  const load = async () => {
    const [a, s] = await Promise.all([
      supabase.from('appointments').select('*, patients(*), medical_records(*)').eq('doctor_id', user.id).or('paid_at.not.is.null,status.eq.completed').order('appointment_date', { ascending: false }).order('appointment_time'),
      supabase.from('clinic_services').select('*').eq('clinic_id', clinic.id).eq('is_active', true)
    ])
    setAppointments(a.data || [])
    setServices(s.data || [])
    setLoading(false)
  }

  const filtered = appointments.filter(apt => {
    const matchSearch = !search || apt.patients?.name?.toLowerCase().includes(search.toLowerCase()) ||
      apt.patients?.phone?.includes(search) || apt.patients?.national_id?.includes(search)
    const matchFilter = filter === 'all' || apt.type === filter
    return matchSearch && matchFilter
  })

  const firstVisits = appointments.filter(a => a.type === 'first_visit')
  const emergencies = appointments.filter(a => a.type === 'emergency')
  const followUps = appointments.filter(a => a.type === 'follow_up')

  if (!work.active) {
    return <DutyGate clinic={clinic} userName={user.name} roleLabel="الطبيب" icon={Stethoscope} work={work} onLogout={onLogout} />
  }

  if (examiningApt) {
    return <ExaminationView apt={examiningApt} clinic={clinic} services={services} doctor={user} onClose={() => { setExaminingApt(null); load() }} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50 page-enter" dir="rtl">
      <RealtimeToast notification={notification} />
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="px-6 py-3 rounded-2xl shadow-2xl font-bold gradient-success text-white flex items-center gap-2">
            <Bell className="w-5 h-5" /> {notification}
          </div>
        </div>
      )}

      <header className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 shadow-2xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user.photo_url ? (
                <img src={user.photo_url} alt={user.name} className="w-12 h-12 rounded-2xl object-cover border-2 border-white/40" />
              ) : (
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-white font-black text-xl flex items-center gap-2">
                  {user.name} <LiveBadge small />
                </h1>
                <p className="text-white/80 text-xs">{user.specialization} • {clinic?.name}</p>
              </div>
            </div>
            <button onClick={async () => { if (work.active) await work.endShift(); onLogout() }} className="bg-white/20 hover:bg-red-500/40 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-bold">خروج</span>
            </button>
          </div>

          <div className="flex gap-2 mt-5 overflow-x-auto pb-1">
            <button onClick={() => setDoctorTab('patients')}
              className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition flex items-center gap-1.5 ${doctorTab === 'patients' ? 'bg-white text-emerald-600 shadow-lg' : 'text-white/80 hover:bg-white/10'}`}>
              <Users className="w-4 h-4" /> المرضى
            </button>
            <button onClick={() => setDoctorTab('schedule')}
              className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition flex items-center gap-1.5 ${doctorTab === 'schedule' ? 'bg-white text-emerald-600 shadow-lg' : 'text-white/80 hover:bg-white/10'}`}>
              <Clock className="w-4 h-4" /> جدول عملي
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 pt-4">
        <WorkStatusBar work={work} />
      </div>

      {doctorTab === 'schedule' ? (
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <ScheduleEditor doctor={user} clinic={clinic} />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <BigStat icon={Plus} label="كشف أول" value={firstVisits.length} gradient="gradient-medical" onClick={() => setFilter('first_visit')} />
            <BigStat icon={AlertCircle} label="طوارئ" value={emergencies.length} gradient="gradient-warning" onClick={() => setFilter('emergency')} />
            <BigStat icon={Activity} label="متابعات" value={followUps.length} gradient="gradient-success" onClick={() => setFilter('follow_up')} />
            <BigStat icon={FileText} label="الكل" value={appointments.length} gradient="gradient-medical-dark" onClick={() => setFilter('all')} />
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-emerald-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input placeholder="🔍 بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-12 pl-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-emerald-500 outline-none" />
              </div>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-emerald-500 outline-none font-bold">
                <option value="all">الكل</option>
                <option value="first_visit">كشف أول</option>
                <option value="emergency">طوارئ</option>
                <option value="follow_up">متابعة</option>
                <option value="consultation">استشارة</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-emerald-100">
            <h3 className="text-xl font-bold text-slate-800 mb-4">قائمة المرضى ({filtered.length})</h3>
            {loading ? (
              <div className="text-center py-12"><div className="spinner-medical w-12 h-12 mx-auto"></div></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-500"><Users className="w-12 h-12 mx-auto mb-2 text-slate-300" /><p>لا يوجد مرضى</p></div>
            ) : (
              <div className="space-y-3">
                {filtered.map(apt => (
                  <div key={apt.id} className={`border-r-4 rounded-2xl p-4 ${
                    apt.type === 'first_visit' ? 'border-sky-500 bg-sky-50' :
                    apt.type === 'emergency' ? 'border-amber-500 bg-amber-50' :
                    apt.type === 'follow_up' ? 'border-emerald-500 bg-emerald-50' : 'border-indigo-500 bg-indigo-50'
                  }`}>
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow">
                          {apt.patients?.gender === 'female' ? <Heart className="w-6 h-6 text-pink-500" /> : <User className="w-6 h-6 text-sky-600" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-lg">{apt.patients?.name}</p>
                          <p className="text-sm text-slate-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {apt.patients?.phone}</p>
                          {apt.patients?.medical_notes && <p className="text-xs text-slate-600 mt-1 flex items-center gap-1"><FileText className="w-3 h-3" /> {apt.patients.medical_notes}</p>}
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-700 flex items-center gap-1"><Calendar className="w-4 h-4" /> {apt.appointment_date}</p>
                        <p className="text-slate-600 flex items-center gap-1"><Clock className="w-4 h-4" /> {apt.appointment_time}</p>
                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${
                          apt.type === 'first_visit' ? 'bg-sky-200 text-sky-800' :
                          apt.type === 'emergency' ? 'bg-amber-200 text-amber-800' :
                          apt.type === 'follow_up' ? 'bg-emerald-200 text-emerald-800' : 'bg-indigo-200 text-indigo-800'
                        }`}>
                          {apt.type === 'first_visit' ? 'كشف أول' : apt.type === 'emergency' ? 'طوارئ' : apt.type === 'follow_up' ? 'متابعة' : 'استشارة'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <button onClick={async () => { await supabase.from('appointments').update({ doctor_started_at: apt.doctor_started_at || new Date().toISOString() }).eq('id', apt.id); setExaminingApt(apt) }}
                        className="gradient-success text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg btn-medical flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" /> {apt.medical_records?.length > 0 ? 'تعديل الكشف' : 'بدء الكشف'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Examination View - مرفقات الكشف
// ═══════════════════════════════════════════════════════════
function ExaminationView({ apt, clinic, services, doctor, onClose }) {
  const existingRecord = apt.medical_records?.[0]
  const [form, setForm] = useState({
    diagnosis: existingRecord?.diagnosis || '',
    treatment: existingRecord?.treatment || '',
    prescription: existingRecord?.prescription || '',
    next_visit_notes: existingRecord?.next_visit_notes || '',
    private_notes: existingRecord?.private_notes || '',
    services_provided: existingRecord?.services_provided || [],
    discount: existingRecord?.discount || 0,
    paid_amount: existingRecord?.paid_amount || 0,
    payment_method: existingRecord?.payment_method || 'cash',
    xray_images: existingRecord?.xray_images || [],
  })
  const [loading, setLoading] = useState(false)
  const [uploadingXray, setUploadingXray] = useState(false)
  const [paymentRequests, setPaymentRequests] = useState([])
  const [historyRecords, setHistoryRecords] = useState([])

  useEffect(() => { loadDoctorExamData() }, [apt.id])

  useRealtime('payment_requests', (payload) => {
    if (payload.new?.appointment_id === apt.id || payload.old?.appointment_id === apt.id) loadDoctorExamData()
  }, { column: 'appointment_id', value: apt.id })

  const loadDoctorExamData = async () => {
    const [req, hist] = await Promise.all([
      supabase.from('payment_requests').select('*').eq('appointment_id', apt.id).order('requested_at', { ascending: false }),
      supabase.from('medical_records').select('*, doctors(name)').eq('patient_id', apt.patient_id).neq('appointment_id', apt.id).order('created_at', { ascending: false }).limit(5)
    ])
    setPaymentRequests(req.data || [])
    setHistoryRecords(hist.data || [])
  }

  const total = form.services_provided.reduce((sum, s) => sum + (s.price * s.qty), 0)
  const finalTotal = total - parseFloat(form.discount || 0)
  const paymentStatus = existingRecord?.payment_status || 'reception' // الدفع يتم من الاستقبال فقط

  const addService = (s) => {
    const existing = form.services_provided.find(x => x.id === s.id)
    if (existing) setForm({...form, services_provided: form.services_provided.map(x => x.id === s.id ? {...x, qty: x.qty + 1} : x)})
    else setForm({...form, services_provided: [...form.services_provided, {id: s.id, name: s.name, price: s.price, qty: 1}]})
  }

  const removeService = (id) => setForm({...form, services_provided: form.services_provided.filter(s => s.id !== id)})
  const updateQty = (id, qty) => { if (qty < 1) return removeService(id); setForm({...form, services_provided: form.services_provided.map(s => s.id === id ? {...s, qty} : s)}) }

  const requestExtraPayment = async (service) => {
    const existsPending = paymentRequests.find(r => r.service_id === service.id && r.status === 'pending')
    if (existsPending) return alert('هذه الخدمة مطلوبة من الاستقبال بالفعل')
    const amount = parseFloat(service.price) || 0
    const { error } = await supabase.from('payment_requests').insert([{
      clinic_id: clinic.id,
      appointment_id: apt.id,
      patient_id: apt.patient_id,
      doctor_id: doctor.id,
      service_id: service.id,
      service_name: service.name,
      amount,
      status: 'pending',
      requested_by: doctor.id,
      notes: 'طلب خدمة إضافية من الطبيب'
    }])
    if (error) return alert('❌ ' + error.message)
    alert('✓ تم إرسال طلب الدفع للاستقبال')
    loadDoctorExamData()
  }

  const handleXrayUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    setUploadingXray(true)

    const uploadedUrls = []
    for (const file of files) {
      const { url } = await uploadImage('xray-images', file, `xray-${apt.patient_id}-`)
      if (url) uploadedUrls.push(url)
    }
    setForm({...form, xray_images: [...form.xray_images, ...uploadedUrls]})
    setUploadingXray(false)
  }

  const removeXray = (url) => {
    setForm({...form, xray_images: form.xray_images.filter(u => u !== url)})
  }

  const save = async (complete = false) => {
    if (complete && paymentRequests.some(r => r.status === 'pending')) {
      alert('لا يمكن إنهاء الكشف قبل دفع كل طلبات الخدمات الإضافية عند الاستقبال')
      return
    }
    setLoading(true)
    const recordData = {
      clinic_id: clinic.id, appointment_id: apt.id, patient_id: apt.patient_id, doctor_id: doctor.id,
      diagnosis: form.diagnosis, treatment: form.treatment, prescription: form.prescription,
      next_visit_notes: form.next_visit_notes, private_notes: form.private_notes,
      services_provided: form.services_provided, total_amount: finalTotal,
      discount: parseFloat(form.discount) || 0, paid_amount: existingRecord?.paid_amount || 0,
      payment_status: paymentStatus, payment_method: 'reception',
      xray_images: form.xray_images,
    }

    if (existingRecord) await supabase.from('medical_records').update(recordData).eq('id', existingRecord.id)
    else await supabase.from('medical_records').insert([recordData])

    if (complete) await supabase.from('appointments').update({ status: 'completed', doctor_completed_at: new Date().toISOString() }).eq('id', apt.id)

    setLoading(false)
    onClose()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50 page-enter" dir="rtl">
      <RealtimeToast notification={notification} />
      <header className="gradient-success shadow-2xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-white font-black text-xl flex items-center gap-2"><Stethoscope className="w-6 h-6" /> شاشة الكشف</h1>
            <p className="text-white/80 text-sm">{apt.patients?.name} • {apt.appointment_date}</p>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        {/* بيانات المريض */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-emerald-100">
          <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><User className="w-5 h-5 text-emerald-600" /> بيانات المريض</h3>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500">الاسم:</span> <strong>{apt.patients?.name}</strong></div>
            <div><span className="text-slate-500">الجوال:</span> <strong>{apt.patients?.phone}</strong></div>
            <div><span className="text-slate-500">العمر:</span> <strong>{apt.patients?.date_of_birth ? new Date().getFullYear() - new Date(apt.patients.date_of_birth).getFullYear() : '-'}</strong></div>
            <div><span className="text-slate-500">فصيلة الدم:</span> <strong>{apt.patients?.blood_type || '-'}</strong></div>
            {apt.patients?.allergies && (
              <div className="sm:col-span-2 bg-red-50 border-2 border-red-200 rounded-xl p-3">
                <span className="text-red-700 font-bold">⚠️ حساسيات:</span> {apt.patients.allergies}
              </div>
            )}
            {apt.patients?.medical_notes && (
              <div className="sm:col-span-2 bg-amber-50 border-2 border-amber-200 rounded-xl p-3">
                <span className="text-amber-700 font-bold">📋 ملاحظات:</span> {apt.patients.medical_notes}
              </div>
            )}
          </div>
        </div>

        {/* تاريخ المريض الطبي */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-sky-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-sky-600" /> تاريخ المريض الطبي</h3>
          {historyRecords.length === 0 ? (
            <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-2xl">لا توجد كشوفات سابقة لهذا المريض</div>
          ) : (
            <div className="space-y-3">
              {historyRecords.map(r => (
                <div key={r.id} className="border border-sky-100 rounded-2xl p-4 bg-sky-50/40">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                    <p className="font-black text-slate-800">{r.created_at?.substring(0,10)} • {r.doctors?.name || 'طبيب'}</p>
                    <span className="text-xs bg-white text-sky-700 px-2 py-1 rounded-full font-bold">كشف سابق</span>
                  </div>
                  {r.diagnosis && <p className="text-sm text-slate-700"><strong>التشخيص:</strong> {r.diagnosis}</p>}
                  {r.treatment && <p className="text-sm text-slate-700"><strong>العلاج:</strong> {r.treatment}</p>}
                  {r.prescription && <p className="text-sm text-slate-700"><strong>الوصفة:</strong> {r.prescription}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* التشخيص */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-emerald-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-sky-600" /> التشخيص والعلاج</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">🔍 التشخيص</label>
              <textarea value={form.diagnosis} onChange={(e) => setForm({...form, diagnosis: e.target.value})} rows="3" placeholder="مثال: التهاب في اللثة..."
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">💉 العلاج المُقدّم</label>
              <textarea value={form.treatment} onChange={(e) => setForm({...form, treatment: e.target.value})} rows="3" placeholder="مثال: تنظيف اللثة..."
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1"><Pill className="w-4 h-4 text-pink-600" /> الوصفة الطبية</label>
              <textarea value={form.prescription} onChange={(e) => setForm({...form, prescription: e.target.value})} rows="3" placeholder="أوجمنتين 1g كل 12 ساعة..."
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">📅 الزيارة القادمة</label>
              <textarea value={form.next_visit_notes} onChange={(e) => setForm({...form, next_visit_notes: e.target.value})} rows="2" placeholder="متابعة بعد أسبوع..."
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">🔒 ملاحظات خاصة</label>
              <textarea value={form.private_notes} onChange={(e) => setForm({...form, private_notes: e.target.value})} rows="2" placeholder="للدكتور فقط"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none resize-none" />
            </div>
          </div>
        </div>

        {/* مرفقات الكشف */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-violet-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-violet-600" /> مرفقات الكشف</h3>

          <label className={`upload-zone block rounded-2xl p-6 text-center cursor-pointer ${uploadingXray ? 'opacity-50' : ''}`}>
            <input type="file" multiple accept="image/*" onChange={handleXrayUpload} disabled={uploadingXray} className="hidden" />
            <ImageIcon className="w-10 h-10 mx-auto text-violet-500 mb-2" />
            <p className="font-bold text-violet-700">{uploadingXray ? '⏳ جاري الرفع...' : '📸 رفع مرفقات الكشف'}</p>
            <p className="text-xs text-slate-500 mt-1">يمكنك اختيار مرفق أو تحليل أو تقرير أو أي صورة مرتبطة بالكشف</p>
          </label>

          {form.xray_images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
              {form.xray_images.map((url, i) => (
                <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-violet-200">
                  <img src={url} alt={`مرفق ${i+1}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeXray(url)} className="absolute top-1 right-1 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* الخدمات والتكلفة - بدون تحصيل من الدكتور */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-amber-100">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-600" /> الخدمات المقدمة
              </h3>
              <p className="text-xs text-slate-500 mt-1">الدكتور يحدد الخدمات فقط، والتحصيل يتم من الاستقبال</p>
            </div>
            <span className="bg-sky-50 text-sky-700 border border-sky-100 px-3 py-2 rounded-xl text-xs font-bold">
              الدفع عند الاستقبال
            </span>
          </div>

          {services.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-bold text-slate-700 mb-2">➕ إضافة خدمات:</p>
              <div className="flex flex-wrap gap-2">
                {services.map(s => (
                  <div key={s.id} className="flex items-center gap-1 bg-amber-50 border-2 border-amber-200 rounded-xl p-1">
                    <button onClick={() => addService(s)} className="px-3 py-2 text-sm font-bold text-slate-700">
                      {s.name} <span className="text-amber-700">({s.price} ر.س)</span>
                    </button>
                    <button onClick={() => requestExtraPayment(s)} className="gradient-warning text-white px-3 py-2 rounded-lg text-xs font-bold">طلب دفع</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {form.services_provided.length > 0 ? (
            <div className="space-y-2 mb-4">
              {form.services_provided.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 gap-2">
                  <span className="font-bold text-slate-800 flex-1">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(s.id, s.qty - 1)} className="w-7 h-7 bg-red-100 text-red-600 rounded-lg font-bold">−</button>
                    <span className="w-8 text-center font-bold">{s.qty}</span>
                    <button onClick={() => updateQty(s.id, s.qty + 1)} className="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-lg font-bold">+</button>
                    <span className="font-bold text-amber-700 min-w-[90px] text-left">{(s.price * s.qty).toFixed(0)} ر.س</span>
                    <button onClick={() => removeService(s.id)} className="text-red-500 p-1"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-6 text-slate-500 text-sm bg-slate-50 rounded-xl mb-4">لا توجد خدمات</div>}

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">إجمالي الخدمات</label>
              <div className="px-3 py-2 bg-slate-100 rounded-xl font-bold text-lg">{total.toFixed(0)} ر.س</div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">خصم طبي / إداري</label>
              <input type="number" value={form.discount} onChange={(e) => setForm({...form, discount: e.target.value})} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-amber-500 outline-none font-bold" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">الصافي المطلوب</label>
              <div className="px-3 py-2 bg-amber-50 text-amber-700 rounded-xl font-black text-lg">{finalTotal.toFixed(0)} ر.س</div>
            </div>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800 font-bold">
            ملاحظة: لا يتم تسجيل أي مدفوعات من شاشة الدكتور. الاستقبال هو المسؤول عن التحصيل وإصدار الفاتورة.
          </div>

          {paymentRequests.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <h4 className="font-black text-slate-800 mb-3">طلبات الدفع الإضافية</h4>
              <div className="space-y-2">
                {paymentRequests.map(r => (
                  <div key={r.id} className={`rounded-xl p-3 flex items-center justify-between gap-3 ${r.status === 'paid' ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
                    <div>
                      <p className="font-bold text-slate-800">{r.service_name}</p>
                      <p className="text-xs text-slate-500">{parseFloat(r.amount || 0).toFixed(0)} ر.س</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {r.status === 'paid' ? 'تم الدفع' : 'في انتظار الدفع'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sticky bottom-4">
          <button onClick={() => save(false)} disabled={loading} className="py-4 gradient-medical text-white font-bold rounded-2xl btn-medical disabled:opacity-50 shadow-2xl flex items-center justify-center gap-2">
            <Save className="w-5 h-5" /> {loading ? '⏳' : 'حفظ كمسودة'}
          </button>
          <button onClick={() => save(true)} disabled={loading} className="py-4 gradient-success text-white font-bold rounded-2xl btn-medical disabled:opacity-50 shadow-2xl flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" /> {loading ? '⏳' : 'إنهاء وحفظ'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Reception Dashboard - شاشة الاستقبال
// ═══════════════════════════════════════════════════════════
function ReceptionDashboard({ user, clinic, onLogout }) {
  const [tab, setTab] = useState('dashboard')
  const [bookingFilter, setBookingFilter] = useState('pending')
  const [appointments, setAppointments] = useState([])
  const [complaints, setComplaints] = useState([])
  const [emergencies, setEmergencies] = useState([])
  const [payments, setPayments] = useState([])
  const [services, setServices] = useState([])
  const [insuranceCompanies, setInsuranceCompanies] = useState([])
  const [paymentRequests, setPaymentRequests] = useState([])
  const [activeSessions, setActiveSessions] = useState([])
  const [selectedPaymentApt, setSelectedPaymentApt] = useState(null)
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState(null)
  const [paymentForm, setPaymentForm] = useState({ service_id: '', amount: '', payment_method: 'cash', insurance_company_id: '', reference_no: '', notes: '' })
  const [loading, setLoading] = useState(true)
  const work = useWorkSession({ clinic, userType: 'admin_user', userId: user.id, userName: user.full_name || user.username, role: 'receptionist' })

  useEffect(() => { if (work.active) loadReceptionData() }, [work.active])

  useRealtime('appointments', (payload) => {
    if (payload.new?.clinic_id === clinic.id || payload.old?.clinic_id === clinic.id) {
      loadReceptionData()
      if (payload.eventType === 'INSERT') {
        setNotification('🆕 حجز جديد وصل للاستقبال')
        setTimeout(() => setNotification(null), 5000)
      }
    }
  }, { column: 'clinic_id', value: clinic.id })

  useRealtime('payment_requests', (payload) => {
    if (payload.new?.clinic_id === clinic.id || payload.old?.clinic_id === clinic.id) {
      loadReceptionData()
      notifyFromPayload('payment_requests', payload, setNotification)
    }
  }, { column: 'clinic_id', value: clinic.id })

  useRealtime('work_sessions', (payload) => {
    if (payload.new?.clinic_id === clinic.id || payload.old?.clinic_id === clinic.id) {
      loadReceptionData()
      notifyFromPayload('work_sessions', payload, setNotification)
    }
  }, { column: 'clinic_id', value: clinic.id })

  const loadReceptionData = async () => {
    const today = new Date().toISOString().split('T')[0]
    const [a, c, e, p, srv, ins, req, sessions] = await Promise.all([
      supabase.from('appointments').select('*, patients(*), doctors(*)').eq('clinic_id', clinic.id).gte('appointment_date', today).order('appointment_date').order('appointment_time'),
      supabase.from('complaints').select('*, patients(*)').eq('clinic_id', clinic.id).neq('status', 'resolved').order('created_at', { ascending: false }),
      supabase.from('emergency_requests').select('*, patients(*)').eq('clinic_id', clinic.id).neq('status', 'closed').order('created_at', { ascending: false }),
      supabase.from('payments').select('*, patients(name, phone), appointments(doctor_id, doctors(name)), admin_users(full_name)').eq('clinic_id', clinic.id).order('paid_at', { ascending: false }).limit(80),
      supabase.from('clinic_services').select('*').eq('clinic_id', clinic.id).eq('is_active', true).order('name'),
      supabase.from('insurance_companies').select('*').eq('is_active', true).order('name'),
      supabase.from('payment_requests').select('*, patients(name, phone, national_id), doctors(name)').eq('clinic_id', clinic.id).order('requested_at', { ascending: false }),
      supabase.from('work_sessions').select('*').eq('clinic_id', clinic.id).is('clock_out', null).order('clock_in', { ascending: false }),
    ])
    setAppointments(a.data || [])
    setComplaints(c.data || [])
    setEmergencies(e.data || [])
    setPayments(p.data || [])
    setServices(srv.data || [])
    setInsuranceCompanies(ins.data || [])
    setPaymentRequests(req.data || [])
    setActiveSessions(sessions.data || [])
    setLoading(false)
  }

  const confirmAppointment = async (apt) => {
    await supabase.from('appointments').update({ status: 'confirmed', confirmed_by: user.id, confirmed_at: new Date().toISOString() }).eq('id', apt.id)
  }

  const openPayment = (apt) => {
    const firstService = services[0]
    const amount = firstService?.price || 0
    setSelectedPaymentRequest(null)
    setSelectedPaymentApt(apt)
    setPaymentForm({ service_id: firstService?.id || '', amount: amount ? String(amount) : '', payment_method: apt.patients?.insurance_company ? 'insurance' : 'cash', insurance_company_id: '', reference_no: '', notes: '' })
  }

  const openRequestPayment = (req) => {
    setSelectedPaymentApt(null)
    setSelectedPaymentRequest(req)
    setPaymentForm({ service_id: req.service_id || '', amount: String(req.amount || 0), payment_method: 'cash', insurance_company_id: '', reference_no: '', notes: '' })
  }

  const updatePaymentService = (serviceId) => {
    const srv = services.find(s => s.id === serviceId)
    const price = paymentForm.payment_method === 'insurance' && srv?.insurance_price ? srv.insurance_price : srv?.price
    setPaymentForm({ ...paymentForm, service_id: serviceId, amount: price ? String(price) : '' })
  }

  const submitPayment = async (e) => {
    e.preventDefault()
    const target = selectedPaymentApt || selectedPaymentRequest
    if (!target) return
    const amount = parseFloat(paymentForm.amount) || 0
    if (amount <= 0) return alert('المبلغ غير صحيح')

    const srv = services.find(s => s.id === paymentForm.service_id)
    const now = new Date().toISOString()
    const patientId = selectedPaymentApt?.patient_id || selectedPaymentRequest?.patient_id
    const appointmentId = selectedPaymentApt?.id || selectedPaymentRequest?.appointment_id

    const { data: generatedInvoiceNo } = await supabase.rpc('generate_invoice_no', { p_clinic_id: clinic.id })
    const invoiceNo = generatedInvoiceNo || `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now()}`

    const { data: invoice, error: invoiceError } = await supabase.from('invoices').insert([{
      clinic_id: clinic.id,
      patient_id: patientId,
      appointment_id: appointmentId,
      invoice_no: invoiceNo,
      items: [{ id: srv?.id || selectedPaymentRequest?.service_id, name: srv?.name || selectedPaymentRequest?.service_name || 'خدمة', qty: 1, price: amount }],
      subtotal: amount,
      total: amount,
      paid_amount: amount,
      remaining_amount: 0,
      payment_status: 'paid',
      issued_by: user.id,
      issued_at: now,
    }]).select().single()
    if (invoiceError) return alert('❌ ' + invoiceError.message)

    const { error } = await supabase.from('payments').insert([{
      clinic_id: clinic.id,
      patient_id: patientId,
      appointment_id: appointmentId,
      invoice_id: invoice?.id,
      amount,
      payment_method: paymentForm.payment_method,
      reference_no: paymentForm.reference_no || null,
      received_by: user.id,
      notes: paymentForm.notes || (selectedPaymentRequest ? `دفع طلب خدمة: ${selectedPaymentRequest.service_name}` : `دفع كشف: ${srv?.name || 'خدمة'}`),
    }])
    if (error) return alert('❌ ' + error.message)

    if (selectedPaymentRequest) {
      await supabase.from('payment_requests').update({ status: 'paid', paid_by: user.id, paid_at: now }).eq('id', selectedPaymentRequest.id)
    } else {
      await supabase.from('appointments').update({ service_id: paymentForm.service_id || null, paid_by: user.id, paid_at: now, checked_in_by: user.id, checked_in_at: now, status: selectedPaymentApt.status === 'pending' ? 'confirmed' : selectedPaymentApt.status }).eq('id', selectedPaymentApt.id)
    }

    setSelectedPaymentApt(null)
    setSelectedPaymentRequest(null)
    alert('✓ تم تسجيل الدفع بنجاح')
    loadReceptionData()
  }

  if (!work.active) {
    return <DutyGate clinic={clinic} userName={user.full_name || user.username} roleLabel="موظف الاستقبال" icon={Users} work={work} onLogout={onLogout} />
  }

  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter(a => a.appointment_date === today)
  const filteredAppointments = appointments.filter(a => {
    if (bookingFilter === 'pending') return a.status === 'pending'
    if (bookingFilter === 'unpaid') return a.status === 'confirmed' && !a.paid_at
    if (bookingFilter === 'ready') return !!a.paid_at && !a.doctor_started_at && a.status !== 'completed'
    if (bookingFilter === 'in_exam') return !!a.doctor_started_at && a.status !== 'completed'
    if (bookingFilter === 'completed') return a.status === 'completed'
    return true
  })
  const pendingAppointments = appointments.filter(a => a.status === 'pending')
  const pendingRequests = paymentRequests.filter(r => r.status === 'pending')
  const todayRevenue = payments.filter(p => p.paid_at?.substring(0,10) === today).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-sky-50 to-cyan-50 page-enter" dir="rtl">
      <RealtimeToast notification={notification} />
      {notification && <Toast msg={notification} gradient="gradient-warning" />}
      <StaffHeader title="شاشة الاستقبال" subtitle={`${user.full_name || user.username} • ${clinic.name}`} icon={Users} gradient="gradient-medical-dark" onLogout={async () => { if (work.active) await work.endShift(); onLogout() }} />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
        <WorkStatusBar work={work} />
        <ReceptionQuickSearch clinic={clinic} services={services} doctorsActive={activeSessions.filter(s => s.role === 'doctor')} onRefresh={loadReceptionData} />

        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'dashboard', label: 'الرئيسية', icon: BarChart3 },
            { id: 'bookings', label: 'الحجوزات', icon: Calendar },
            { id: 'requests', label: 'طلبات الدفع', icon: Receipt },
            { id: 'payments', label: 'المدفوعات', icon: DollarSign },
            { id: 'team', label: 'الأطباء النشطين', icon: Stethoscope },
            { id: 'insurance', label: 'التأمين', icon: ShieldCheck },
            { id: 'emergency', label: 'الطوارئ', icon: AlertCircle },
            { id: 'complaints', label: 'الشكاوى', icon: FileText },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap flex items-center gap-1.5 ${tab === t.id ? 'gradient-medical text-white shadow-lg' : 'bg-white text-slate-700 border border-slate-100'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {loading ? <div className="text-center py-12"><div className="spinner-medical w-14 h-14 mx-auto"></div></div> : (
          <>
            {tab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <BigStat icon={Calendar} label="مواعيد اليوم" value={todayAppointments.length} gradient="gradient-medical" onClick={() => setTab('bookings')} />
                  <BigStat icon={Clock} label="بانتظار التأكيد" value={pendingAppointments.length} gradient="gradient-warning" onClick={() => { setTab('bookings'); setBookingFilter('pending') }} />
                  <BigStat icon={Receipt} label="طلبات دفع" value={pendingRequests.length} gradient="gradient-danger" onClick={() => setTab('requests')} />
                  <BigStat icon={Stethoscope} label="أطباء نشطين" value={activeSessions.filter(s => s.role === 'doctor').length} gradient="gradient-success" onClick={() => setTab('team')} />
                  <BigStat icon={DollarSign} label="تحصيل اليوم" value={todayRevenue.toFixed(0)} suffix="ر.س" gradient="gradient-success" onClick={() => setTab('payments')} />
                </div>
                <ReceptionAppointments appointments={todayAppointments} onConfirm={confirmAppointment} onPaid={openPayment} title="مواعيد اليوم" />
              </div>
            )}
            {tab === 'bookings' && (
              <div className="space-y-4">
                <BookingFilters active={bookingFilter} setActive={setBookingFilter} />
                <ReceptionAppointments appointments={filteredAppointments} onConfirm={confirmAppointment} onPaid={openPayment} title="الحجوزات" />
              </div>
            )}
            {tab === 'requests' && <PaymentRequestsTab requests={paymentRequests} onPay={openRequestPayment} />}
            {tab === 'payments' && <ReceptionPayments payments={payments} total={todayRevenue} />}
            {tab === 'team' && <ActiveTeamPanel sessions={activeSessions} />}
            {tab === 'insurance' && <ReceptionInsurance companies={insuranceCompanies} patients={appointments.map(a => a.patients).filter(Boolean)} />}
            {tab === 'emergency' && <EmergencyTab clinic={clinic} user={user} emergencies={emergencies} onUpdate={loadReceptionData} />}
            {tab === 'complaints' && <ComplaintsManageTab complaints={complaints} />}
          </>
        )}
      </div>

      {(selectedPaymentApt || selectedPaymentRequest) && (
        <PaymentModal
          apt={selectedPaymentApt}
          request={selectedPaymentRequest}
          services={services}
          insuranceCompanies={insuranceCompanies}
          form={paymentForm}
          setForm={setPaymentForm}
          onServiceChange={updatePaymentService}
          onSubmit={submitPayment}
          onClose={() => { setSelectedPaymentApt(null); setSelectedPaymentRequest(null) }}
        />
      )}
    </div>
  )
}



function BookingFilters({ active, setActive }) {
  const filters = [
    { id: 'pending', label: 'بانتظار التأكيد' },
    { id: 'unpaid', label: 'مؤكد ولم يدفع' },
    { id: 'ready', label: 'جاهز للدكتور' },
    { id: 'in_exam', label: 'تحت الكشف' },
    { id: 'completed', label: 'مكتمل' },
    { id: 'all', label: 'الكل' },
  ]
  return <div className="bg-white rounded-2xl p-3 shadow-soft border border-slate-100 flex gap-2 overflow-x-auto">{filters.map(f => <button key={f.id} onClick={() => setActive(f.id)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${active === f.id ? 'gradient-medical text-white' : 'bg-slate-50 text-slate-700'}`}>{f.label}</button>)}</div>
}

function PaymentRequestsTab({ requests, onPay }) {
  const pending = requests.filter(r => r.status === 'pending')
  const paid = requests.filter(r => r.status === 'paid')
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-amber-100">
        <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2"><Receipt className="w-6 h-6 text-amber-600" /> طلبات دفع معلقة</h3>
        {pending.length === 0 ? <EmptyAdminState icon={CheckCircle} message="لا توجد طلبات دفع معلقة" /> : pending.map(r => (
          <div key={r.id} className="border-2 border-amber-100 rounded-2xl p-4 mb-3 bg-amber-50/40">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="font-black text-slate-800">{r.patients?.name || 'مريض'} • {r.service_name}</p>
                <p className="text-sm text-slate-600">الجوال: {r.patients?.phone || '-'} • الطبيب: {r.doctors?.name || '-'}</p>
                <p className="text-lg font-black text-amber-700 mt-1">{parseFloat(r.amount || 0).toFixed(0)} ر.س</p>
              </div>
              <button onClick={() => onPay(r)} className="gradient-success text-white px-5 py-3 rounded-xl font-bold shadow-lg">تسجيل الدفع</button>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-emerald-100">
        <h3 className="text-xl font-black text-slate-800 mb-4">طلبات مدفوعة حديثاً</h3>
        {paid.slice(0,10).length === 0 ? <EmptyAdminState icon={Receipt} message="لا توجد طلبات مدفوعة" /> : paid.slice(0,10).map(r => <div key={r.id} className="bg-emerald-50 rounded-xl p-3 mb-2 flex justify-between"><span className="font-bold">{r.patients?.name} • {r.service_name}</span><span className="text-emerald-700 font-black">مدفوع</span></div>)}
      </div>
    </div>
  )
}

function ActiveTeamPanel({ sessions }) {
  const doctors = sessions.filter(s => s.role === 'doctor')
  const reception = sessions.filter(s => s.role === 'receptionist')
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <TeamActiveCard title="الأطباء النشطين" icon={Stethoscope} items={doctors} />
      <TeamActiveCard title="الاستقبال النشط" icon={Users} items={reception} />
    </div>
  )
}

function TeamActiveCard({ title, icon: Icon, items }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-sky-100">
      <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2"><Icon className="w-6 h-6 text-sky-600" /> {title}</h3>
      {items.length === 0 ? <EmptyAdminState icon={Icon} message="لا يوجد نشط الآن" /> : items.map(s => <div key={s.id} className="bg-emerald-50 rounded-xl p-3 mb-2 flex justify-between items-center"><div><p className="font-bold text-slate-800">{s.user_name}</p><p className="text-xs text-slate-500">بدأ: {new Date(s.clock_in).toLocaleTimeString('ar-SA')}</p></div><span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">نشط</span></div>)}
    </div>
  )
}

function ReceptionQuickSearch({ clinic, services, doctorsActive, onRefresh }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newPatient, setNewPatient] = useState({ name: '', phone: '', national_id: '', gender: 'male', insurance_company: '', insurance_policy_no: '' })

  useEffect(() => {
    const run = async () => {
      const term = q.trim()
      if (term.length < 2) { setResults([]); return }
      const { data } = await supabase.from('patients').select('*').eq('clinic_id', clinic.id).or(`phone.ilike.%${term}%,national_id.ilike.%${term}%,name.ilike.%${term}%`).limit(8)
      setResults(data || [])
    }
    const t = setTimeout(run, 250)
    return () => clearTimeout(t)
  }, [q, clinic.id])

  const addPatient = async (e) => {
    e.preventDefault()
    const { data, error } = await supabase.from('patients').insert([{ ...newPatient, clinic_id: clinic.id, password: '1111' }]).select().single()
    if (error) return alert('❌ ' + error.message)
    setSelected(data); setShowAdd(false); setQ(data.phone); onRefresh?.()
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-xl border border-sky-100">
      <div className="flex items-center gap-2 mb-3"><Search className="w-5 h-5 text-sky-600" /><h3 className="font-black text-slate-800">بحث سريع عن مريض</h3></div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="اكتب رقم الجوال أو الإقامة أو الاسم" className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl input-medical outline-none" />
      {results.length > 0 && <div className="grid md:grid-cols-2 gap-2 mt-3">{results.map(p => <button key={p.id} onClick={() => setSelected(p)} className="text-right bg-slate-50 hover:bg-sky-50 rounded-xl p-3 border border-slate-100"><p className="font-bold text-slate-800">{p.name}</p><p className="text-xs text-slate-500">{p.phone} • {p.national_id || 'بدون إقامة'}</p></button>)}</div>}
      {q.trim().length >= 2 && results.length === 0 && <button onClick={() => setShowAdd(true)} className="mt-3 gradient-success text-white px-4 py-2 rounded-xl font-bold">إضافة مريض جديد</button>}
      {showAdd && <form onSubmit={addPatient} className="grid md:grid-cols-2 gap-3 mt-4 bg-slate-50 rounded-2xl p-4"><input required placeholder="اسم المريض" value={newPatient.name} onChange={e=>setNewPatient({...newPatient,name:e.target.value})} className="px-3 py-2 rounded-xl border"/><input required placeholder="الجوال" value={newPatient.phone} onChange={e=>setNewPatient({...newPatient,phone:e.target.value})} className="px-3 py-2 rounded-xl border"/><input placeholder="الإقامة/الهوية" value={newPatient.national_id} onChange={e=>setNewPatient({...newPatient,national_id:e.target.value})} className="px-3 py-2 rounded-xl border"/><input placeholder="شركة التأمين" value={newPatient.insurance_company} onChange={e=>setNewPatient({...newPatient,insurance_company:e.target.value})} className="px-3 py-2 rounded-xl border"/><button className="md:col-span-2 gradient-success text-white py-2 rounded-xl font-bold">حفظ المريض</button></form>}
      {selected && <div className="mt-4 bg-sky-50 border border-sky-100 rounded-2xl p-4"><div className="flex justify-between gap-3 flex-wrap"><div><p className="text-lg font-black text-slate-800">{selected.name}</p><p className="text-sm text-slate-600">{selected.phone} • {selected.national_id || 'بدون إقامة'}</p><p className="text-xs text-violet-700 mt-1">{selected.insurance_company ? `${selected.insurance_company} • ${selected.insurance_policy_no || ''}` : 'لا يوجد تأمين مسجل'}</p></div><div className="text-xs text-emerald-700 font-bold">الأطباء النشطين الآن: {doctorsActive.length}</div></div></div>}
    </div>
  )
}

function PaymentModal({ apt, request, services, insuranceCompanies, form, setForm, onServiceChange, onSubmit, onClose }) {
  const selectedService = services.find(s => s.id === form.service_id)
  const titlePatient = apt?.patients?.name || request?.patients?.name
  const titleDoctor = apt?.doctors?.name || request?.doctors?.name
  const amountLocked = !!request
  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-5"><div><h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Receipt className="w-7 h-7 text-emerald-600" /> تسجيل الدفع</h3><p className="text-sm text-slate-500 mt-1">{titlePatient} • {titleDoctor}</p></div><button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-xl"><X className="w-5 h-5" /></button></div>
        {request && <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4"><p className="font-bold text-amber-800">طلب من الطبيب: {request.service_name}</p><p className="text-sm text-amber-700">المبلغ ثابت من سعر الخدمة ولا يمكن تعديله من الاستقبال.</p></div>}
        <form onSubmit={onSubmit} className="space-y-4">
          {!request && <div><label className="block text-sm font-bold text-slate-700 mb-1">الخدمة</label><select value={form.service_id} onChange={(e) => onServiceChange(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none"><option value="">اختر الخدمة</option>{services.map(s => <option key={s.id} value={s.id}>{s.name} - {s.price} ر.س</option>)}</select></div>}
          {selectedService && <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-2xl p-3 text-center"><div><p className="text-xs text-slate-500">السعر</p><p className="font-black text-slate-800">{selectedService.price || 0}</p></div><div><p className="text-xs text-slate-500">سعر التأمين</p><p className="font-black text-violet-700">{selectedService.insurance_price || 0}</p></div><div><p className="text-xs text-slate-500">الخصم</p><p className="font-black text-amber-700">{selectedService.discount_pct || 0}%</p></div></div>}
          <div className="grid md:grid-cols-2 gap-4"><div><label className="block text-sm font-bold text-slate-700 mb-1">طريقة الدفع</label><select value={form.payment_method} onChange={(e) => setForm({...form, payment_method: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none"><option value="cash">نقدي</option><option value="card">بطاقة</option><option value="transfer">تحويل</option><option value="insurance">تأمين</option></select></div><div><label className="block text-sm font-bold text-slate-700 mb-1">المبلغ</label><input type="number" readOnly value={form.amount} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 outline-none font-bold" /></div></div>
          {form.payment_method === 'insurance' && <div><label className="block text-sm font-bold text-slate-700 mb-1">شركة التأمين</label><select value={form.insurance_company_id} onChange={(e) => setForm({...form, insurance_company_id: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none"><option value="">اختر شركة التأمين</option>{insuranceCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>}
          <div className="grid md:grid-cols-2 gap-4"><input placeholder="رقم مرجعي" value={form.reference_no} onChange={(e) => setForm({...form, reference_no: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" /><input placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" /></div>
          <button className="w-full py-4 gradient-success text-white rounded-2xl font-black shadow-xl flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" /> تأكيد الدفع</button>
        </form>
      </div>
    </div>
  )
}

function ReceptionInsurance({ companies, patients }) {
  const insuredPatients = patients.filter((p, idx, arr) => p?.insurance_company && arr.findIndex(x => x?.id === p.id) === idx)
  return <div className="grid lg:grid-cols-2 gap-6"><div className="bg-white rounded-3xl p-6 shadow-xl border border-violet-100"><h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-violet-600" /> شركات التأمين</h3>{companies.length === 0 ? <EmptyAdminState icon={ShieldCheck} message="لا توجد شركات تأمين" /> : <div className="space-y-2">{companies.map(c => <div key={c.id} className="bg-violet-50 rounded-xl p-3 flex items-center justify-between"><span className="font-bold text-slate-800">{c.name}</span><span className="text-xs text-violet-700">مفعّلة</span></div>)}</div>}</div><div className="bg-white rounded-3xl p-6 shadow-xl border border-sky-100"><h3 className="text-xl font-black text-slate-800 mb-4">مرضى لديهم تأمين اليوم</h3>{insuredPatients.length === 0 ? <EmptyAdminState icon={Users} message="لا توجد بيانات تأمين للمرضى اليوم" /> : <div className="space-y-2">{insuredPatients.map(p => <div key={p.id} className="bg-sky-50 rounded-xl p-3"><p className="font-bold text-slate-800">{p.name}</p><p className="text-xs text-sky-700">{p.insurance_company} • {p.insurance_policy_no || 'بدون رقم وثيقة'}</p></div>)}</div>}</div></div>
}

function ReceptionAppointments({ appointments, onConfirm, onPaid, title }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-sky-100">
      <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2"><Calendar className="w-6 h-6 text-sky-600" /> {title}</h3>
      {appointments.length === 0 ? <EmptyAdminState icon={Calendar} message="لا توجد مواعيد" /> : (
        <div className="space-y-3">
          {appointments.map(apt => (
            <div key={apt.id} className="border-2 border-slate-100 rounded-2xl p-4 hover:border-sky-200 transition">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="font-bold text-slate-800 text-lg">{apt.patients?.name || 'مريض غير محدد'}</p>
                  <p className="text-sm text-slate-600">📞 {apt.patients?.phone || '-'}</p>
                  <p className="text-sm text-slate-600">👨‍⚕️ {apt.doctors?.name || '-'}</p>
                  <p className="text-sm font-bold text-sky-700 mt-1">{apt.appointment_date} • {apt.appointment_time?.substring(0,5)}</p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  <StatusPill status={apt.status} />
                  {apt.status === 'pending' && <button onClick={() => onConfirm(apt)} className="gradient-success text-white px-4 py-2 rounded-xl text-sm font-bold">تأكيد</button>}
                  {!apt.paid_at && <button onClick={() => onPaid(apt)} className="gradient-warning text-white px-4 py-2 rounded-xl text-sm font-bold">تسجيل دفع</button>}
                  {apt.paid_at && <span className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-sm font-bold">مدفوع</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReceptionPayments({ payments, total }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-emerald-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Receipt className="w-6 h-6 text-emerald-600" /> مدفوعات اليوم</h3>
        <span className="gradient-success text-white px-4 py-2 rounded-xl font-black">{total.toFixed(0)} ر.س</span>
      </div>
      {payments.length === 0 ? <EmptyAdminState icon={Receipt} message="لا توجد مدفوعات اليوم" /> : (
        <div className="space-y-2">
          {payments.map(p => (
            <div key={p.id} className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">{parseFloat(p.amount).toFixed(0)} ر.س</p>
                <p className="text-xs text-slate-500">{p.payment_method} • {new Date(p.paid_at).toLocaleString('ar-SA')}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EmergencyTab({ clinic, user, emergencies, onUpdate }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ patient_name: '', phone: '', description: '', priority: 'medium' })

  const submit = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('emergency_requests').insert([{ ...form, clinic_id: clinic.id, created_by: user.id, status: 'open' }])
    if (error) return alert('❌ ' + error.message)
    setForm({ patient_name: '', phone: '', description: '', priority: 'medium' })
    setShowForm(false)
    onUpdate()
  }

  const closeEmergency = async (id) => {
    await supabase.from('emergency_requests').update({ status: 'closed', resolved_at: new Date().toISOString() }).eq('id', id)
    onUpdate()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><AlertCircle className="w-7 h-7 text-red-600" /> الطوارئ</h3>
        <button onClick={() => setShowForm(!showForm)} className="gradient-danger text-white px-5 py-3 rounded-2xl font-bold shadow-lg">{showForm ? 'إلغاء' : 'طلب طوارئ'}</button>
      </div>
      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-3xl p-6 shadow-xl border border-red-100 grid md:grid-cols-2 gap-4">
          <input required placeholder="اسم المريض" value={form.patient_name} onChange={(e) => setForm({...form, patient_name: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
          <input required placeholder="رقم الجوال" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
          <select value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none">
            <option value="low">منخفضة</option><option value="medium">متوسطة</option><option value="high">عالية</option><option value="critical">حرجة</option>
          </select>
          <textarea required placeholder="وصف الحالة" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="md:col-span-2 px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none resize-none" />
          <button className="md:col-span-2 gradient-danger text-white py-3 rounded-xl font-bold">حفظ الطلب</button>
        </form>
      )}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-red-100">
        {emergencies.length === 0 ? <EmptyAdminState icon={CheckCircle} message="لا توجد طلبات طوارئ" /> : emergencies.map(e => (
          <div key={e.id} className="border-2 border-red-100 rounded-2xl p-4 mb-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="font-bold text-slate-800">{e.patient_name || e.patients?.name}</p>
                <p className="text-sm text-slate-600">{e.phone || e.patients?.phone}</p>
                <p className="text-sm text-slate-700 mt-2">{e.description}</p>
              </div>
              <div className="flex gap-2 items-center">
                <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold">{e.priority}</span>
                <button onClick={() => closeEmergency(e.id)} className="bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl text-sm font-bold">إغلاق</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Accountant Dashboard - لوحة المحاسب
// ═══════════════════════════════════════════════════════════
function AccountantDashboard({ user, clinic, onLogout }) {
  const [records, setRecords] = useState([])
  const [payments, setPayments] = useState([])
  const [expenses, setExpenses] = useState([])
  const [workSessions, setWorkSessions] = useState([])
  const [tab, setTab] = useState('dashboard')
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: 'مصاريف متنوعة', payment_method: 'cash', date: new Date().toISOString().split('T')[0], vendor: '', notes: '' })

  useEffect(() => { loadAccountingData() }, [])

  useRealtime('payments', (payload) => {
    if (payload.new?.clinic_id === clinic.id || payload.old?.clinic_id === clinic.id) {
      loadAccountingData()
      notifyFromPayload('payments', payload, setNotification)
    }
  }, { column: 'clinic_id', value: clinic.id })

  useRealtime('work_sessions', (payload) => {
    if (payload.new?.clinic_id === clinic.id || payload.old?.clinic_id === clinic.id) {
      loadAccountingData()
      notifyFromPayload('work_sessions', payload, setNotification)
    }
  }, { column: 'clinic_id', value: clinic.id })

  const loadAccountingData = async () => {
    const [r, p, e, ws] = await Promise.all([
      supabase.from('medical_records').select('*, patients(name), doctors(name)').eq('clinic_id', clinic.id).order('created_at', { ascending: false }),
      supabase.from('payments').select('*, patients(name, phone), appointments(doctor_id, doctors(name)), admin_users(full_name)').eq('clinic_id', clinic.id).order('paid_at', { ascending: false }),
      supabase.from('expenses').select('*').eq('clinic_id', clinic.id).order('date', { ascending: false }),
      supabase.from('work_sessions').select('*').eq('clinic_id', clinic.id).order('clock_in', { ascending: false }).limit(100),
    ])
    setRecords(r.data || [])
    setPayments(p.data || [])
    setExpenses(e.data || [])
    setWorkSessions(ws.data || [])
  }

  const addExpense = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('expenses').insert([{ ...expenseForm, clinic_id: clinic.id, amount: parseFloat(expenseForm.amount) || 0, created_by: user.id }])
    if (error) return alert('❌ ' + error.message)
    setExpenseForm({ description: '', amount: '', category: 'مصاريف متنوعة', payment_method: 'cash', date: new Date().toISOString().split('T')[0], vendor: '', notes: '' })
    setShowExpenseForm(false)
    loadAccountingData()
  }

  const exportCSV = () => {
    const rows = [['التاريخ', 'النوع', 'الوصف', 'المبلغ', 'طريقة الدفع']]
    payments.forEach(p => rows.push([p.paid_at?.substring(0,10), 'إيراد', p.notes || 'دفعة', p.amount, p.payment_method]))
    expenses.forEach(e => rows.push([e.date, 'مصروف', e.description, `-${e.amount}`, e.payment_method]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `accounting-${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  const totalRecordsRevenue = records.reduce((sum, r) => sum + (parseFloat(r.paid_amount) || 0), 0)
  const totalPayments = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
  const totalRevenue = Math.max(totalRecordsRevenue, totalPayments)
  const netProfit = totalRevenue - totalExpenses

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-sky-50 to-emerald-50 page-enter" dir="rtl">
      <RealtimeToast notification={notification} />
      <StaffHeader title="لوحة المحاسب" subtitle={`${user.full_name || user.username} • ${clinic.name}`} icon={DollarSign} gradient="gradient-medical-dark" onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'dashboard', label: 'الرئيسية', icon: BarChart3 },
            { id: 'payments', label: 'الإيرادات', icon: Receipt },
            { id: 'expenses', label: 'المصروفات', icon: DollarSign },
            { id: 'import', label: 'استيراد Excel', icon: FileSpreadsheet },
            { id: 'work', label: 'ساعات العمل', icon: Clock },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap flex items-center gap-1.5 ${tab === t.id ? 'gradient-purple text-white shadow-lg' : 'bg-white text-slate-700 border border-slate-100'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
          <button onClick={exportCSV} className="gradient-success text-white px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap">تصدير CSV</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {tab === 'dashboard' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <BigStat icon={TrendingUp} label="الإيرادات" value={totalRevenue.toFixed(0)} suffix="ر.س" gradient="gradient-success" onClick={() => setTab('payments')} />
              <BigStat icon={DollarSign} label="المصروفات" value={totalExpenses.toFixed(0)} suffix="ر.س" gradient="gradient-danger" onClick={() => setTab('expenses')} />
              <BigStat icon={BarChart3} label="صافي الربح" value={netProfit.toFixed(0)} suffix="ر.س" gradient="gradient-medical" />
              <BigStat icon={Receipt} label="عمليات الدفع" value={payments.length} gradient="gradient-purple" onClick={() => setTab('payments')} />
            </div>
            <AccountingSummary payments={payments} expenses={expenses} />
          </>
        )}
        {tab === 'payments' && <PaymentsList payments={payments} records={records} />}
        {tab === 'expenses' && (
          <ExpensesList expenses={expenses} showForm={showExpenseForm} setShowForm={setShowExpenseForm} form={expenseForm} setForm={setExpenseForm} onSubmit={addExpense} />
        )}
        {tab === 'import' && <ImportDataTab clinic={clinic} user={user} onDone={loadAccountingData} />}
        {tab === 'work' && <WorkReportsTab sessions={workSessions} />}
      </div>
    </div>
  )
}


function ImportDataTab({ clinic, user, onDone }) {
  const templates = {
    patients: {
      title: 'المرضى',
      table: 'patients',
      required: ['الاسم الكامل', 'رقم الجوال'],
      columns: ['الاسم الكامل', 'رقم الجوال', 'رقم الهوية', 'تاريخ الميلاد', 'الجنس', 'فصيلة الدم', 'الحساسيات', 'ملاحظات طبية', 'شركة التأمين', 'رقم بوليصة التأمين'],
      sample: ['محمد أحمد', '0500000000', '1234567890', '28/05/1990', 'male', 'O+', 'لا يوجد', 'ملاحظات', 'بوبا العربية', 'POL-001']
    },
    income: {
      title: 'الإيرادات القديمة',
      table: 'payments',
      required: ['التاريخ', 'المبلغ'],
      columns: ['التاريخ', 'اسم المريض', 'رقم الجوال', 'الخدمة المقدمة', 'المبلغ', 'طريقة الدفع', 'اسم الدكتور', 'شركة التأمين', 'ملاحظات'],
      sample: ['28/05/2026', 'محمد أحمد', '0500000000', 'كشف', '250', 'cash', 'د. أحمد', '', 'دفعة قديمة']
    },
    expenses: {
      title: 'المصروفات',
      table: 'expenses',
      required: ['التاريخ', 'نوع المصروف', 'الوصف', 'المبلغ'],
      columns: ['التاريخ', 'نوع المصروف', 'الوصف', 'المبلغ', 'طريقة الدفع', 'المورد', 'ملاحظات'],
      sample: ['28/05/2026', 'الأدوية والمستلزمات', 'شراء مستلزمات', '1500', 'cash', 'مورد طبي', '']
    },
    doctors: {
      title: 'الأطباء',
      table: 'doctors',
      required: ['الاسم'],
      columns: ['الاسم', 'التخصص', 'الجوال', 'البريد الإلكتروني', 'اسم المستخدم', 'كلمة المرور'],
      sample: ['د. أحمد محمد', 'طبيب عام', '0500000000', 'doctor@example.com', '1111', '1111']
    },
    invoices: {
      title: 'الفواتير القديمة',
      table: 'invoices',
      required: ['رقم الفاتورة', 'التاريخ', 'المبلغ الإجمالي'],
      columns: ['رقم الفاتورة', 'التاريخ', 'المريض', 'الخدمات', 'المبلغ الإجمالي', 'الخصم', 'المدفوع', 'المتبقي'],
      sample: ['INV-OLD-001', '28/05/2026', 'محمد أحمد', 'كشف, تنظيف', '500', '0', '500', '0']
    }
  }

  const [type, setType] = useState('patients')
  const [rows, setRows] = useState([])
  const [validRows, setValidRows] = useState([])
  const [errors, setErrors] = useState([])
  const [saving, setSaving] = useState(false)
  const current = templates[type]

  const normalizeKey = (row, key) => row[key] ?? row[key.trim()] ?? ''

  const parseDate = (value) => {
    if (!value) return null
    if (typeof value === 'number') {
      const d = XLSX.SSF.parse_date_code(value)
      if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
    }
    const str = String(value).trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10)
    const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
    return str
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([current.columns, current.sample])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, current.title)
    XLSX.writeFile(wb, `hulool-${type}-template.xlsx`)
  }

  const validateRows = (data) => {
    const errs = []
    const good = []
    data.forEach((row, index) => {
      const rowErrors = []
      current.required.forEach(col => {
        if (!String(normalizeKey(row, col)).trim()) rowErrors.push(`العمود مطلوب: ${col}`)
      })
      if (rowErrors.length) errs.push({ row: index + 2, errors: rowErrors, data: row })
      else good.push({ ...row, __rowNumber: index + 2 })
    })
    setRows(data)
    setErrors(errs)
    setValidRows(good)
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(ws, { defval: '' })
    validateRows(data)
  }

  const mapRowsForInsert = () => {
    if (type === 'patients') return validRows.map(r => ({
      clinic_id: clinic.id,
      name: normalizeKey(r, 'الاسم الكامل'),
      phone: String(normalizeKey(r, 'رقم الجوال')),
      national_id: normalizeKey(r, 'رقم الهوية') || null,
      date_of_birth: parseDate(normalizeKey(r, 'تاريخ الميلاد')),
      gender: normalizeKey(r, 'الجنس') || 'male',
      blood_type: normalizeKey(r, 'فصيلة الدم') || null,
      allergies: normalizeKey(r, 'الحساسيات') || null,
      medical_notes: normalizeKey(r, 'ملاحظات طبية') || null,
      insurance_company: normalizeKey(r, 'شركة التأمين') || null,
      insurance_policy_no: normalizeKey(r, 'رقم بوليصة التأمين') || null,
      password: '1111'
    }))

    if (type === 'income') return validRows.map(r => ({
      clinic_id: clinic.id,
      amount: parseFloat(normalizeKey(r, 'المبلغ')) || 0,
      payment_method: normalizeKey(r, 'طريقة الدفع') || 'cash',
      paid_at: `${parseDate(normalizeKey(r, 'التاريخ')) || new Date().toISOString().split('T')[0]}T12:00:00`,
      received_by: user.id,
      notes: [normalizeKey(r, 'اسم المريض'), normalizeKey(r, 'الخدمة المقدمة'), normalizeKey(r, 'ملاحظات')].filter(Boolean).join(' - ')
    }))

    if (type === 'expenses') return validRows.map(r => ({
      clinic_id: clinic.id,
      description: normalizeKey(r, 'الوصف'),
      amount: parseFloat(normalizeKey(r, 'المبلغ')) || 0,
      category: normalizeKey(r, 'نوع المصروف') || 'مصاريف متنوعة',
      payment_method: normalizeKey(r, 'طريقة الدفع') || 'cash',
      date: parseDate(normalizeKey(r, 'التاريخ')) || new Date().toISOString().split('T')[0],
      vendor: normalizeKey(r, 'المورد') || null,
      notes: normalizeKey(r, 'ملاحظات') || null,
      created_by: user.id
    }))

    if (type === 'doctors') return validRows.map(r => ({
      clinic_id: clinic.id,
      name: normalizeKey(r, 'الاسم'),
      specialization: normalizeKey(r, 'التخصص') || null,
      phone: String(normalizeKey(r, 'الجوال') || ''),
      email: normalizeKey(r, 'البريد الإلكتروني') || null,
      username: String(normalizeKey(r, 'اسم المستخدم') || '1111'),
      password: String(normalizeKey(r, 'كلمة المرور') || '1111'),
      is_active: true
    }))

    if (type === 'invoices') return validRows.map(r => {
      const total = parseFloat(normalizeKey(r, 'المبلغ الإجمالي')) || 0
      const discount = parseFloat(normalizeKey(r, 'الخصم')) || 0
      const paid = parseFloat(normalizeKey(r, 'المدفوع')) || 0
      const remaining = parseFloat(normalizeKey(r, 'المتبقي')) || Math.max(0, total - paid)
      return {
        clinic_id: clinic.id,
        invoice_no: String(normalizeKey(r, 'رقم الفاتورة')),
        items: String(normalizeKey(r, 'الخدمات') || '').split(',').filter(Boolean).map(x => ({ name: x.trim(), qty: 1, price: 0 })),
        subtotal: total,
        discount,
        total: Math.max(0, total - discount),
        paid_amount: paid,
        remaining_amount: remaining,
        payment_status: remaining <= 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
        issued_by: user.id,
        issued_at: `${parseDate(normalizeKey(r, 'التاريخ')) || new Date().toISOString().split('T')[0]}T12:00:00`
      }
    })

    return []
  }

  const saveImport = async () => {
    if (validRows.length === 0) return alert('لا توجد صفوف سليمة للحفظ')
    setSaving(true)
    const payload = mapRowsForInsert()
    const { error } = await supabase.from(current.table).insert(payload)
    setSaving(false)
    if (error) return alert('❌ ' + error.message)
    alert(`✓ تم حفظ ${payload.length} سجل بنجاح`)
    setRows([]); setValidRows([]); setErrors([])
    onDone?.()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-sky-100">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
          <div>
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><FileSpreadsheet className="w-7 h-7 text-sky-600" /> استيراد البيانات القديمة</h3>
            <p className="text-slate-500 text-sm mt-1">Excel فقط، بدون AI. حمّل القالب، عبّئه، ثم ارفعه للمراجعة قبل الحفظ.</p>
          </div>
          <button onClick={downloadTemplate} className="gradient-medical text-white px-5 py-3 rounded-2xl font-bold shadow-lg flex items-center gap-2"><Download className="w-5 h-5" /> تحميل القالب</button>
        </div>

        <div className="grid md:grid-cols-5 gap-3 mb-5">
          {Object.entries(templates).map(([key, item]) => (
            <button key={key} onClick={() => { setType(key); setRows([]); setValidRows([]); setErrors([]) }} className={`p-4 rounded-2xl border-2 text-center font-bold transition ${type === key ? 'gradient-medical text-white border-sky-400 shadow-lg' : 'bg-slate-50 text-slate-700 border-slate-100 hover:border-sky-200'}`}>
              <FileSpreadsheet className="w-7 h-7 mx-auto mb-2" /> {item.title}
            </button>
          ))}
        </div>

        <label className="upload-zone block rounded-2xl p-8 text-center cursor-pointer">
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
          <Upload className="w-12 h-12 mx-auto text-sky-600 mb-3" />
          <p className="font-black text-slate-800">ارفع ملف Excel للمراجعة</p>
          <p className="text-xs text-slate-500 mt-1">XLSX / XLS / CSV</p>
        </label>
      </div>

      {rows.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-sky-100">
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-slate-50 rounded-2xl p-4 text-center"><p className="text-3xl font-black text-slate-800">{rows.length}</p><p className="text-xs text-slate-500">إجمالي الصفوف</p></div>
            <div className="bg-emerald-50 rounded-2xl p-4 text-center"><p className="text-3xl font-black text-emerald-700">{validRows.length}</p><p className="text-xs text-emerald-700">صفوف سليمة</p></div>
            <div className="bg-red-50 rounded-2xl p-4 text-center"><p className="text-3xl font-black text-red-700">{errors.length}</p><p className="text-xs text-red-700">أخطاء</p></div>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-5">
              <p className="font-black text-red-700 mb-2">الأخطاء:</p>
              <div className="space-y-1 max-h-36 overflow-auto">{errors.map(e => <p key={e.row} className="text-sm text-red-700">صف {e.row}: {e.errors.join('، ')}</p>)}</div>
            </div>
          )}

          <div className="overflow-x-auto border border-slate-100 rounded-2xl mb-5">
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr>{current.columns.map(c => <th key={c} className="p-3 text-right whitespace-nowrap">{c}</th>)}</tr></thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => {
                  const hasError = errors.some(e => e.row === i + 2)
                  return <tr key={i} className={hasError ? 'bg-red-50' : 'bg-white'}>{current.columns.map(c => <td key={c} className="p-3 border-t border-slate-100 whitespace-nowrap">{String(normalizeKey(r, c) || '')}</td>)}</tr>
                })}
              </tbody>
            </table>
          </div>

          <button onClick={saveImport} disabled={saving || validRows.length === 0} className="w-full py-4 gradient-success text-white rounded-2xl font-black shadow-xl disabled:opacity-50">
            {saving ? 'جاري الحفظ...' : `حفظ ${validRows.length} سجل سليم`}
          </button>
        </div>
      )}
    </div>
  )
}


function WorkReportsTab({ sessions }) {
  const grouped = {}
  sessions.forEach(s => {
    const key = `${s.user_type}-${s.user_id}`
    if (!grouped[key]) grouped[key] = { name: s.user_name, role: s.role, minutes: 0, active: false, count: 0, lastIn: s.clock_in, lastOut: s.clock_out }
    grouped[key].minutes += parseInt(s.total_minutes) || (s.clock_out ? 0 : Math.max(0, Math.round((new Date() - new Date(s.clock_in)) / 60000)))
    grouped[key].active = grouped[key].active || !s.clock_out
    grouped[key].count += 1
    if (!grouped[key].lastIn || s.clock_in > grouped[key].lastIn) grouped[key].lastIn = s.clock_in
    if (s.clock_out && (!grouped[key].lastOut || s.clock_out > grouped[key].lastOut)) grouped[key].lastOut = s.clock_out
  })
  const rows = Object.values(grouped)
  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-sky-100">
      <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2"><Clock className="w-6 h-6 text-sky-600" /> تقرير ساعات العمل</h3>
      {rows.length === 0 ? <EmptyAdminState icon={Clock} message="لا توجد جلسات دوام" /> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">الدور</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">الساعات</th><th className="p-3 text-right">عدد الجلسات</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i} className="border-t"><td className="p-3 font-bold">{r.name}</td><td className="p-3">{r.role}</td><td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-bold ${r.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{r.active ? 'نشط' : 'غير نشط'}</span></td><td className="p-3 font-black">{formatMinutesArabic(r.minutes)}</td><td className="p-3">{r.count}</td></tr>)}</tbody></table></div>}
    </div>
  )
}

function AccountingSummary({ payments, expenses }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-emerald-100">
        <h3 className="font-black text-slate-800 mb-4">آخر المدفوعات</h3>
        {payments.slice(0, 5).map(p => <MoneyRow key={p.id} label={p.notes || p.payment_method} amount={p.amount} date={p.paid_at?.substring(0,10)} positive />)}
        {payments.length === 0 && <EmptyAdminState icon={Receipt} message="لا توجد مدفوعات" />}
      </div>
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-red-100">
        <h3 className="font-black text-slate-800 mb-4">آخر المصروفات</h3>
        {expenses.slice(0, 5).map(e => <MoneyRow key={e.id} label={e.description} amount={e.amount} date={e.date} />)}
        {expenses.length === 0 && <EmptyAdminState icon={DollarSign} message="لا توجد مصروفات" />}
      </div>
    </div>
  )
}

function PaymentsList({ payments, records }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-emerald-100">
      <h3 className="text-xl font-black text-slate-800 mb-4">الإيرادات والمدفوعات</h3>
      {payments.length === 0 && records.length === 0 ? <EmptyAdminState icon={Receipt} message="لا توجد إيرادات" /> : (
        <div className="space-y-2">
          {payments.map(p => <MoneyRow key={p.id} label={`${p.patients?.name || 'مريض'} • استقبال: ${p.admin_users?.full_name || '-'} • دكتور: ${p.appointments?.doctors?.name || '-'}`} amount={p.amount} date={p.paid_at?.substring(0,10)} positive />)}
          {payments.length === 0 && records.map(r => <MoneyRow key={r.id} label={r.patients?.name || 'كشف'} amount={r.paid_amount} date={r.created_at?.substring(0,10)} positive />)}
        </div>
      )}
    </div>
  )
}

function ExpensesList({ expenses, showForm, setShowForm, form, setForm, onSubmit }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-slate-800">المصروفات</h3>
        <button onClick={() => setShowForm(!showForm)} className="gradient-danger text-white px-5 py-3 rounded-2xl font-bold shadow-lg">{showForm ? 'إلغاء' : 'مصروف جديد'}</button>
      </div>
      {showForm && (
        <form onSubmit={onSubmit} className="bg-white rounded-3xl p-6 shadow-xl border border-red-100 grid md:grid-cols-2 gap-4">
          <input required placeholder="وصف المصروف" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
          <input required type="number" placeholder="المبلغ" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
          <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none">
            {['الرواتب والأجور','الإيجار والمرافق','الأدوية والمستلزمات','معدات وصيانة','تسويق وإعلانات','مصاريف إدارية','مصاريف متنوعة'].map(c => <option key={c}>{c}</option>)}
          </select>
          <input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
          <input placeholder="المورد" value={form.vendor} onChange={(e) => setForm({...form, vendor: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none" />
          <select value={form.payment_method} onChange={(e) => setForm({...form, payment_method: e.target.value})} className="px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none">
            <option value="cash">نقدي</option><option value="card">بطاقة</option><option value="transfer">تحويل</option>
          </select>
          <textarea placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="md:col-span-2 px-4 py-3 border-2 border-slate-200 rounded-xl input-medical outline-none resize-none" />
          <button className="md:col-span-2 gradient-danger text-white py-3 rounded-xl font-bold">حفظ المصروف</button>
        </form>
      )}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-red-100">
        {expenses.length === 0 ? <EmptyAdminState icon={DollarSign} message="لا توجد مصروفات" /> : expenses.map(e => <MoneyRow key={e.id} label={e.description} amount={e.amount} date={e.date} />)}
      </div>
    </div>
  )
}

function MoneyRow({ label, amount, date, positive = false }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between mb-2">
      <div>
        <p className="font-bold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{date || '-'}</p>
      </div>
      <p className={`font-black ${positive ? 'text-emerald-600' : 'text-red-600'}`}>{positive ? '+' : '-'}{parseFloat(amount || 0).toFixed(0)} ر.س</p>
    </div>
  )
}



function notifyFromPayload(table, payload, setNotification, currentUserId = null) {
  const row = payload.new || payload.old || {}
  const event = payload.eventType
  let msg = ''

  if (table === 'work_sessions') {
    if (event === 'INSERT') msg = `${row.user_name || 'موظف'} بدأ الدوام`
    else if (event === 'UPDATE') {
      if (row.status === 'break') msg = `${row.user_name || 'موظف'} في استراحة مؤقتة`
      else if (row.status === 'active') msg = `${row.user_name || 'موظف'} عاد من الاستراحة`
      else if (row.status === 'closed' || row.clock_out) msg = `${row.user_name || 'موظف'} خرج من الدوام`
    }
  }

  if (table === 'payments') {
    if (event === 'INSERT') msg = `تم تسجيل دفعة جديدة ${row.amount ? `بقيمة ${Number(row.amount).toFixed(0)} ر.س` : ''}`
  }

  if (table === 'invoices') {
    if (event === 'INSERT') msg = `تم إصدار فاتورة ${row.invoice_no || ''}`
  }

  if (table === 'appointments') {
    if (event === 'INSERT') msg = 'تم تسجيل حجز جديد'
    else if (event === 'UPDATE') {
      if (row.paid_at) msg = 'تم دفع موعد وتحويله للطبيب'
      else if (row.status === 'confirmed') msg = 'تم تأكيد موعد'
      else if (row.status === 'cancelled') msg = 'تم إلغاء موعد'
      else if (row.status === 'completed') msg = 'تم اكتمال كشف'
      else if (row.doctor_started_at) msg = 'بدأ الطبيب الكشف'
    }
  }

  if (table === 'payment_requests') {
    if (event === 'INSERT') msg = 'طلب دفع جديد من الطبيب'
    else if (event === 'UPDATE' && row.status === 'paid') msg = 'تم دفع طلب خدمة إضافية'
  }

  if (table === 'complaints' && event === 'INSERT') msg = 'شكوى جديدة'
  if (table === 'emergency_requests' && event === 'INSERT') msg = 'طلب طوارئ جديد'
  if (table === 'patients' && event === 'INSERT') msg = 'تم إضافة مريض جديد'
  if (table === 'medical_records' && event === 'INSERT') msg = 'تم حفظ كشف طبي جديد'

  if (msg && setNotification) {
    setNotification({ type: table, msg })
    setTimeout(() => setNotification(null), 5000)
  }
}

function RealtimeToast({ notification }) {
  if (!notification) return null
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-slide-up">
      <div className="px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-2 gradient-medical text-white">
        <Bell className="w-5 h-5" /> {notification.msg || notification}
      </div>
    </div>
  )
}

function useWorkSession({ clinic, userType, userId, userName, role }) {
  const [session, setSession] = useState(null)
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [tick, setTick] = useState(0)

  useEffect(() => { loadSession() }, [clinic?.id, userId])
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 60000)
    return () => clearInterval(t)
  }, [])

  const loadSession = async () => {
    if (!clinic?.id || !userId) return
    const today = new Date().toISOString().split('T')[0]
    const [active, sessions] = await Promise.all([
      supabase.from('work_sessions').select('*').eq('clinic_id', clinic.id).eq('user_type', userType).eq('user_id', userId).is('clock_out', null).maybeSingle(),
      supabase.from('work_sessions').select('*').eq('clinic_id', clinic.id).eq('user_type', userType).eq('user_id', userId).gte('clock_in', `${today}T00:00:00`)
    ])
    setSession(active.data || null)
    const closedMinutes = (sessions.data || []).reduce((sum, s) => sum + (parseInt(s.total_minutes) || 0), 0)
    setTodayMinutes(closedMinutes)
  }

  const start = async () => {
    await loadSession()
    const { data: existing } = await supabase.from('work_sessions').select('*').eq('clinic_id', clinic.id).eq('user_type', userType).eq('user_id', userId).is('clock_out', null).maybeSingle()
    if (existing) {
      if (existing.status === 'break') {
        const { data } = await supabase.from('work_sessions').update({ status: 'active' }).eq('id', existing.id).select().single()
        setSession(data || existing)
      } else setSession(existing)
      return
    }
    const { data, error } = await supabase.from('work_sessions').insert([{ clinic_id: clinic.id, user_type: userType, user_id: userId, user_name: userName, role, status: 'active' }]).select().single()
    if (error) return alert('❌ ' + error.message)
    setSession(data)
  }

  const takeBreak = async () => {
    if (!session) return
    const { data, error } = await supabase.from('work_sessions').update({ status: 'break' }).eq('id', session.id).select().single()
    if (error) return alert('❌ ' + error.message)
    setSession(data)
  }

  const backFromBreak = async () => {
    if (!session) return
    const { data, error } = await supabase.from('work_sessions').update({ status: 'active' }).eq('id', session.id).select().single()
    if (error) return alert('❌ ' + error.message)
    setSession(data)
  }

  const endShift = async () => {
    if (!session) return
    const now = new Date()
    const startDate = new Date(session.clock_in)
    const total_minutes = Math.max(0, Math.round((now - startDate) / 60000))
    const { error } = await supabase.from('work_sessions').update({ clock_out: now.toISOString(), total_minutes, status: 'closed' }).eq('id', session.id)
    if (error) return alert('❌ ' + error.message)
    setSession(null)
    await loadSession()
  }

  const activeMinutes = session ? Math.max(0, Math.round((new Date() - new Date(session.clock_in)) / 60000)) : 0
  const totalToday = todayMinutes + activeMinutes + tick * 0

  return {
    active: !!session,
    isBreak: session?.status === 'break',
    session,
    todayMinutes: totalToday,
    start,
    takeBreak,
    backFromBreak,
    endShift,
    stop: endShift,
    reload: loadSession
  }
}

function formatMinutesArabic(minutes) {
  const h = Math.floor((minutes || 0) / 60)
  const m = (minutes || 0) % 60
  if (h <= 0) return `${m} دقيقة`
  return `${h} ساعة و ${m} دقيقة`
}

function DutyGate({ clinic, userName, roleLabel, icon: Icon, work, onLogout }) {
  return (
    <div className="min-h-screen bg-pattern-subtle flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl p-8 shadow-large border border-slate-100 max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto gradient-medical rounded-3xl flex items-center justify-center shadow-medium mb-5 icon-pulse-ring">
          <Icon className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">أهلاً {userName}</h1>
        <p className="text-slate-500 mb-6">لبدء استخدام لوحة {roleLabel} في {clinic.name}، اضغط بدء الدوام.</p>
        <button onClick={work.start} className="w-full py-4 gradient-success text-white rounded-2xl font-black shadow-xl mb-3">بدء الدوام</button>
        <button onClick={onLogout} className="w-full py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold">تسجيل خروج</button>
      </div>
    </div>
  )
}

function WorkStatusBar({ work }) {
  const isBreak = work.isBreak
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-soft border flex items-center justify-between gap-3 flex-wrap ${isBreak ? 'border-amber-200' : 'border-emerald-100'}`}>
      <div>
        <p className="text-xs text-slate-500">حالة الدوام</p>
        <p className={`font-black ${isBreak ? 'text-amber-700' : 'text-emerald-700'}`}>
          {isBreak ? 'استراحة مؤقتة' : 'نشط الآن'} • عملت اليوم {formatMinutesArabic(work.todayMinutes)}
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {isBreak ? (
          <button onClick={work.backFromBreak} className="gradient-success text-white px-4 py-2 rounded-xl font-bold">عودة من الاستراحة</button>
        ) : (
          <button onClick={work.takeBreak} className="gradient-warning text-white px-4 py-2 rounded-xl font-bold">استراحة مؤقتة</button>
        )}
        <button onClick={work.endShift} className="gradient-danger text-white px-4 py-2 rounded-xl font-bold">إنهاء الدوام</button>
      </div>
    </div>
  )
}

function StaffHeader({ title, subtitle, icon: Icon, gradient, onLogout }) {
  return (
    <header className={`${gradient} shadow-2xl sticky top-0 z-40`}>
      <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm"><Icon className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-white font-black text-xl flex items-center gap-2">{title} <LiveBadge small /></h1>
            <p className="text-white/80 text-xs">{subtitle}</p>
          </div>
        </div>
        <button onClick={onLogout} className="bg-white/20 hover:bg-red-500/40 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition">
          <LogOut className="w-4 h-4" /> <span className="hidden sm:inline text-sm font-bold">خروج</span>
        </button>
      </div>
    </header>
  )
}

function Toast({ msg, gradient }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className={`px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-2 ${gradient} text-white`}>
        <Bell className="w-5 h-5" /> {msg}
      </div>
    </div>
  )
}

function StatusPill({ status }) {
  const cfg = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-sky-100 text-sky-700',
    cancelled: 'bg-red-100 text-red-700',
  }[status] || 'bg-slate-100 text-slate-700'
  const label = status === 'pending' ? 'قيد التأكيد' : status === 'confirmed' ? 'مؤكد' : status === 'completed' ? 'مكتمل' : status === 'cancelled' ? 'ملغي' : status
  return <span className={`${cfg} px-3 py-2 rounded-xl text-sm font-bold`}>{label}</span>
}

function EmptyAdminState({ icon: Icon, message }) {
  return (
    <div className="text-center py-10 text-slate-500">
      <Icon className="w-12 h-12 mx-auto mb-2 text-slate-300" />
      <p className="font-medium">{message}</p>
    </div>
  )
}


export default AccountantDashboard
