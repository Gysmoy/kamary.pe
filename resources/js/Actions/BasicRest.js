import { Fetch } from "sode-extend-react"
import { toast } from "sonner"
import xsrfToken from "../Utils/xsrfToken"

class BasicRest {
  path = null
  hasFiles = false
  controller = null
  showSavedMessage = true

  constructor() {
    this.controller = new AbortController()
  }

  simpleGet = async (url, params) => {
    try {
      const { status, result } = await Fetch(url, params);
      if (!status)
        throw new Error(
          result?.message || "Ocurrio un error inesperado"
        );
      return result.data ?? true;
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3000,
        richColors: true,
      });
      return null;
    }
  };

  simplePost = async (url, request) => {
    try {

      const { status, result } = await Fetch(url, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'Error al iniciar sesion')

      toast.success("Operacion correcta", {
        description: 'Se inicio sesion correctamente',
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
      return false
    }
  }

  get = async (id) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${id}`)
      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')
      return result.data
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3000,
        richColors: true,
      });
      return null
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
        'X-Xsrf-Token': xsrfToken()
      },
      body: JSON.stringify(params),
      signal
    })
    return await res.json()
  }

  save = async (request) => {
    try {
      let status = false
      let result = {}
      if (this.hasFiles) {
        const res = await fetch(`/api/${this.path}`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Xsrf-Token': xsrfToken()
          },
          body: request
        })
        status = res.ok
        result = JSON.parseable(await res.text())
      } else {
        const fetchRes = await Fetch(`/api/${this.path}`, {
          method: 'POST',
          body: JSON.stringify(request)
        })
        status = fetchRes.status
        result = fetchRes.result
      }

      if (!status) throw new Error(result?.message || result?.error || 'Ocurrio un error inesperado')

      this.showSavedMessage && toast.success("Correcto", {
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

  status = async ({ id, status }) => {
    try {
      const { status: fetchStatus, result } = await Fetch(`/api/${this.path}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ id, status })
      })
      if (!fetchStatus) throw new Error(result?.message ?? 'Ocurrio un error inesperado')

      toast.success("Correcto", {
        description: result.message,
        duration: 3000,
        richColors: true,
      });

      return true
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3000,
        richColors: true,
      });

      return false
    }
  }

  boolean = async ({ id, field, value }) => {
    try {
      const { status: fetchStatus, result } = await Fetch(`/api/${this.path}/boolean`, {
        method: 'PATCH',
        body: JSON.stringify({ id, field, value })
      })
      if (!fetchStatus) throw new Error(result?.message ?? 'Ocurrio un error inesperado')

      toast.success("Correcto", {
        description: result.message,
        duration: 3000,
        richColors: true,
      });

      return true
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3000,
        richColors: true,
      });

      return false
    }
  }

  delete = async (id) => {
    try {
      const { status: fetchStatus, result } = await Fetch(`/api/${this.path}/${id}`, {
        method: 'DELETE'
      })
      if (!fetchStatus) throw new Error(result?.message ?? 'Ocurrio un error inesperado')

      toast.success("Correcto", {
        description: result.message,
        duration: 3000,
        richColors: true,
      });

      return true
    } catch (error) {
      toast.error("Error", {
        description: error.message,
        duration: 3000,
        richColors: true,
      });

      return false
    }
  }
}

export default BasicRest
