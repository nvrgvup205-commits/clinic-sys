import { Link } from 'react-router-dom'
import { Home, Activity } from 'lucide-react'
import Logo from '../components/Logo'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-pattern-subtle flex items-center justify-center p-4">
      <div className="bg-white border border-slate-100 rounded-3xl p-12 max-w-md w-full text-center shadow-large">
        <div className="inline-block mb-4 icon-pulse">
          <Logo size="xl" showText={false} />
        </div>
        <h1 className="text-7xl font-black text-gradient-primary mb-2">404</h1>
        <p className="text-slate-600 mb-8 text-lg font-medium">الصفحة غير موجودة</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <Home className="w-5 h-5" />
          <span>العودة للرئيسية</span>
        </Link>
      </div>
    </div>
  )
}
