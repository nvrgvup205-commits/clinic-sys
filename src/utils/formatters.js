// ═══════════════════════════════════════════════════════════
// 🕐 تحويل الوقت لصيغة عربية
// ═══════════════════════════════════════════════════════════
export const formatTime = (time) => {
  if (!time) return ''
  
  // إذا كان بصيغة HH:MM
  const parts = time.toString().substring(0, 5).split(':')
  let hours = parseInt(parts[0])
  const minutes = parts[1] || '00'
  
  let period = ''
  
  if (hours >= 0 && hours < 4) {
    period = 'ليلاً'
  } else if (hours >= 4 && hours < 12) {
    period = 'صباحاً'
  } else if (hours >= 12 && hours < 15) {
    period = 'ظهراً'
  } else if (hours >= 15 && hours < 18) {
    period = 'عصراً'
  } else if (hours >= 18 && hours < 22) {
    period = 'مساءً'
  } else {
    period = 'ليلاً'
  }
  
  // تحويل لصيغة 12 ساعة
  if (hours === 0) hours = 12
  else if (hours > 12) hours = hours - 12
  
  return `${hours}:${minutes} ${period}`
}

// ═══════════════════════════════════════════════════════════
// 💰 تنسيق العملة (ريال سعودي)
// ═══════════════════════════════════════════════════════════
export const formatCurrency = (amount, withSymbol = true) => {
  const num = parseFloat(amount) || 0
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
  return withSymbol ? `${formatted} ر.س` : formatted
}

// ═══════════════════════════════════════════════════════════
// 📅 تنسيق التاريخ
// ═══════════════════════════════════════════════════════════
export const formatDate = (date, format = 'long') => {
  if (!date) return ''
  
  const d = new Date(date)
  
  if (format === 'short') {
    return d.toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }
  
  if (format === 'long') {
    return d.toLocaleDateString('ar-EG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }
  
  if (format === 'numeric') {
    return d.toLocaleDateString('en-GB') // DD/MM/YYYY
  }
  
  return d.toLocaleDateString('ar-EG')
}

// ═══════════════════════════════════════════════════════════
// 📊 رقم بالنسبة المئوية
// ═══════════════════════════════════════════════════════════
export const formatPercent = (value, decimals = 0) => {
  return `${parseFloat(value || 0).toFixed(decimals)}%`
}

// ═══════════════════════════════════════════════════════════
// 🔢 عداد متحرك للأرقام (animation)
// ═══════════════════════════════════════════════════════════
export const animateNumber = (start, end, duration = 1000, callback) => {
  const startTime = performance.now()
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // Easing function (easeOutQuart)
    const eased = 1 - Math.pow(1 - progress, 4)
    
    const current = Math.floor(start + (end - start) * eased)
    callback(current)
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  
  requestAnimationFrame(animate)
}
