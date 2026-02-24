import { Fetch, Notify } from "sode-extend-react";
import BasicRest from "../BasicRest";

class SaleStatusesRest extends BasicRest {
  path = 'admin/sale-statuses'

  bySale = async (saleId) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/by-sale/${saleId}`)
      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')
      return result.data
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

export default SaleStatusesRest