import React, { useRef, useState } from 'react';
import { Mail, User, MessageSquare, ArrowUpRight } from 'lucide-react';
import MessagesRest from '../../Actions/MessagesRest';
import Swal from 'sweetalert2';

const messagesRest = new MessagesRest()

const ContactForm = ({ }) => {

  const nameRef = useRef()
  const emailRef = useRef()
  const subjectRef = useRef()
  const descriptionRef = useRef()

  const [sending, setSending] = useState(false);

  const onMessageSubmit = async (e) => {
    e.preventDefault()
    setSending(true)

    const request = {
      name: nameRef.current.value,
      email: emailRef.current.value,
      subject: subjectRef.current.value,
      description: descriptionRef.current.value
    }

    const result = await messagesRest.save(request);
    setSending(false)

    if (!result) return

    Swal.fire({
      icon: 'success',
      title: 'Mensaje enviado',
      text: 'Tu mensaje ha sido enviado correctamente. ¡Nos pondremos en contacto contigo pronto!',
      showConfirmButton: false,
      timer: 3000
    })

    nameRef.current.value = null
    emailRef.current.value = null
    subjectRef.current.value = null
    descriptionRef.current.value = null
  }

  return (
    <form className="w-full bg-slate-100 " onSubmit={onMessageSubmit}>
      <div className="w-full max-w-[1280px] p-[5%] mx-auto">
        <h2 className="text-2xl font-medium text-[#2B384F] mb-4">
          Pregúntanos cualquier cosa aquí
        </h2>
        <div className="flex flex-col space-y-6 text-sm text-[#2E405E]" >
          <div className="flex flex-col md:flex-row gap-6 w-full">
            <div className="flex items-center bg-white rounded w-full">
              <User className="ml-3 text-gray-400" size={20} />
              <input
                ref={nameRef}
                type="text"
                placeholder="Nombre completo"
                className="flex-grow p-4 outline-none w-full"
                disabled={sending}
                required
              />
            </div>
            <div className="flex items-center bg-white rounded w-full">
              <Mail className="ml-3 text-gray-400" size={20} />
              <input
                ref={emailRef}
                type="email"
                placeholder="Correo electrónico"
                className="flex-grow p-4 outline-none w-full"
                disabled={sending}
                required
              />
            </div>
          </div>
          <div className="flex items-center bg-white rounded w-full">
            <MessageSquare className="ml-3 text-gray-400" size={20} />
            <input
              ref={subjectRef}
              type="text"
              placeholder="Asunto"
              className="flex-grow p-4 outline-none w-full"
              disabled={sending}
              required
            />
          </div>
          <div className="flex items-start bg-white rounded w-full">
            <MessageSquare className="ml-3 mt-3 text-gray-400" size={20} />
            <textarea
              ref={descriptionRef}
              placeholder="Mensaje"
              className="flex-grow p-4 outline-none w-full min-h-[100px]"
              style={{ fieldSizing: 'content' }}
              disabled={sending}
              required
            />
          </div>
        </div>
        <button className="flex items-center justify-center gap-2 mt-8 px-6 py-4 text-base font-medium text-white uppercase rounded-full bg-[#2E405E] hover:bg-[#3A516E] transition-colors duration-300 w-max disabled:cursor-not-allowed disabled:opacity-50" disabled={sending}>
          <span>enviar mensaje</span>
          <ArrowUpRight size={20} />
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
