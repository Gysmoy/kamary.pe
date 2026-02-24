import { Fetch, JSON } from "sode-extend-react";
import BasicRest from "./BasicRest";

class CouponsRest extends BasicRest {
  path = 'coupons'

  isFirst = async (email) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/is-first`, {
        method: 'POST',
        body: JSON.stringify({ email })
      })
      if (!status) throw new Error(result?.message ?? 'Ocurrio un error inesperado')

      return result.data
    } catch (error) {
      return null
    }
  }
}

export default CouponsRest