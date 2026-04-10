export function Field({
  label,
  hint,
  error,
  multiline = false,
  className = '',
  ...props
}) {
  const Tag = multiline ? 'textarea' : 'input'

  return (
    <label className={`field ${className}`.trim()}>
      <span className="field__label">{label}</span>
      {hint ? <span className="field__hint">{hint}</span> : null}
      <Tag className="field__input" {...props} />
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  )
}
