import React, { useEffect, useRef, useState } from 'react';
import ReactModal from 'react-modal';
import Swal from 'sweetalert2';
import ProfileRest from '../../Actions/Customer/ProfileRest';

ReactModal.setAppElement('#app');

const Information = ({ session }) => {

  const [modalOpen, setModalOpen] = useState(false)
  const [month, setMonth] = useState(session.birth_month ?? '01')
  const [days, setDays] = useState(31)

  const nameRef = useRef()
  const lastnameRef = useRef()
  const phoneRef = useRef()
  const addressRef = useRef()
  const addressNumberRef = useRef()
  const addressReferenceRef = useRef()
  const birthMonthRef = useRef()
  const birthDayRef = useRef()

  const onModalSubmit = async (e) => {
    e.preventDefault()
    const result = await ProfileRest.save({
      name: nameRef.current.value,
      lastname: lastnameRef.current.value,
      phone: phoneRef.current.value,
      address: addressRef.current.value,
      address_number: addressNumberRef.current.value,
      address_reference: addressReferenceRef.current.value
    })
    if (!result) return
    Swal.fire({
      title: 'Información actualizada',
      text: 'Tu información se ha actualizado correctamente.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    })
    location.reload()
  }

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modalOpen]);

  useEffect(() => {
    const nro = document.querySelector(`#birth-month option[value="${month}"]`)?.getAttribute('data-days')
    setDays(nro)
  }, [month])

  const arrayDays = []
  for (let index = 1; index <= days; index++) {
    arrayDays.push(String(index).padStart(2, '0'))
  }

  // useEffect(() => {
  //   birthDayRef.current.value = session.birth_day
  // }, [null])

  return <>
    <div>
      <h2 className='text-xl border-b pb-2 mb-4 font-bold'>
        Tu informacion personal
      </h2>
      <div className='flex flex-col gap-6 p-6 pb-10 mb-4 items-start relative border bg-[#F7F7E7] rounded-3xl'>
        <div>
          <b>Nombres y apellidos:</b>
          <p>{session.name} {session.lastname}</p>
        </div>
        <div>
          <b>Correo electronico:</b>
          <p>{session.email}</p>
        </div>
        <div>
          <b>Telefono:</b>
          <p>{session.phone || <i className='opacity-75'>- Sin telefono -</i>}</p>
        </div>
        <div>
          <b>Direccion:</b>
          <p>{session?.address || 'Sin direccion'} {session?.address_number || 'SN'}
            <small className='opacity-75 block -mt-1'>{session?.province ?? session?.district}, {session?.department}, {session?.country} {session?.zip_code && <>- {session?.zip_code}</>}</small></p>
        </div>

        <button
          className='absolute -bottom-4 bg-[#A191B8] text-sm text-white px-4 py-2 rounded-full'
          onClick={() => setModalOpen(true)}>
          <i className='mdi mdi-pencil'></i> EDITAR INFORMACION
        </button>
      </div>
    </div>

    <ReactModal isOpen={modalOpen}
      onRequestClose={() => setModalOpen(false)}
      className='absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-white p-10 rounded-2xl shadow-lg w-[95%] max-w-lg max-h-[95vh] overflow-y-auto'
      overlayClassName={'fixed inset-0 bg-black bg-opacity-50 z-50'}>
      <form onSubmit={onModalSubmit}>
        <div className="grid gap-6 mb-6 md:grid-cols-6">
          <div className='md:col-span-3'>
            <label htmlFor="first_name" className="block mb-2 text-sm font-medium text-gray-900">Nombres</label>
            <input ref={nameRef} type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#F7C2C6] focus:border-[#F7C2C6] block w-full p-2.5 outline-none" required
              defaultValue={session.name} />
          </div>
          <div className='md:col-span-3'>
            <label htmlFor="last_name" className="block mb-2 text-sm font-medium text-gray-900">
              Apellidos
            </label>
            <input ref={lastnameRef} type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#F7C2C6] focus:border-[#F7C2C6] block w-full p-2.5 outline-none" required
              defaultValue={session.lastname} />
          </div>
          <div className='md:col-span-6'>
            <label htmlFor="birthday" className="block mb-2 text-sm font-medium text-gray-900">
              Día de cumpleaños
            </label>
            <div className='grid gap-6 grid-cols-2'>
              <select ref={birthMonthRef} id='birth-month' className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#F7C2C6] focus:border-[#F7C2C6] block w-full p-2.5 outline-none" required
                onChange={(e) => setMonth(e.target.value)} defaultValue={month} value={month} >
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
              <select ref={birthDayRef} id='birth-day' className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#F7C2C6] focus:border-[#F7C2C6] block w-full p-2.5 outline-none' defaultValue={session.birth_day}>
                {
                  arrayDays.map((day) => {
                    return <option key={day} value={day}>{day}</option>
                  })
                }
              </select>
            </div>
          </div>
          <div className='col-span-6'>
            <label htmlFor="last_name" className="block mb-2 text-sm font-medium text-gray-900">
              Correo
            </label>
            <input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#F7C2C6] focus:border-[#F7C2C6] block w-full p-2.5 outline-none disabled:cursor-not-allowed disabled:bg-gray-100" required
              defaultValue={session.email} disabled />
          </div>
          <div className='md:col-span-3'>
            <label htmlFor="first_name" className="block mb-2 text-sm font-medium text-gray-900">
              Pais
            </label>
            <input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#F7C2C6] focus:border-[#F7C2C6] block w-full p-2.5 outline-none disabled:cursor-not-allowed disabled:bg-gray-100" required
              defaultValue='Perú' disabled />
          </div>
          <div className='md:col-span-3'>
            <label htmlFor="last_name" className="block mb-2 text-sm font-medium text-gray-900">
              Teléfono
            </label>
            <input ref={phoneRef} type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#F7C2C6] focus:border-[#F7C2C6] block w-full p-2.5 outline-none" required
              defaultValue={session.phone} />
          </div>
          <div className='md:col-span-2'>
            <label htmlFor="first_name" className="block mb-2 text-sm font-medium text-gray-900">
              Departamento
            </label>
            <input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#F7C2C6] focus:border-[#F7C2C6] block w-full p-2.5 outline-none disabled:cursor-not-allowed disabled:bg-gray-100" required
              defaultValue={session.department} disabled />
          </div>
          <div className='md:col-span-2'>
            <label htmlFor="last_name" className="block mb-2 text-sm font-medium text-gray-900">
              Provincia
            </label>
            <input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#F7C2C6] focus:border-[#F7C2C6] block w-full p-2.5 outline-none disabled:cursor-not-allowed disabled:bg-gray-100" required
              defaultValue={session.province} disabled />
          </div>
          <div className='md:col-span-2'>
            <label htmlFor="last_name" className="block mb-2 text-sm font-medium text-gray-900">
              Distrito
            </label>
            <input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#F7C2C6] focus:border-[#F7C2C6] block w-full p-2.5 outline-none disabled:cursor-not-allowed disabled:bg-gray-100" required
              defaultValue={session.district} disabled />
          </div>
          <div className='md:col-span-4'>
            <label htmlFor="last_name" className="block mb-2 text-sm font-medium text-gray-900">
              Dirección
            </label>
            <input ref={addressRef} type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#F7C2C6] focus:border-[#F7C2C6] block w-full p-2.5 outline-none disabled:cursor-not-allowed" required
              defaultValue={session.address} />
          </div>
          <div className='md:col-span-2'>
            <label htmlFor="last_name" className="block mb-2 text-sm font-medium text-gray-900">
              Número
            </label>
            <input ref={addressNumberRef} type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#F7C2C6] focus:border-[#F7C2C6] block w-full p-2.5 outline-none disabled:cursor-not-allowed" required
              defaultValue={session.address_number} />
          </div>
          <div className='col-span-6'>
            <label htmlFor="last_name" className="block mb-2 text-sm font-medium text-gray-900">
              Referencia
            </label>
            <input ref={addressReferenceRef} type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#F7C2C6] focus:border-[#F7C2C6] block w-full p-2.5 outline-none disabled:cursor-not-allowed" required
              defaultValue={session.address_reference} />
          </div>
        </div>
        <button className='bg-[#A191B8] text-sm text-white px-4 py-2 rounded-full'>
          <i className='fa fa-save me-2'></i>
          GUARDAR INFORMACIÓN
        </button>
      </form>
    </ReactModal>
  </>
}

export default Information;