export default function LiveBadge({ small = false }) {
  return (
    <div className={`inline-flex items-center gap-1.5 ${small ? 'px-2 py-0.5' : 'px-3 py-1'} bg-emerald-50 border border-emerald-200 rounded-full`}>
      <span className="live-dot"></span>
      <span className={`text-emerald-700 font-bold ${small ? 'text-xs' : 'text-sm'}`}>مباشر</span>
    </div>
  )
}
