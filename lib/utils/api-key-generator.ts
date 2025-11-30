// Generate a random API key
export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const segments = [8, 4, 4, 4, 12]

  return segments.map(length =>
    Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  ).join('_')
}

// Generate key preview (first 4 characters + stars)
export function generateKeyPreview(key: string): string {
  const firstSegment = key.split('_')[0]
  return `${firstSegment}_****_****_****_****`
}
