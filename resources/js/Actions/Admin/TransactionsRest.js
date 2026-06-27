import BasicRest from "../BasicRest"

class TransactionsRest extends BasicRest {
  path = 'admin/transactions'

  generate = async (date) => await this.simpleGet(`/api/${this.path}/report/${date}`)

  createCategory = async (request) => await this.simplePost(`/api/${this.path}/categories`, request)
}

export default TransactionsRest