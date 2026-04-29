import BasicRest from "../BasicRest";
import { Cookies } from "sode-extend-react";
import { toast } from "sonner";

class AccountsReceivableRest extends BasicRest {
  path = 'admin/accounts-receivable'

  registerPayment = async (id, request) => {
    try {
      const res = await fetch(`/api/${this.path}/${id}/payments`, {
        method: 'POST',
        headers: {
          'X-Xsrf-Token': decodeURIComponent(Cookies.get('XSRF-TOKEN'))
        },
        body: request
      })

      const result = JSON.parseable(await res.text())
      if (!res.ok) throw new Error(result?.message || 'Ocurrio un error inesperado')

      toast.success("Correcto", {
        description: result.message,
        duration: 3000,
        richColors: true,
      });

      return result
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3000,
        richColors: true,
      });
      return null
    }
  }
}

export default AccountsReceivableRest
