export default function AppLogo({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`}>
      <div className="brand__mark" aria-hidden="true">
        <span />
      </div>
      <div>
        <p className="brand__name">InstaBill</p>
        {!compact && <p className="brand__meta">GST invoice workflow for Indian freelancers</p>}
      </div>
    </div>
  )
}
