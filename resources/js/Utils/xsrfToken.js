import { Cookies } from "sode-extend-react"

const xsrfToken = () => {
  const token = Cookies.get('XSRF-TOKEN') || ''
  try {
    return decodeURIComponent(token)
  } catch {
    return token
  }
}

export default xsrfToken
