import BasicRest from "../../BasicRest";
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

class CategoriesRest extends BasicRest {
  path = 'admin/magistrales/categories'

  getWarehouses = async () => await loadAll('/api/admin/warehouses/paginate')

  getSubcategories = async (categoryId) => await this.simpleGet(`/api/${this.path}/${categoryId}/subcategories`)

  saveSubcategory = async (categoryId, request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${categoryId}/subcategories`, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'No se pudo guardar la subcategoria')
      toast.success('Correcto', { description: result.message, duration: 3000, richColors: true })
      return result.data ?? true
    } catch (error) {
      toast.error('Error', { description: error.message, duration: 3000, richColors: true })
      return null
    }
  }

  statusSubcategory = async (categoryId, request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${categoryId}/subcategories/status`, {
        method: 'PATCH',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'No se pudo cambiar el estado')
      toast.success('Correcto', { description: result.message, duration: 3000, richColors: true })
      return true
    } catch (error) {
      toast.error('Error', { description: error.message, duration: 3000, richColors: true })
      return false
    }
  }

  deleteSubcategory = async (categoryId, subcategoryId) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${categoryId}/subcategories/${subcategoryId}`, {
        method: 'DELETE'
      })
      if (!status) throw new Error(result?.message || 'No se pudo eliminar la subcategoria')
      toast.success('Correcto', { description: result.message, duration: 3000, richColors: true })
      return true
    } catch (error) {
      toast.error('Error', { description: error.message, duration: 3000, richColors: true })
      return false
    }
  }
}

export default CategoriesRest
