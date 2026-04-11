import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/ui/Button'
import { formatIndianCurrency } from '../lib/format'

export default function Paywall() {
  const navigate = useNavigate()

  return (
    <AppLayout
      title="Upgrade to keep sending invoices"
      description="You have used the free allowance for now."
      actions={<Button variant="secondary" onClick={() => navigate('/app/new')}>Back to invoice form</Button>}
    >
      <section className="simple-share">
        <div className="panel share-hero">
          <p className="eyebrow">Free limit reached</p>
          <h2 className="section-title">Five invoices used</h2>
          <p className="section-copy">
            The upgrade path can stay simple too. We can wire Razorpay next, but the product
            messaging should stay direct and low-friction.
          </p>
        </div>

        <div className="panel paywall-card">
          <p className="paywall-card__price">{formatIndianCurrency(249)}<span>/month</span></p>
          <ul className="paywall-card__list">
            <li>Unlimited invoices</li>
            <li>Share flow in one tap</li>
            <li>UPI payment path on every invoice</li>
            <li>Invoice history and follow-up workflow</li>
          </ul>
          <Button disabled>Upgrade flow coming next</Button>
        </div>
      </section>
    </AppLayout>
  )
}
