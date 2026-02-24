import { Fetch, Notify } from "sode-extend-react"

class HomeRest {
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