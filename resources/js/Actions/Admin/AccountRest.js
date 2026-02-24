import { Fetch, Notify } from "sode-extend-react"

class AccountRest {
  static email = async (request) => {
    try {
      const { status, result } = await Fetch('/api/admin/account/email', {
        method: 'PATCH',
        body: JSON.stringify(request)
      })

      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')

      Notify.add({
        // icon: '/images/icon.png',
        title: 'Correcto',
        body: result.message,
        type: 'success'
      })
      return true
    } catch (error) {
      Notify.add({
        // icon: '/images/icon.png',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return false
    }
  }

  static password = async (request) => {
    try {
      const { status, result } = await Fetch('/api/admin/account/password', {
        method: 'PATCH',
        body: JSON.stringify(request)
      })

      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')

      Notify.add({
        // icon: '/images/icon.png',
        title: 'Correcto',
        body: result.message,
        type: 'success'
      })
      return true
    } catch (error) {
      Notify.add({
        // icon: '/images/icon.png',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return false
    }
  }
}

export default AccountRest