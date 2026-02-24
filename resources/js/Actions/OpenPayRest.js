import { Fetch, JSON, Notify } from "sode-extend-react"

class OpenPayRest {
  static order = async (sale, details) => {
    try {
      const { status, result } = await Fetch(`/api/openpay/order`, {
        method: 'POST',
        body: JSON.stringify({ sale, details })
      })

      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')

      Notify.add({
        // icon: '/images/icon.png',
        title: 'Correcto',
        body: result.message,
        type: 'success'
      })
      return result
    } catch (error) {
      Notify.add({
        // icon: '/images/icon.png',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return null
    }
  }

  static token = async (request) => {
    try {
      const { status, result } = await Fetch(`/api/openpay/token`, {
        method: 'POST',
        body: JSON.stringify(request)
      })

      if (!status) {
        if (result?.message == 'REVIEW') return 'REVIEW'
        throw new Error(result?.message || 'Ocurrio un error inesperado')
      }

      Notify.add({
        // icon: '/images/icon.png',
        title: 'Correcto',
        body: result.message,
        type: 'success'
      })
      return result
    } catch (error) {
      Notify.add({
        // icon: '/images/icon.png',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return null
    }
  }
}

export default OpenPayRest