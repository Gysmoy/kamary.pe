import BasicRest from "../../BasicRest";
import { Fetch } from "sode-extend-react";
import { toast } from "sonner";

class MagistralesStage4Rest extends BasicRest {
  getList = async (path, sortSelector = 'name', take = 1000) => {
    try {
      const { status, result } = await Fetch(`/api/${path}/paginate`, {
        method: 'POST',
        body: JSON.stringify({
          isLoadingAll: true,
          take,
          sort: [{ selector: sortSelector, desc: false }]
        })
      })
      if (!status) throw new Error(result?.message || 'No se pudieron cargar datos')
      return result.data ?? []
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3000,
        richColors: true,
      })
      return []
    }
  }

  getArticles = () => this.getList('admin/magistrales/articles', 'name')
  getBusinesses = () => this.getList('admin/businesses', 'name')
  getWarehouses = () => this.getList('admin/warehouses', 'name')
  getResponsibles = () => this.getList('admin/magistrales/responsibles', 'name')
  getDoctors = () => this.getList('admin/magistrales/doctors', 'paternal_lastname')
  getFormats = () => this.getList('admin/magistrales/formats', 'description')
  getFormulas = () => this.getList('admin/magistrales/formulas', 'id')
}

export default MagistralesStage4Rest
