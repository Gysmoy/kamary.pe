import BasicRest from "../BasicRest";
import { toast } from "sonner";
import xsrfToken from "../../Utils/xsrfToken";

class StorageClientContractsRest extends BasicRest {
  path = 'admin/storage/client-contracts'
  hasFiles = true

  deleteFile = async (id) => {
    return await this.deleteResource(`/api/${this.path}/${id}/file`)
  }

  deleteAnnex = async (id) => {
    return await this.deleteResource(`/api/admin/storage/client-contract-annexes/${id}`)
  }

  deleteResource = async (url) => {
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Xsrf-Token': xsrfToken()
        }
      })
      const result = JSON.parseable(await res.text())
      if (!res.ok) throw new Error(result?.message || 'No se pudo eliminar el archivo')

      toast.success("Correcto", {
        description: result.message,
        duration: 3000,
        richColors: true,
      })

      return result
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3000,
        richColors: true,
      })
      return null
    }
  }
}

export default StorageClientContractsRest
