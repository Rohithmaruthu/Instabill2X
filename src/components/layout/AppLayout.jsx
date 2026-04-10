import AppLogo from '../AppLogo'

export default function AppLayout({ title, description, actions, children }) {
  return (
    <div className="screen app-screen">
      <header className="app-topbar panel">
        <AppLogo compact />
        <div className="app-topbar__content">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1 className="section-title">{title}</h1>
            {description ? <p className="section-copy">{description}</p> : null}
          </div>
          {actions ? <div className="app-topbar__actions">{actions}</div> : null}
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}
