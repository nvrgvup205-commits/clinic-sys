// ═══════════════════════════════════════════════════════════
// 💓 أيقونة مع تأثير نبض - وقور وأنيق
// ═══════════════════════════════════════════════════════════

export default function PulseIcon({ 
  icon: Icon, 
  gradient = 'gradient-primary',
  size = 'md',
  pulseType = 'soft' // soft, ring, slow
}) {
  const sizes = {
    sm: { container: 'w-10 h-10', icon: 'w-5 h-5' },
    md: { container: 'w-12 h-12', icon: 'w-6 h-6' },
    lg: { container: 'w-14 h-14', icon: 'w-7 h-7' },
    xl: { container: 'w-16 h-16', icon: 'w-8 h-8' },
  }
  
  const s = sizes[size] || sizes.md
  
  const pulseClass = {
    soft: 'icon-pulse',
    ring: 'icon-pulse-ring',
    slow: 'icon-pulse-slow',
  }[pulseType] || 'icon-pulse'
  
  return (
    <div className={`${s.container} ${gradient} rounded-2xl flex items-center justify-center shadow-medium ${pulseClass}`}>
      <Icon className={`${s.icon} text-white`} />
    </div>
  )
}
