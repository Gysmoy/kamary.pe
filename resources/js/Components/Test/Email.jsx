import React, { useRef, useState } from "react";
import Swal from "sweetalert2";
import UserFormulasRest from "../../Actions/UserFormulasRest";
import { Local } from "sode-extend-react";
import { useEffect } from "react";

const userFormulasRest = new UserFormulasRest()

const Email = ({ test, setTest, session }) => {

  const emailRef = useRef()
  const [sending, setSending] = useState(false);

  const onEmailSubmit = async (e) => {
    e?.preventDefault?.()

    if (sending) return

    const email = emailRef.current.value?.trim()
    if (!email) {
      return Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Por favor, ingresa tu correo electrónico'
      })
    }

    setSending(true)
    const result = await userFormulasRest.save({
      ...test,
      email: emailRef.current.value
    });
    setSending(false)

    if (!result) return
    Local.delete('vua_test')
    Local.delete('vua_cart')
    location.href = `/test/result/${result.data.id}`;
  }

  useEffect(() => {
    if (session) onEmailSubmit({ target: { value: session?.email } })
  }, [null])

  return <section className="p-[5%] py-[15%] md:py-[10%] lg:py-[5%] bg-white text-center text-[#404040]">
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl mb-4">¡Por último, para enviárte tu fórmula <br /> personalizada déjanos <b className="font-bold text-[#303030]">tu correo!</b></h1>
      {/* <p className="mb-4">y recibe 10% off con un código exclusivo para ti 🤫</p> */}
      <p className="mb-4">y entérate de nuestras novedades</p>
      <form className="relative" onSubmit={onEmailSubmit}>
        <input ref={emailRef} className="border text-center border-[#9577B9] text-[#9577B9] bg-white text-sm rounded-full w-full px-5 py-2.5 outline-none" type="email" placeholder="ESCRIBE AQUÍ" defaultValue={session?.email} required disabled={sending} />
        <button className="absolute top-1/2 -translate-y-1/2 right-3 w-6 h-6 bg-[#A191B8] text-white font-bold rounded-full" type="submit" disabled={sending}>
          <i className={`mdi ${sending ? 'mdi-loading mdi-spin' : 'mdi-arrow-right'}`}></i>
        </button>
      </form>
    </div>
  </section>
}

export default Email