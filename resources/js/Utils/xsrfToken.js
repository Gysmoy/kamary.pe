const xsrfToken = () => {
  const token = rawCookieValue('XSRF-TOKEN')
  try {
    const decoded = decodeURIComponent(token)
    return safeHeaderValue(decoded) ? decoded : safeHeaderFallback(token)
  } catch {
    return safeHeaderFallback(token)
  }
}

const rawCookieValue = (name) => {
  if (typeof document === 'undefined') return ''

  const prefix = `${name}=`
  const cookies = document.cookie.split(';').map(cookie => cookie.trim()).reverse()
  const cookie = cookies.find(item => item.startsWith(prefix))
  return cookie ? cookie.slice(prefix.length) : ''
}

const safeHeaderValue = (value) => {
  for (let index = 0; index < value.length; index++) {
    if (value.charCodeAt(index) > 255) return false
  }
  return true
}

const safeHeaderFallback = (value) => safeHeaderValue(value) ? value : encodeURIComponent(value)

export default xsrfToken
