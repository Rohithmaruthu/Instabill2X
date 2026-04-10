import { Link } from 'react-router-dom'
import AppLogo from '../components/AppLogo'
import Button from '../components/ui/Button'
import { formatIndianCurrency } from '../lib/format'

const highlights = [
  'Client-ready GST invoices with a built-in UPI payment path',
  'A calmer workflow for freelancers who live in WhatsApp and UPI',
  'Designed to feel premium on mobile without feature bloat',
]

export default function Landing() {
  return (
    <div className="screen landing-screen">
      <header className="landing-nav">
        <AppLogo compact />
        <div className="landing-nav__actions">
          <Link className="text-link" to="/signin">
            Sign in
          </Link>
          <Link to="/signup">
            <Button>Get started</Button>
          </Link>
        </div>
      </header>

      <main className="landing-hero">
        <section className="landing-copy">
          <p className="eyebrow">Minimal billing for Indian freelancers</p>
          <h1 className="display-title">
            Send a beautiful GST invoice with a UPI payment path in under a minute.
          </h1>
          <p className="display-copy">
            InstaBill keeps the workflow focused: profile once, create fast, send a clean link,
            and get paid without chasing PDFs across chats.
          </p>

          <div className="landing-actions">
            <Link to="/signup">
              <Button className="landing-actions__primary">Start free</Button>
            </Link>
            <Link className="text-link text-link--large" to="/signin">
              I already have an account
            </Link>
          </div>

          <div className="landing-list">
            {highlights.map((item) => (
              <div className="landing-list__item" key={item}>
                <span />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="hero-card panel">
          <div className="hero-card__header">
            <p className="eyebrow">Preview</p>
            <p className="status-chip">READY TO SHARE</p>
          </div>

          <div className="invoice-preview">
            <div>
              <p className="invoice-preview__label">Invoice total</p>
              <p className="invoice-preview__amount">{formatIndianCurrency(48500)}</p>
            </div>
            <div className="invoice-preview__grid">
              <div>
                <span>Client</span>
                <strong>Acme Design Labs</strong>
              </div>
              <div>
                <span>Due date</span>
                <strong>18 Apr 2026</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>Sent on WhatsApp</strong>
              </div>
              <div>
                <span>Payment mode</span>
                <strong>UPI QR</strong>
              </div>
            </div>
          </div>

          <div className="hero-card__footer">
            <div>
              <span>Free plan</span>
              <strong>5 invoices included</strong>
            </div>
            <div>
              <span>Pro plan</span>
              <strong>{formatIndianCurrency(249)}/month</strong>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
