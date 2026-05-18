import { createRoot } from 'react-dom/client'
import React, { useEffect, useRef, useState } from 'react'
import JSEncrypt from 'jsencrypt'
import CreateReactScript from './Utils/CreateReactScript'
import AuthRest from './actions/AuthRest'
import { Link } from '@inertiajs/react'
import Swal from 'sweetalert2'
import { GET } from 'sode-extend-react'
import Global from './Utils/Global'
import { Toaster } from 'sonner'

const Login = ({ token, APP_DOMAIN, APP_PROTOCOL }) => {

  document.title = `Login | ${Global.APP_NAME}`

  const jsEncrypt = new JSEncrypt()
  jsEncrypt.setPublicKey(Global.PUBLIC_RSA_KEY)

  // Estados
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const usernameRef = useRef()
  const passwordRef = useRef()
  const rememberRef = useRef()

  useEffect(() => {
    if (GET.message) Swal.fire({
      icon: 'info',
      title: 'Mensaje',
      text: GET.message,
      showConfirmButton: false,
      timer: 3000
    })
    if (GET.service) history.pushState(null, null, `/login?service=${GET.service}`)
    else history.pushState(null, null, '/login')
  }, [null])

  const onLoginSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    const username = usernameRef.current.value
    const password = passwordRef.current.value

    const request = {
      username: jsEncrypt.encrypt(username),
      password: jsEncrypt.encrypt(password)
    }
    const result = await AuthRest.login(request)

    if (!result) return setLoading(false)

    if (GET.service) location.href = `${APP_PROTOCOL}://${GET.service}.${APP_DOMAIN}/home`;
    else location.href = result.data?.redirect_url ?? result.redirect_url ?? '/admin/';
  }

  return (
    <>
      <h4 class="fw-semibold mb-3 fs-18">Inicia sesión en tu cuenta</h4>
      <form onSubmit={onLoginSubmit} class="text-start mb-3">
        <div class="mb-3">
          <label class="form-label" for="example-username">Correo o usuario</label>
          <input ref={usernameRef} type="text" id="example-username" name="example-username" class="form-control"
            placeholder="Nombre de usuario" disabled={loading} />
        </div>

        <div class="mb-3 position-relative">
          <label class="form-label" for="example-password">Contraseña</label>
          <input ref={passwordRef} type={showPassword ? 'text' : 'password'} id="example-password" class="form-control"
            placeholder="Ingrese su contraseña" disabled={loading} />
          <button className='btn btn-ghost-dark position-absolute right-1' type='button'
            onClick={() => setShowPassword(old => !old)}
            style={{
              paddingLeft: '8px',
              paddingRight: '8px',
              bottom: '4px',
              right: '4px'
            }}>
            <i className={showPassword ? 'ti ti-eye-off' : 'ti ti-eye'}></i>
          </button>
        </div>

        {/* <div class="d-flex justify-content-end mb-3">
          <div class="form-check">
            <input type="checkbox" class="form-check-input" id="checkbox-signin" />
            <label class="form-check-label" for="checkbox-signin">Remember me</label>
          </div>

          <a href="auth-recoverpw.html" class="text-muted border-bottom border-dashed">¿Olvidaste tu contraseña?</a>
        </div> */}

        <div class="d-grid">
          <button class="btn btn-primary fw-semibold" type="submit" disabled={loading}>Iniciar sesión</button>
        </div>
      </form>
      <Toaster />
    </>
  )
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<Login {...properties} />);
})
