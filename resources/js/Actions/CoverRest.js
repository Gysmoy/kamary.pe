import { Cookies, Fetch, Notify } from "sode-extend-react"

class CoverRest {
  saveCover = async (file) => {
    try {
      const { full, thumbnail, type, ok } = await File.compress(file)

      if (!ok) throw new Error('Ocurrio un error al comprimir la portada. Intenta con otra.')

      const request = new FormData();
      request.append('thumbnail', await File.fromURL(`data:${type};base64,${thumbnail}`));
      request.append('full', await File.fromURL(`data:${type};base64,${full}`));

      const res = await fetch('/api/cover', {
        method: 'POST',
        headers: {
          'X-Xsrf-Token': decodeURIComponent(Cookies.get('XSRF-TOKEN'))
        },
        body: request
      })
      const data = JSON.parseable(await res.text())
      if (!res.ok) throw new Error(data?.message ?? 'Ocurrio un error inesperado')

      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Correcto',
        body: 'La imagen de portada se actualizo correctamente',
        type: 'success'
      })
      return data.data
    } catch (error) {
      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return false
    }
  }
}

export default CoverRest