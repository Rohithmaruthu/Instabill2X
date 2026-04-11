create or replace function public.get_public_invoice(p_share_token text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', i.id,
    'invoice_number', i.invoice_number,
    'issue_date', i.issue_date,
    'due_date', i.due_date,
    'gst_rate', i.gst_rate,
    'subtotal', i.subtotal,
    'gst_amount', i.gst_amount,
    'total_amount', i.total_amount,
    'freelancer_name', i.freelancer_name,
    'freelancer_upi_id', i.freelancer_upi_id,
    'freelancer_gstin', i.freelancer_gstin,
    'client_name', i.client_name,
    'share_token', i.share_token,
    'share_url', i.share_url,
    'open_count', i.open_count,
    'first_opened_at', i.first_opened_at,
    'last_opened_at', i.last_opened_at,
    'status', i.status,
    'line_items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', li.id,
            'description', li.description,
            'quantity', li.quantity,
            'rate', li.rate,
            'amount', li.amount,
            'position', li.position
          )
          order by li.position asc
        )
        from public.line_items li
        where li.invoice_id = i.id
      ),
      '[]'::jsonb
    )
  )
  from public.invoices i
  where i.share_token = p_share_token
  limit 1
$$;

grant execute on function public.get_public_invoice(text) to anon, authenticated;

create or replace function public.record_invoice_open(p_share_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invoice public.invoices%rowtype;
  opened_at timestamptz := timezone('utc', now());
begin
  select *
  into target_invoice
  from public.invoices
  where share_token = p_share_token
  limit 1;

  if not found then
    return;
  end if;

  update public.invoices
  set
    open_count = coalesce(open_count, 0) + 1,
    first_opened_at = coalesce(first_opened_at, opened_at),
    last_opened_at = opened_at
  where id = target_invoice.id;

  insert into public.invoice_events (
    invoice_id,
    user_id,
    event_type,
    event_meta
  )
  values (
    target_invoice.id,
    null,
    'client_opened',
    jsonb_build_object('opened_at', opened_at)
  );
end;
$$;

grant execute on function public.record_invoice_open(text) to anon, authenticated;
