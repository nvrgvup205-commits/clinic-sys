import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  User, Lock, Eye, EyeOff, Settings, Users, DollarSign,
  Stethoscope, ShieldCheck, Home
} from 'lucide-react'
import AdminPortal from './StaffAdminPortal'
import ReceptionPortal from './StaffReceptionPortal'
import AccountantPortal from './StaffAccountantPortal'
import DoctorPortal from './StaffDoctorPortal'

export default function StaffPortal() {
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
          setUser(s.user)
          setView(s.view)
        } catch (e) {}
      }
    }
    setClinicLoading(false)
  }

  const handleLogout = () => {
    if (clinic) localStorage.removeItem(`staff_session_${clinic.id}`)
    setUser(null)
    setView('login')
  }

  const handleLoginSuccess = (loggedUser, viewType) => {
    if (clinic) localStorage.setItem(`staff_session_${clinic.id}`, JSON.stringify({ user: loggedUser, view: viewType }))
    setUser(loggedUser)
    setView(viewType)
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
      <div className="min-h-screen flex items-center justify-center gradient-medical-dark p-4" dir="rtl">
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

      {view === 'admin' && <AdminPortal user={user} clinic={clinic} onLogout={handleLogout} setClinic={setClinic} />}
      {view === 'reception' && <ReceptionPortal user={user} clinic={clinic} onLogout={handleLogout} />}
      {view === 'accountant' && <AccountantPortal user={user} clinic={clinic} onLogout={handleLogout} />}
      {view === 'doctor' && <DoctorPortal user={user} clinic={clinic} onLogout={handleLogout} />}
    </div>
  )
}

function StaffLogin({ clinic, onSuccess }) {
  const [userType, setUserType] = useState('admin')
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const roleOptions = [
    { id: 'admin', label: 'أدمن', icon: Settings, activeClass: 'gradient-medical', enabled: true },
    { id: 'reception', label: 'استقبال', icon: Users, activeClass: 'gradient-warning', enabled: clinic.reception_enabled !== false },
    { id: 'accountant', label: 'محاسب', icon: DollarSign, activeClass: 'gradient-purple', enabled: clinic.accounting_enabled !== false },
    { id: 'doctor', label: 'دكتور', icon: Stethoscope, activeClass: 'gradient-success', enabled: clinic.doctor_portal_enabled !== false },
  ].filter(x => x.enabled)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (userType === 'reception' && clinic.reception_enabled === false) throw new Error('خدمة الاستقبال غير مفعّلة')
      if (userType === 'accountant' && clinic.accounting_enabled === false) throw new Error('خدمة الحسابات غير مفعّلة')
      if (userType === 'doctor' && clinic.doctor_portal_enabled === false) throw new Error('صفحة الطبيب غير مفعّلة')

      if (userType === 'doctor') {
        const { data } = await supabase.from('doctors').select('*')
          .eq('clinic_id', clinic.id).eq('username', credentials.username.trim())
          .eq('password', credentials.password).eq('is_active', true).limit(1)
        if (data?.length > 0) onSuccess(data[0], 'doctor')
        else setError('بيانات الدخول غير صحيحة')
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
        else setError('بيانات الدخول غير صحيحة أو الدور غير مفعّل')
      }
    } catch (err) {
      setError(err.message || 'صار خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 page-enter" dir="rtl">
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
            {roleOptions.map(t => (
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
                  placeholder="1111" required
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

            {error && <div className="bg-red-500/20 border-2 border-red-500/40 text-red-200 p-4 rounded-2xl text-sm font-bold animate-fade-in">❌ {error}</div>}

            <button type="submit" disabled={loading}
              className={`w-full py-4 text-white font-bold rounded-2xl btn-medical disabled:opacity-50 shadow-xl text-lg ${userType === 'doctor' ? 'gradient-success' : userType === 'reception' ? 'gradient-warning' : userType === 'accountant' ? 'gradient-purple' : 'gradient-medical'}`}>
              {loading ? 'جاري الدخول...' : 'دخول'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
