// ═══════════════════════════════════════════════════════════
// 🏥 شعار حلول - Logo
// ═══════════════════════════════════════════════════════════
import { Activity } from 'lucide-react'

export default function Logo({ size = 'md', showText = true, color = 'primary' }) {
  const sizes = {
    sm: { container: 'w-8 h-8', icon: 'w-5 h-5', text: 'text-lg' },
    md: { container: 'w-10 h-10', icon: 'w-6 h-6', text: 'text-xl' },
    lg: { container: 'w-14 h-14', icon: 'w-8 h-8', text: 'text-2xl' },
    xl: { container: 'w-20 h-20', icon: 'w-12 h-12', text: 'text-4xl' },
  }
  
  const s = sizes[size] || sizes.md
  
  return (
    <div className="flex items-center gap-3">
      <div className={`${s.container} gradient-primary rounded-2xl flex items-center justify-center shadow-medium icon-pulse-ring`}>
        <Activity className={`${s.icon} text-white`} />
      </div>
      {showText && (
        <div>
          <div className={`${s.text} font-black text-gradient-primary leading-tight`}>حُلول</div>
          <div className="text-[10px] text-slate-500 font-medium tracking-wide">SOLUTIONS</div>
        </div>
      )}
    </div>
  )
}
