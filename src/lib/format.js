export function formatIndianCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function getTodayInputValue() {
  const today = new Date()
  const timezoneOffset = today.getTimezoneOffset() * 60 * 1000
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10)
}
