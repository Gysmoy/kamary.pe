import React, { useRef, useState } from "react"

import bgHeader from './images/header.png'
import Swal from "sweetalert2"
import SubscriptionsRest from "../../Actions/SubscriptionsRest"
import Global from "../../Utils/Global"

const subscriptionsRest = new SubscriptionsRest()

const BlogHeader = ({ categories }) => {

  const emailRef = useRef()

  const [saving, setSaving] = useState()

  const onEmailSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const request = {
      email: emailRef.current.value
    }
    const result = await subscriptionsRest.save(request);
    setSaving(false)

    if (!result) return

    Swal.fire({
      title: '¡Éxito!',
      text: `Te has suscrito correctamente al blog de ${Global.APP_NAME}.`,
      icon: 'success',
      confirmButtonText: 'Ok'
    })

    emailRef.current.value = null
  }

  return <section className="grid md:grid-cols-2 items-center justify-between mt-16 bg-[#F5F7FA]">
    <img src={bgHeader} alt="" className="w-full h-full aspect-video md:aspect-[16/12] lg:aspect-video object-cover object-center" />
    <form className="p-[5%] w-full" onSubmit={onEmailSubmit}>
      <div className="w-full text-2xl lg:text-4xl font-medium text-pink-600">
        <span className="text-slate-700">Mantente siempre</span>{" "}
        <span className="font-bold text-pink-600">Informado</span>{" "}
        <span className="text-slate-700">con nuestra newsletter</span>
      </div>
      <div className="mt-10 w-full max-md:max-w-full">
        <div className="w-full max-md:max-w-full">
          <div className="w-full relative h-max">
            <input ref={emailRef} className="w-full py-2 px-4 text-slate-900 border-b-2 outline-none bg-transparent" placeholder="Correo electrónico" disabled={saving} />
            <button className="absolute right-0 top-1/2 -translate-y-1/2 text-pink-500"disabled={saving}>
              <span>Enviar</span>
              <i className="mdi mdi-arrow-top-right ms-1"></i>
            </button>
          </div>
        </div>
      </div>
      <div className="mt-10 text-base leading-6 text-slate-900 max-md:max-w-full">
        Suscríbete y sé el primero en enterarte de nuestras últimas publicaciones,
        consejos y novedades directamente en tu bandeja de entrada
      </div>
    </form>
  </section>
}

export default BlogHeader