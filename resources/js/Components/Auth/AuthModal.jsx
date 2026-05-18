import React, { useState, useRef } from 'react'
import JSEncrypt from 'jsencrypt'
import ReCAPTCHA from 'react-google-recaptcha'
import Swal from 'sweetalert2'
import Global from '../../Utils/Global'
import AuthRest from '../../actions/AuthRest'

const AuthModal = ({ isOpen, setIsOpen, onClose, recaptchaSiteKey, session, setSession }) => {
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [captchaValue, setCaptchaValue] = useState(null)
    const [month, setMonth] = useState('01')
    const [days, setDays] = useState(31)
    const [showVerification, setShowVerification] = useState(false)
    const [verificationCode, setVerificationCode] = useState('')
    const [tempEmail, setTempEmail] = useState('')

    // Login refs
    const loginEmailRef = useRef()
    const loginPasswordRef = useRef()

    // Register refs  
    const nameRef = useRef()
    const lastnameRef = useRef()
    const monthRef = useRef()
    const dayRef = useRef()
    const emailRef = useRef()
    const passwordRef = useRef()
    const confirmationRef = useRef()
    const notifyMeRef = useRef()

    const jsEncrypt = new JSEncrypt()
    jsEncrypt.setPublicKey(Global.PUBLIC_RSA_KEY)

    const onLoginSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        const request = {
            email: jsEncrypt.encrypt(loginEmailRef.current.value),
            password: jsEncrypt.encrypt(loginPasswordRef.current.value),
        }
        const result = await AuthRest.login(request)

        if (!result) return setLoading(false)
        setSession(result.data?.user ?? result.data)
        setIsOpen(false)
    }

    const onRegisterSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        const password = passwordRef.current.value
        const confirmation = confirmationRef.current.value

        if (password != confirmation) {
            setLoading(false)
            return Swal.fire({
                icon: 'warning',
                title: 'Error',
                text: 'Las contraseñas no coinciden',
                confirmButtonText: 'Ok'
            })
        }

        if (!captchaValue) {
            setLoading(false)
            return Swal.fire({
                icon: 'warning',
                title: 'Error',
                text: 'Por favor, complete el captcha',
                confirmButtonText: 'Ok'
            })
        }

        const request = {
            name: nameRef.current.value,
            lastname: lastnameRef.current.value,
            month: monthRef.current.value,
            day: dayRef.current.value,
            email: emailRef.current.value,
            password: jsEncrypt.encrypt(password),
            confirmation: jsEncrypt.encrypt(confirmation),
            captcha: captchaValue,
            notify_me: notifyMeRef.current.checked,
            type: 'direct'
        }

        const result = await AuthRest.signup(request)
        setLoading(false)
        if (!result) return

        setTempEmail(emailRef.current.value)
        setShowVerification(true)
    }

    const onVerifyCode = async (e) => {
        e.preventDefault()
        setLoading(true)

        const result = await AuthRest.verifyCode({
            email: tempEmail,
            code: verificationCode
        })

        setLoading(false)
        if (!result) return

        setSession(result.data)
        setIsOpen(false)
    }

    const arrayDays = []
    for (let index = 1; index <= days; index++) {
        arrayDays.push(String(index).padStart(2, '0'))
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
                <div className="p-6">
                    {showVerification ? (
                        <div>
                            <b className='mb-4 text-[#404040] text-xl block'>Verifica tu correo electrónico</b>
                            <p className="text-center text-sm mb-6">
                                Hemos enviado un código de verificación a <strong>{tempEmail}</strong>.
                                Por favor, revisa tu bandeja de entrada e ingresa el código a continuación.
                            </p>
                            <form onSubmit={onVerifyCode}>
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-md text-center text-2xl tracking-wider"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\s+/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2 items-center">
                                    <button
                                        type="submit"
                                        disabled={loading || verificationCode.length !== 6}
                                        className="w-max px-8 py-2 bg-[#A191B8] text-white rounded-full block disabled:opacity-50 mb-3"
                                    >
                                        {loading ? 'VERIFICANDO...' : 'VERIFICAR CÓDIGO'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowVerification(false)
                                            setVerificationCode('')
                                            setCaptchaValue(null)
                                            if (window.grecaptcha) {
                                                window.grecaptcha.reset()
                                            }
                                        }}
                                        className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        <i className="mdi mdi-arrow-left mr-1"></i>
                                        Volver a registrarse
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : <>
                    <div className="text-center mb-4">
                        <img src='/assets/img/logo-dark.svg' alt="" className="mx-auto h-10 mb-2" />
                        <b className='mb-4 text-[#404040] text-xl block'>¡Ahora puedes ser una Vuá lover!</b>
                        <ul className='flex flex-wrap justify-center gap-x-4 gap-y-0 text-sm'>
                            <li><i className='mdi mdi-circle-small'></i> Guarda tus fórmulas únicas</li>
                            <li><i className='mdi mdi-circle-small'></i> Beneficios en tu cumpleaños</li>
                            <li><i className='mdi mdi-circle-small'></i> Recibe las promos del mes primero</li>
                        </ul>
                    </div>
                        <div className="grid grid-cols-2 gap-1 p-1 border rounded-xl mb-4">
                            <button onClick={() => setIsLogin(true)}
                                className={`px-4 py-2 rounded-md transition ${isLogin ? 'bg-[#F1CACD] text-white' : 'text-[#404040]'}`}>
                                INICIA SESIÓN
                            </button>
                            <button onClick={() => setIsLogin(false)}
                                className={`px-4 py-2 rounded-md transition ${!isLogin ? 'bg-[#F1CACD] text-white' : 'text-[#404040]'}`}>
                                REGÍSTRATE
                            </button>
                        </div>

                        {isLogin ? (
                            <form onSubmit={onLoginSubmit}>
                                <div className="mb-3">
                                    <label className="block text-sm mb-1">Correo o Usuario</label>
                                    <input ref={loginEmailRef} type="email" className="w-full px-3 py-2 border rounded-md" required
                                        placeholder="Ingrese su correo o usuario" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm mb-1">Contraseña</label>
                                    <input ref={loginPasswordRef} type="password" className="w-full px-3 py-2 border rounded-md" required
                                        placeholder="Ingrese su contraseña" />
                                </div>
                                <button type="submit" disabled={loading}
                                    className="w-max mx-auto px-8 py-2 bg-[#A191B8] text-white rounded-full block">
                                    {loading ? 'VERIFICANDO...' : 'INGRESAR'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={onRegisterSubmit} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm mb-1">Nombres <span className="text-red-500">*</span></label>
                                        <input ref={nameRef} type="text" className="w-full px-3 py-2 border rounded-md" required
                                            placeholder="Ingrese su nombre" />
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1">Apellidos <span className="text-red-500">*</span></label>
                                        <input ref={lastnameRef} type="text" className="w-full px-3 py-2 border rounded-md" required
                                            placeholder="Ingrese sus apellidos" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm mb-1">Cumpleaños <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2">
                                        <div className="flex-none w-10 bg-gray-100 rounded-md flex items-center justify-center">
                                            <span className="mdi mdi-cake-variant"></span>
                                        </div>
                                        <select ref={monthRef} className="flex-1 px-3 py-2 border rounded-md"
                                            onChange={(e) => setMonth(e.target.value)} value={month}>
                                            <option value="01" data-days={31}>Enero</option>
                                            <option value="02" data-days={29}>Febrero</option>
                                            <option value="03" data-days={31}>Marzo</option>
                                            <option value="04" data-days={30}>Abril</option>
                                            <option value="05" data-days={31}>Mayo</option>
                                            <option value="06" data-days={30}>Junio</option>
                                            <option value="07" data-days={31}>Julio</option>
                                            <option value="08" data-days={31}>Agosto</option>
                                            <option value="09" data-days={30}>Septiembre</option>
                                            <option value="10" data-days={31}>Octubre</option>
                                            <option value="11" data-days={30}>Noviembre</option>
                                            <option value="12" data-days={31}>Diciembre</option>
                                        </select>
                                        <select ref={dayRef} className="flex-none w-24 px-3 py-2 border rounded-md">
                                            {arrayDays.map((day) => (
                                                <option key={day} value={day}>{day}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm mb-1">Correo electrónico <span className="text-red-500">*</span></label>
                                    <input ref={emailRef} type="email" className="w-full px-3 py-2 border rounded-md" required
                                        placeholder="Ingrese su correo electrónico" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm mb-1">Contraseña <span className="text-red-500">*</span></label>
                                        <input ref={passwordRef} type="password" className="w-full px-3 py-2 border rounded-md" required
                                            placeholder="Ingrese su contraseña" />
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1">Confirmación <span className="text-red-500">*</span></label>
                                        <input ref={confirmationRef} type="password" className="w-full px-3 py-2 border rounded-md" required
                                            placeholder="Confirme su contraseña" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input ref={notifyMeRef} type="checkbox" className="rounded border-gray-300" />
                                    <label className="text-sm">
                                        Quiero recibir ofertas exclusivas y novedades de vuá
                                    </label>
                                </div>

                                <div className="flex justify-center">
                                    <ReCAPTCHA sitekey={recaptchaSiteKey} onChange={setCaptchaValue} />
                                </div>

                                <button type="submit" disabled={loading}
                                    className="w-max mx-auto px-8 py-2 bg-[#A191B8] text-white rounded-full block">
                                    {loading ? 'VERIFICANDO...' : '¡SER VUÁ LOVER!'}
                                </button>
                            </form>
                        )}
                    </>
                    }

                    <button onClick={onClose}
                        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                        <span className="mdi mdi-close"></span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AuthModal
