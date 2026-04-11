import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen'
import { formatIndianCurrency } from '../lib/format'
import { getSharedInvoice, markInvoiceOpened } from '../lib/invoices'

function buildUpiLink(invoice) {
  if (!invoice.freelancer_upi_id) return ''

  return `upi://pay?pa=${invoice.freelancer_upi_id}&pn=${encodeURIComponent(invoice.freelancer_name)}&am=${invoice.total_amount.toFixed(2)}&cu=INR`
}

export default function SharedInvoicePage() {
  const { token } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    const loadInvoice = async () => {
      try {
        const data = await getSharedInvoice(token)
        if (!alive) return
        setInvoice(data)
        void markInvoiceOpened(data)
      } catch {
        if (alive) {
          setError('Invoice not found or no longer available.')
        }
      } finally {
        if (alive) {
          setLoading(false)
        }
      }
    }

    loadInvoice()
    return () => {
      alive = false
    }
  }, [token])

  const upiLink = useMemo(() => (invoice ? buildUpiLink(invoice) : ''), [invoice])

  if (loading) {
    return <LoadingScreen message="Loading invoice..." />
  }

  if (error || !invoice) {
    return (
      <div className="shared-page">
        <div className="shared-shell">
          <div className="shared-card shared-card--centered">
            <p className="eyebrow">Invoice</p>
            <h1 className="shared-title">Unable to load invoice</h1>
            <p className="shared-copy">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="shared-page">
      <div className="shared-shell">
        <div className="shared-card">
          <div className="shared-card__header">
            <div>
              <p className="eyebrow">InstaBill</p>
              <h1 className="shared-title">Invoice</h1>
            </div>
            <div className="shared-meta">
              <span>{invoice.invoice_number}</span>
              <strong>Due {new Date(invoice.due_date).toLocaleDateString('en-IN')}</strong>
            </div>
          </div>

          <div className="shared-parties">
            <div>
              <span>From</span>
              <strong>{invoice.freelancer_name}</strong>
            </div>
            <div>
              <span>To</span>
              <strong>{invoice.client_name}</strong>
            </div>
          </div>

          <div className="shared-total-card">
            <span>Total payable</span>
            <strong>{formatIndianCurrency(invoice.total_amount)}</strong>
          </div>

          {invoice.line_items?.length ? (
            <div className="shared-line-items">
              {invoice.line_items.map((item) => (
                <div className="shared-line-item" key={item.id}>
                  <div>
                    <strong>{item.description}</strong>
                    <span>{item.quantity} x {formatIndianCurrency(item.rate)}</span>
                  </div>
                  <strong>{formatIndianCurrency(item.amount)}</strong>
                </div>
              ))}
            </div>
          ) : null}

          <div className="shared-breakdown">
            <div><span>Subtotal</span><strong>{formatIndianCurrency(invoice.subtotal)}</strong></div>
            {invoice.gst_rate > 0 ? (
              <div><span>GST ({invoice.gst_rate}%)</span><strong>{formatIndianCurrency(invoice.gst_amount)}</strong></div>
            ) : null}
          </div>

          <div className="shared-payment-card">
            <p className="eyebrow">Payment</p>
            <h2 className="section-title">Pay via UPI</h2>
            <p className="shared-copy">
              Use the UPI ID below to complete payment. Once the freelancer receives the transfer,
              they will mark the invoice as paid.
            </p>
            <div className="shared-upi">
              <span>UPI ID</span>
              <strong>{invoice.freelancer_upi_id || 'Not provided'}</strong>
            </div>
            {upiLink ? <a className="button button--primary" href={upiLink}>Pay via UPI</a> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
