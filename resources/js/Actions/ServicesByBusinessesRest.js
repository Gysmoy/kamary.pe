import { Fetch, Notify } from 'sode-extend-react';
import BasicRest from './BasicRest.js';

class ServicesByBusinessesRest extends BasicRest {
  path = 'services-by-business'

  byBusiness = async (business) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${business}`)
      if (!status) throw new Error(result?.message || 'Ocurrio un error al cargar los servicios vinculados a esta empresa')
      return result.data
    } catch (error) {
      console.error(error)
      return null
    }
  }

  enableService = async (business, service) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}`, {
        method: 'POST',
        body: JSON.stringify({ business, service })
      })
      if (!status) throw new Error(result?.message || 'Ocurrio un error al habilitar el servicio')
      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Correcto',
        body: result.message,
        type: 'success'
      })
      return result
    } catch (error) {
      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return null
    }
  }
}

export default ServicesByBusinessesRest