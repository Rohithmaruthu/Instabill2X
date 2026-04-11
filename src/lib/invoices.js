import { supabase } from './supabase'

function normalizeLineItems(items) {
  return items.map((item, index) => ({
    position: index,
    description: item.description.trim(),
    quantity: Number.parseFloat(item.quantity) || 0,
    rate: Number.parseFloat(item.rate) || 0,
  }))
}

export async function createInvoiceFromDraft({ userId, draft }) {
  const normalizedItems = normalizeLineItems(draft.items)

  const invoicePayload = {
    user_id: userId,
    invoice_number: draft.invoiceNumber,
    issue_date: draft.issueDate,
    due_date: draft.dueDate,
    status: 'sent',
    kind: 'tax_invoice',
    gst_rate: draft.gstRate,
    subtotal: draft.subtotal,
    gst_amount: draft.gstAmount,
    total_amount: draft.total,
    sent_at: new Date().toISOString(),
    freelancer_name: draft.freelancerName,
    freelancer_upi_id: draft.upiId || null,
    freelancer_gstin: draft.gstin || null,
    client_name: draft.clientName,
    client_email: draft.clientEmail || null,
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert(invoicePayload)
    .select()
    .single()

  if (invoiceError) {
    throw new Error('We could not save this invoice right now.')
  }

  if (normalizedItems.length) {
    const { error: lineItemsError } = await supabase
      .from('line_items')
      .insert(
        normalizedItems.map((item) => ({
          invoice_id: invoice.id,
          user_id: userId,
          ...item,
        }))
      )

    if (lineItemsError) {
      throw new Error('The invoice was created, but the line items could not be saved.')
    }
  }

  await Promise.allSettled([
    supabase
      .from('profiles')
      .update({ invoice_counter: (draft.invoiceCounter ?? 0) + 1 })
      .eq('id', userId),
    supabase
      .from('subscriptions')
      .update({ invoice_count: (draft.invoiceCounter ?? 0) + 1 })
      .eq('user_id', userId),
    supabase
      .from('invoice_events')
      .insert({
        invoice_id: invoice.id,
        user_id: userId,
        event_type: 'invoice_sent',
        event_meta: {
          via: 'share_screen',
        },
      }),
  ])

  const shareUrl = `${window.location.origin}/inv/${invoice.share_token}`

  const { data: updatedInvoice } = await supabase
    .from('invoices')
    .update({ share_url: shareUrl })
    .eq('id', invoice.id)
    .select()
    .single()

  return updatedInvoice ?? { ...invoice, share_url: shareUrl }
}

export async function getSharedInvoice(shareToken) {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      issue_date,
      due_date,
      gst_rate,
      subtotal,
      gst_amount,
      total_amount,
      freelancer_name,
      freelancer_upi_id,
      freelancer_gstin,
      client_name,
      share_token,
      share_url,
      open_count,
      first_opened_at,
      last_opened_at,
      status
    `)
    .eq('share_token', shareToken)
    .single()

  if (error || !data) {
    throw new Error('Invoice not found')
  }

  return data
}

export async function markInvoiceOpened(invoice) {
  const nextOpenCount = (invoice.open_count ?? 0) + 1
  const now = new Date().toISOString()

  await Promise.allSettled([
    supabase
      .from('invoices')
      .update({
        open_count: nextOpenCount,
        first_opened_at: invoice.first_opened_at ?? now,
        last_opened_at: now,
      })
      .eq('id', invoice.id),
    supabase.from('invoice_events').insert({
      invoice_id: invoice.id,
      user_id: null,
      event_type: 'client_opened',
      event_meta: {
        opened_at: now,
      },
    }),
  ])
}
