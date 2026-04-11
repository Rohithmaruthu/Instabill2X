import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/ui/Button'
import { formatIndianCurrency } from '../lib/format'

function buildUpiLink(invoice) {
  if (!invoice.upiId) return ''

  return `upi://pay?pa=${invoice.upiId}&pn=${encodeURIComponent(invoice.freelancerName)}&am=${invoice.total.toFixed(2)}&cu=INR`
}

export default function InvoicePreview() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const invoice = state?.invoice

  if (!invoice) {
    return <Navigate to="/app/new" replace />
  }

  return (
    <AppLayout
      title="Invoice preview"
      description="One quick check, then send it on WhatsApp."
      actions={
        <Button
          variant="secondary"
          onClick={() => navigate('/app/new', { state: { invoiceDraft: invoice } })}
        >
          Edit invoice
        </Button>
      }
    >
      <section className="simple-flow">
        <div className="panel simple-flow__header">
          <p className="eyebrow">60-second workflow</p>
          <div className="progress-strip progress-strip--compact">
            <div className="progress-step"><span>1</span><strong>Form</strong></div>
            <div className="progress-step progress-step--active"><span>2</span><strong>Preview</strong></div>
            <div className="progress-step"><span>3</span><strong>Share</strong></div>
          </div>
        </div>

        <div className="simple-flow__layout">
          <div className="panel invoice-preview-card">
            <div className="invoice-preview-card__header">
              <div>
                <p className="eyebrow">InstaBill</p>
                <h2 className="section-title">Tax invoice</h2>
              </div>
              <div className="invoice-meta">
                <span>Invoice number</span>
                <strong>{invoice.invoiceNumber}</strong>
                <span>Due date</span>
                <strong>{new Date(invoice.dueDate).toLocaleDateString('en-IN')}</strong>
              </div>
            </div>

            <div className="invoice-parties">
              <div>
                <span>From</span>
                <strong>{invoice.freelancerName}</strong>
              </div>
              <div>
                <span>To</span>
                <strong>{invoice.clientName}</strong>
              </div>
            </div>

            <div className="invoice-table">
              {invoice.items.map((item) => (
                <div className="invoice-table__row" key={item.id}>
                  <div>
                    <strong>{item.description}</strong>
                    <span>{item.quantity} x {formatIndianCurrency(Number(item.rate) || 0)}</span>
                  </div>
                  <strong className="money-copy">
                    {formatIndianCurrency((Number(item.quantity) || 0) * (Number(item.rate) || 0))}
                  </strong>
                </div>
              ))}
            </div>

            <div className="invoice-preview-card__totals">
              <div>
                <span>Subtotal</span>
                <strong className="money-copy">{formatIndianCurrency(invoice.subtotal)}</strong>
              </div>
              {invoice.gstRate > 0 ? (
                <div>
                  <span>GST ({invoice.gstRate}%)</span>
                  <strong className="money-copy">{formatIndianCurrency(invoice.gstAmount)}</strong>
                </div>
              ) : null}
              <div className="invoice-preview-card__grand">
                <span>Total</span>
                <strong className="money-copy">{formatIndianCurrency(invoice.total)}</strong>
              </div>
            </div>
          </div>

          <aside className="panel payment-card">
            <p className="eyebrow">Payment</p>
            <h2 className="section-title">UPI payment path</h2>
            <p className="section-copy">
              {invoice.upiId
                ? 'The invoice is ready to be paid through your UPI ID.'
                : 'Add a UPI ID in the form if you want the payment path included.'}
            </p>
            <div className="payment-card__upi">
              <span>UPI ID</span>
              <strong>{invoice.upiId || 'Not added yet'}</strong>
            </div>
            {invoice.upiId ? (
              <a className="button button--secondary" href={buildUpiLink(invoice)}>
                Open UPI payment link
              </a>
            ) : null}
            <Button onClick={() => navigate('/app/share', { state: { invoice } })}>
              Continue to share
            </Button>
          </aside>
        </div>
      </section>
    </AppLayout>
  )
}
