import { createInertiaApp } from '@inertiajs/react'
import { Cookies, FetchParams } from 'sode-extend-react'
import Global from './Global';
import 'swiper/css'
import 'tippy.js/dist/tippy.css'
import LaravelSession from './LaravelSession';

const escapeHtml = (value) => `${value ?? ''}`.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
}[char]))

const showRenderError = (el, error) => {
  console.error(error)
  if (!el) return

  el.innerHTML = `
    <div class="container py-4">
      <div class="alert alert-danger">
        <h4 class="alert-heading">No se pudo cargar la pantalla</h4>
        <p class="mb-2">Revisa la consola del navegador o recompila los assets del panel.</p>
        <pre class="mb-0 small text-break">${escapeHtml(error?.message || error)}</pre>
      </div>
    </div>
  `
}

const CreateReactScript = (render) => {

  createInertiaApp({
    resolve: name => `/${name}.jsx`,
    setup: ({ el, props }) => {
      let isBooting = true
      const displayBootError = (error) => {
        if (isBooting) showRenderError(el, error)
      }
      window.setTimeout(() => {
        isBooting = false
      }, 5000)
      window.addEventListener('error', (event) => {
        displayBootError(event.error || event.message)
      }, { once: true })
      window.addEventListener('unhandledrejection', (event) => {
        displayBootError(event.reason)
      }, { once: true })

      try {
        const properties = props.initialPage.props
        if (properties?.global) {
          for (const name in properties.global) {
            Global.set(name, properties.global[name])
          }
        }

        const session = { ...properties?.session }
        for (const key in session) {
          LaravelSession.set(`${key}`, session[key])
        }

        const can = (page, ...keys) => {
          const keys2validate = []
          const pages = Array.isArray(page) ? page : [page]

          for (const p of pages) {
            if (!p) continue
            if (keys.length) keys2validate.push(...keys.map(x => `${p}.${x}`))
            else keys2validate.push(p)
          }

          if (properties?.session?.permissions?.find(x => keys2validate.includes(x.name) || x.name == 'general.root')) return true
          const roles = properties?.session?.roles ?? []
          for (const rol of roles) {
            if (rol?.permissions?.find(x => keys2validate.includes(x.name) || x.name == 'general.root')) return true
          }
          return false
        }

        const hasRole = (role) => {
          const roles = properties?.session?.roles ?? []
          return Boolean(roles.find(x => x.name == role))
        }

        FetchParams.call = () => ({
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Xsrf-Token': decodeURIComponent(Cookies.get('XSRF-TOKEN'))
          }
        })
        render(el, { ...properties, can, hasRole })

        if (Global.APP_ENV == 'local') {
          $('.modal-backdrop').each(function () {
            if (!$(this).text()) $(this).remove()
          })
        }

        if (Global.APP_ENV == 'production') {
          document.getElementById('app')?.removeAttribute('data-page')
        }
      } catch (error) {
        showRenderError(el, error)
      }
    },
  });
}

export default CreateReactScript
