import { Fetch, Notify } from "sode-extend-react"

class HomeRest {
  path = 'admin/home'

  // Dashboard comercial ya calculado para el periodo elegido, sin recargar la pagina.
  dashboard = async (filters = {}) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/dashboard`, {
        method: 'POST',
        body: JSON.stringify(filters),
      })
      if (!status) throw new Error(result?.message || 'No se pudo cargar el dashboard')
      return result?.data ?? null
    } catch (error) {
      Notify.add({ title: 'Error', body: error.message, type: 'danger' })
      return null
    }
  }

  getSales = async (type, filter) => {
    try {
      if (typeof filter == 'object') filter = `${filter.start}|${filter.end}`;
      const { status, result } = await Fetch(`/api/graph/sales/${type}/${filter}`)
      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')
      return result
    } catch (error) {
      Notify.add({
        // icon: '/images/icon.png',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return []
    }
  }
}

export default HomeRest