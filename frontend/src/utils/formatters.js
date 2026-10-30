export function formatDate(value) {
  if (!value) return ''
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}
