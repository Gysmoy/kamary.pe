import { Fetch, Notify } from 'sode-extend-react';
import BasicRest from './BasicRest.js';

class UsersByServicesByBusinessesRest extends BasicRest {
  path = 'users-by-services-by-business'

  inviteUser = async (email, match) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}`, {
        method: 'POST',
        body: JSON.stringify({ email, match })
      })
      if (!status) throw new Error(result?.message || 'Ocurrio un error al agregar el usuario')
      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Correcto',
        body: result.message,
        type: 'success'
      })
      return true
    } catch (error) {
      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return false
    }
  }

  authorize = async (request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/authorize`, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'Ocurrio un error al abrir el servicio')
      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Correcto',
        body: result.message,
        type: 'success'
      })
      return true
    } catch (error) {
      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return false
    }
  }
}

export default UsersByServicesByBusinessesRest