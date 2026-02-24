import { Cookies, Fetch } from "sode-extend-react"
import { toast } from "sonner"

class ProfileRest {
  static save = async (request) => {
    try {
      const { status, result } = await Fetch('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(request)
      })

      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')

      toast.success(result.message)
      return true
    } catch (error) {
      toast.error(error.message)
      return false
    }
  }

  static saveProfile = async (file, square = true) => {
    try {
      const { full, thumbnail, type, ok } = await File.compress(file, { square })

      if (!ok) throw new Error('Ocurrio un error al comprimir la imagen. Intenta con otra.')

      const request = new FormData();
      request.append('thumbnail', await File.fromURL(`data:${type};base64,${thumbnail}`));
      request.append('full', await File.fromURL(`data:${type};base64,${full}`));

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'X-Xsrf-Token': decodeURIComponent(Cookies.get('XSRF-TOKEN'))
        },
        body: request
      })
      const data = JSON.parseable(await res.text())
      if (!res.ok) throw new Error(data?.message ?? 'Ocurrio un error inesperado')

      toast.success('La imagen de perfil se actualizo correctamente')
      return data.data
    } catch (error) {
      toast.error(error.message)
      return false
    }
  }
}

export default ProfileRest