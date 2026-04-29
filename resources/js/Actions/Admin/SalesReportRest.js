import BasicRest from "../BasicRest";
import { Cookies, Fetch } from "sode-extend-react";
import { toast } from "sonner";

class SalesReportRest extends BasicRest {
  path = 'admin/sales-report'
  filters = {
    business_id: '',
    business_branch_id: '',
    warehouse_id: '',
    source_type: '',
    order_status: '',
    document_type: '',
    date_from: '',
    date_to: '',
  }

  setFilters = (filters = {}) => {
    this.filters = {
      ...this.filters,
      ...filters,
    }
  }

  paginate = async (params) => {
    this.controller.abort('Nothing')
    this.controller = new AbortController()
    const signal = this.controller.signal
    const res = await fetch(`/api/${this.path}/paginate`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Xsrf-Token': decodeURIComponent(Cookies.get('XSRF-TOKEN'))
      },
      body: JSON.stringify({ ...params, ...this.filters }),
      signal
    })
    return await res.json()
  }

  getBusinesses = async () => {
    try {
      const { status, result } = await Fetch('/api/admin/businesses/paginate', {
        method: 'POST',
        body: JSON.stringify({ isLoadingAll: true, take: 500, sort: [{ selector: 'name', desc: false }] })
      })
      if (!status) throw new Error(result?.message || 'No se pudieron cargar empresas')
      return result.data ?? []
    } catch (error) {
      toast.error("Error", { description: error.message, duration: 3000, richColors: true })
      return []
    }
  }

  getBranchesByBusiness = async (businessId) => businessId ? (await this.simpleGet(`/api/admin/businesses/${businessId}/branches`)) ?? [] : []
}

export default SalesReportRest
