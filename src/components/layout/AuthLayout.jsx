import AppLogo from '../AppLogo'

export default function AuthLayout({
  eyebrow,
  title,
  description,
  asideTitle,
  asideCopy,
  children,
  footer,
}) {
  return (
    <div className="screen auth-screen">
      <section className="auth-shell">
        <aside className="auth-aside panel">
          <AppLogo />
          <div className="auth-aside__content">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="hero-title">{asideTitle}</h1>
            <p className="hero-copy">{asideCopy}</p>
          </div>
          <div className="auth-aside__stats">
            <div className="metric-tile">
              <span>Time to invoice</span>
              <strong>Under 60 sec</strong>
            </div>
            <div className="metric-tile">
              <span>Primary payment path</span>
              <strong>UPI QR + WhatsApp</strong>
            </div>
          </div>
        </aside>

        <main className="auth-card panel">
          <div className="auth-card__header">
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="section-title">{title}</h2>
            <p className="section-copy">{description}</p>
          </div>
          {children}
          {footer ? <div className="auth-card__footer">{footer}</div> : null}
        </main>
      </section>
    </div>
  )
}
