import AppLogo from './AppLogo'

export default function LoadingScreen({ message = 'Loading your workspace...' }) {
  return (
    <div className="screen screen--centered">
      <div className="loading-card">
        <AppLogo />
        <div className="loading-bar" aria-hidden="true">
          <span />
        </div>
        <p className="loading-copy">{message}</p>
      </div>
    </div>
  )
}
