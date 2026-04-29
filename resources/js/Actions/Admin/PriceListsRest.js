import BasicRest from "../BasicRest";

class PriceListsRest extends BasicRest {
  path = 'admin/price-lists'

  getBranchesByBusiness = async (businessId) => {
    if (!businessId) return []
    const result = await this.simpleGet(`/api/${this.path}/businesses/${businessId}/branches`)
    return result ?? []
  }
}

export default PriceListsRest
