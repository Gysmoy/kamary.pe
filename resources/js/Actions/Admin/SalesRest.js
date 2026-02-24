import { Fetch, Notify } from "sode-extend-react";
import BasicRest from "../BasicRest";

class SalesRest extends BasicRest {
  path = 'admin/sales'

  getLast = (search) => this.simpleGet(`/api/${this.path}/search/${search}`)

  pos = async (request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/pos`, {
        method: 'POST',
        body: JSON.stringify(request)
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

  upsell = async (request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/upsell`, {
        method: 'POST',
        body: JSON.stringify(request)
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

  hardDelete = async (id) => {
    try {
      const { status: fetchStatus, result } = await Fetch(`/api/${this.path}/${id}/hard`, {
        method: 'DELETE'
      })
      if (!fetchStatus) throw new Error(result?.message ?? 'Ocurrio un error inesperado')

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

export default SalesRest