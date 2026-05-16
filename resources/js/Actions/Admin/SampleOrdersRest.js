import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";

const loadAll = async (path) => {
  try {
    const { status, result } = await Fetch(path, {
      method: 'POST',
      body: JSON.stringify({ take: 1000, skip: 0, isLoadingAll: true })
    })
    if (!status) throw new Error(result?.message || 'No se pudo cargar la lista')
    return result?.data ?? []
  } catch (error) {
    toast.error('Error', { description: error.message, duration: 3000, richColors: true })
    return []
  }
}

class SampleOrdersRest extends BasicRest {
  path = 'admin/sample-orders'

  getClients = async () => await loadAll('/api/admin/clients/paginate')
  getUsers = async () => await loadAll('/api/admin/users/paginate')
  getArticles = async () => await loadAll('/api/admin/articles/paginate')
}

export default SampleOrdersRest
