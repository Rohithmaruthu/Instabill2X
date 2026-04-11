import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/ui/Button'
import LoadingScreen from '../components/LoadingScreen'
import { formatIndianCurrency } from '../lib/format'
import { createInvoiceFromDraft } from '../lib/invoices'
import { useAuth } from '../hooks/useAuth'

function buildWhatsAppMessage(invoice) {
  const dueDate = new Date(invoice.due_date ?? invoice.dueDate).toLocaleDateString('en-IN')
  const amount = invoice.total_amount ?? invoice.total
  const clientName = invoice.client_name ?? invoice.clientName
  const freelancerName = invoice.freelancer_name ?? invoice.freelancerName
  const shareUrl = invoice.share_url

  return `Hi ${clientName}, here is your invoice for ${formatIndianCurrency(amount)}. Due by ${dueDate}.` +
    `${shareUrl ? ` ${shareUrl}` : ''} From: ${freelancerName}.`
}

export default function ShareScreen() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { user } = useAuth()
  const draftInvoice = state?.invoice
  const [saving, setSaving] = useState(true)
  const [error, setError] = useState('')
  const [savedInvoice, setSavedInvoice] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true

    const persistInvoice = async () => {
      if (!draftInvoice) {
        return
      }

      if (draftInvoice.id) {
        setSavedInvoice(draftInvoice)
        setSaving(false)
        return
      }

      try {
        const created = await createInvoiceFromDraft({ userId: user.id, draft: draftInvoice })
        if (!alive) return
        setSavedInvoice(created)
      } catch (persistError) {
        if (!alive) return
        setError(persistError.message || 'We could not save the invoice for sharing.')
      } finally {
        if (alive) {
          setSaving(false)
        }
      }
    }

    persistInvoice()

    return () => {
      alive = false
    }
  }, [draftInvoice, user.id])

  const shareMessage = useMemo(() => {
    if (!savedInvoice) return ''
    return buildWhatsAppMessage(savedInvoice)
  }, [savedInvoice])

  if (!draftInvoice) {
    return <Navigate to="/app/new" replace />
  }

  if (saving) {
    return <LoadingScreen message="Saving your invoice and preparing the share link..." />
  }

  function handleWhatsAppShare() {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleCopyLink() {
    if (!savedInvoice?.share_url) return

    try {
      await navigator.clipboard.writeText(savedInvoice.share_url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('We could not copy the link automatically. You can still select it manually below.')
    }
  }

  return (
    <AppLayout
      title="Share invoice"
      description="The simplest flow is still the best one: save it, send it, move on."
      actions={
        <Button
          variant="secondary"
          onClick={() => navigate('/app/preview', { state: { invoice: draftInvoice } })}
        >
          Back to preview
        </Button>
      }
    >
      <section className="simple-share">
        <div className="panel share-hero">
          <p className="eyebrow">Invoice ready</p>
          <h2 className="section-title">Send it now</h2>
          <p className="section-copy">
            This is the whole promise of the product: one clean link, one quick message, done.
          </p>
        </div>

        <div className="panel share-summary">
          <div><span>Client</span><strong>{savedInvoice?.client_name ?? draftInvoice.clientName}</strong></div>
          <div><span>Invoice number</span><strong>{savedInvoice?.invoice_number ?? draftInvoice.invoiceNumber}</strong></div>
          <div><span>Total</span><strong className="money-copy">{formatIndianCurrency(savedInvoice?.total_amount ?? draftInvoice.total)}</strong></div>
        </div>

        {savedInvoice?.share_url ? (
          <div className="panel share-link-card">
            <span>Share link</span>
            <strong>{savedInvoice.share_url}</strong>
          </div>
        ) : null}

        {error ? <p className="alert alert--error">{error}</p> : null}
        {copied ? <p className="alert alert--success">Share link copied.</p> : null}

        <div className="share-actions">
          <Button className="share-actions__primary" onClick={handleWhatsAppShare}>
            Share on WhatsApp
          </Button>
          <Button variant="secondary" onClick={handleCopyLink} disabled={!savedInvoice?.share_url}>
            Copy link
          </Button>
          <Button variant="secondary" onClick={() => navigate('/app/new')}>
            Create another invoice
          </Button>
        </div>
      </section>
    </AppLayout>
  )
}
