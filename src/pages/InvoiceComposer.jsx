import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import LoadingScreen from '../components/LoadingScreen'
import { formatIndianCurrency, getTodayInputValue } from '../lib/format'
import { getMyProfile } from '../lib/profiles'
import { listRecentInvoices } from '../lib/invoices'

const GST_OPTIONS = [0, 5, 12, 18]

function createLineItem(id) {
  return { id, description: '', quantity: '1', rate: '' }
}

function toNumber(value) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function getDueDateDefault() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export default function InvoiceComposer() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [bootstrapping, setBootstrapping] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [invoiceCounter, setInvoiceCounter] = useState(0)
  const [recentInvoices, setRecentInvoices] = useState([])
  const [freelancerName, setFreelancerName] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [upiId, setUpiId] = useState('')
  const [dueDate, setDueDate] = useState(getDueDateDefault())
  const [issueDate] = useState(getTodayInputValue())
  const [gstRate, setGstRate] = useState(18)
  const [items, setItems] = useState([createLineItem(1)])

  useEffect(() => {
    let alive = true

    const hydrate = async () => {
      try {
        const invoiceDraft = location.state?.invoiceDraft
        const profile = await getMyProfile()
        if (!alive) return

        if (invoiceDraft) {
          setInvoiceCounter(invoiceDraft.invoiceCounter ?? 0)
          setFreelancerName(invoiceDraft.freelancerName || '')
          setClientName(invoiceDraft.clientName || '')
          setClientEmail(invoiceDraft.clientEmail || '')
          setUpiId(invoiceDraft.upiId || '')
          setDueDate(invoiceDraft.dueDate || getDueDateDefault())
          setGstRate(invoiceDraft.gstRate ?? 18)
          setItems(invoiceDraft.items?.length ? invoiceDraft.items : [createLineItem(1)])
        } else if (profile) {
          setInvoiceCounter(profile.invoice_counter ?? 0)
          setFreelancerName(
            profile.display_name || profile.business_name || profile.full_name || ''
          )
          setUpiId(profile.upi_id || '')
        }

        if (user?.id) {
          const recent = await listRecentInvoices(user.id)
          if (alive) {
            setRecentInvoices(recent)
          }
        }
      } catch {
        if (alive) {
          setError('We could not preload your saved profile details.')
        }
      } finally {
        if (alive) setBootstrapping(false)
      }
    }

    hydrate()
    return () => {
      alive = false
    }
  }, [location.state, user?.id])

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + toNumber(item.quantity) * toNumber(item.rate), 0),
    [items]
  )
  const gstAmount = useMemo(() => subtotal * (gstRate / 100), [subtotal, gstRate])
  const total = useMemo(() => subtotal + gstAmount, [subtotal, gstAmount])

  function updateItem(id, field, value) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
    setError('')
  }

  function addItem() {
    setItems((current) => [...current, createLineItem(Date.now())])
  }

  function removeItem(id) {
    setItems((current) =>
      current.length === 1 ? current : current.filter((item) => item.id !== id)
    )
  }

  function validate() {
    if (!freelancerName.trim()) return 'Enter your name.'
    if (!clientName.trim()) return 'Enter the client name.'
    if (!dueDate) return 'Select a due date.'
    if (items.some((item) => !item.description.trim())) return 'Add a description for every item.'
    if (items.some((item) => toNumber(item.quantity) <= 0)) return 'Quantity must be greater than zero.'
    if (items.some((item) => toNumber(item.rate) <= 0)) return 'Rate must be greater than zero.'
    return ''
  }

  async function handlePreview() {
    const validationMessage = validate()
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    setLoading(true)
    setError('')

    try {
      const { count, error: countError } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (countError) {
        throw countError
      }

      if ((count ?? 0) >= 5) {
        navigate('/app/paywall')
        return
      }

      navigate('/app/preview', {
        state: {
          invoice: {
            invoiceCounter,
            invoiceNumber: `INV-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(3, '0')}`,
            freelancerName,
            clientName,
            clientEmail,
            dueDate,
            issueDate,
            gstRate,
            upiId,
            items,
            subtotal,
            gstAmount,
            total,
          },
        },
      })
    } catch {
      setError('We could not prepare the preview right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
      navigate('/signin')
    } catch {
      navigate('/signin')
    }
  }

  if (bootstrapping) {
    return <LoadingScreen message="Preparing your invoice form..." />
  }

  return (
    <AppLayout
      title="New invoice"
      description="Keep it simple: fill the essentials, preview, and share."
      actions={<Button variant="secondary" onClick={handleSignOut}>Sign out</Button>}
    >
      <section className="simple-flow">
        <div className="panel simple-flow__header">
          <p className="eyebrow">60-second workflow</p>
          <div className="progress-strip progress-strip--compact">
            <div className="progress-step progress-step--active"><span>1</span><strong>Form</strong></div>
            <div className="progress-step"><span>2</span><strong>Preview</strong></div>
            <div className="progress-step"><span>3</span><strong>Share</strong></div>
          </div>
        </div>

        <div className="simple-flow__layout">
          <div className="panel simple-form-card">
            <div className="grid grid--two">
              <Field
                label="Your name"
                type="text"
                value={freelancerName}
                onChange={(event) => setFreelancerName(event.target.value)}
              />
              <Field
                label="Client name"
                type="text"
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
              />
              <Field
                label="Client email"
                type="email"
                value={clientEmail}
                onChange={(event) => setClientEmail(event.target.value)}
              />
              <Field
                label="UPI ID"
                type="text"
                value={upiId}
                onChange={(event) => setUpiId(event.target.value)}
              />
              <Field
                label="Due date"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>

            <div className="simple-form-card__section">
              <div className="section-row">
                <div>
                  <p className="eyebrow">Line items</p>
                  <h2 className="section-title">What are you billing for?</h2>
                </div>
                <Button variant="secondary" onClick={addItem}>Add item</Button>
              </div>

              <div className="simple-line-items">
                {items.map((item, index) => (
                  <div className="simple-line-item" key={item.id}>
                    <Field
                      label={`Item ${index + 1}`}
                      type="text"
                      value={item.description}
                      onChange={(event) => updateItem(item.id, 'description', event.target.value)}
                    />
                    <Field
                      label="Qty"
                      type="number"
                      min="0"
                      step="1"
                      value={item.quantity}
                      onChange={(event) => updateItem(item.id, 'quantity', event.target.value)}
                    />
                    <Field
                      label="Rate"
                      type="number"
                      min="0"
                      step="1"
                      value={item.rate}
                      onChange={(event) => updateItem(item.id, 'rate', event.target.value)}
                    />
                    <div className="simple-line-item__amount">
                      <span className="field__label">Amount</span>
                      <strong className="money-copy">
                        {formatIndianCurrency(toNumber(item.quantity) * toNumber(item.rate))}
                      </strong>
                      <Button
                        variant="secondary"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="panel simple-summary-card">
            <div>
              <p className="eyebrow">GST</p>
              <h2 className="section-title">Pick a rate</h2>
            </div>
            <div className="gst-pills">
              {GST_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`gst-pill ${gstRate === option ? 'gst-pill--active' : ''}`}
                  onClick={() => setGstRate(option)}
                >
                  {option}%
                </button>
              ))}
            </div>

            <div className="totals-card">
              <div>
                <span>Subtotal</span>
                <strong className="money-copy">{formatIndianCurrency(subtotal)}</strong>
              </div>
              {gstRate > 0 ? (
                <div>
                  <span>GST ({gstRate}%)</span>
                  <strong className="money-copy">{formatIndianCurrency(gstAmount)}</strong>
                </div>
              ) : null}
              <div className="totals-card__grand">
                <span>Total</span>
                <strong className="money-copy">{formatIndianCurrency(total)}</strong>
              </div>
            </div>

            {error ? <p className="alert alert--error">{error}</p> : null}

            <Button onClick={handlePreview} disabled={loading}>
              {loading ? 'Preparing preview...' : 'Preview invoice'}
            </Button>

            {recentInvoices.length ? (
              <div className="recent-invoices">
                <div>
                  <p className="eyebrow">Recent invoices</p>
                  <h3 className="section-title">Sent recently</h3>
                </div>
                <div className="recent-invoices__list">
                  {recentInvoices.map((invoice) => (
                    <div className="recent-invoice" key={invoice.id}>
                      <div>
                        <strong>{invoice.client_name}</strong>
                        <span>{invoice.invoice_number}</span>
                      </div>
                      <div className="recent-invoice__meta">
                        <strong className="money-copy">{formatIndianCurrency(invoice.total_amount)}</strong>
                        <span>{invoice.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </section>
    </AppLayout>
  )
}
