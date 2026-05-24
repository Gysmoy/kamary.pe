import Tippy from '@tippyjs/react';
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { JSON } from 'sode-extend-react';
import 'tippy.js/dist/tippy.css';
import BaseAdminto from '../Components/Adminto/Base';
import InputFormGroup from '../Components/Adminto/form/InputFormGroup';
import CreateReactScript from '../Utils/CreateReactScript';
import { toast } from 'sonner';
import resizeImage from '../Utils/resizeImage';
import ProfileRest from '../Actions/Admin/profile-rest';
import xsrfToken from '../Utils/xsrfToken';

const profileRest = new ProfileRest()

const Profile = (props) => {
  const nameRef = useRef()
  const lastnameRef = useRef()

  const [session, setSession] = useState(props.session)

  const onFormSubmit = async (e) => {
    e.preventDefault();

    const request = {
      name: nameRef.current.value,
      lastname: lastnameRef.current.value,
    }

    const result = await profileRest.save(request)

    if (!result) return

    const newSession = structuredClone(session)
    newSession.name = request.name
    newSession.lastname = request.lastname
    newSession.birthdate = request.birthdate
    setSession(newSession)
  }

  const onProfileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const request = new FormData();
      request.append('thumbnail', await resizeImage(file, 100));
      request.append('full', await resizeImage(file, 1000));

      const res = await fetch('/api/admin/profile', {
        method: 'POST',
        headers: {
          'X-Xsrf-Token': xsrfToken()
        },
        body: request
      })
      const data = JSON.parseable(await res.text())
      if (!res.ok) throw new Error(data?.message ?? 'Ocurrio un error inesperado')

      const newSession = structuredClone(session)
      newSession.uuid = data.data.uuid
      setSession(newSession)

      toast.success("Correcto", { description: 'La imagen de perfil se actualizo correctamente' });
    } catch (error) {
      toast.error("Error", { description: error.message || "Ocurrió un error inesperado." });
    }
  }

  useEffect(() => {
    nameRef.current.value = session.name
    lastnameRef.current.value = session.lastname
  }, [null])

  return <div className='row justify-content-center align-items-center' style={{ height: 'calc(100vh - 135px)' }}>
    <div className='col-xl-3 col-lg-4 col-md-6 col-sm-8 col-xs-12'>
      <form className='card' onSubmit={onFormSubmit}>
        <div className='card-header'>
          <h4 className='card-title mb-0'>Perfil</h4>
        </div>
        <div className='card-body'>
          <Tippy content='Cambiar foto de perfil' arrow={true}>
            <label htmlFor='avatar' className='rounded-circle mx-auto d-block' style={{ cursor: 'pointer', width: 'max-content' }}>
              <input className='d-none' type='file' name='avatar' id='avatar' accept='image/*' onChange={onProfileChange} />
              <img className='avatar-xl rounded-circle' src={`/api/admin/profile/${session.uuid}?v=${crypto.randomUUID()}`} alt={`Perfil de ${session.name} ${session.lastname}`} style={{ objectFit: 'cover', objectPosition: 'center' }} />
            </label>
          </Tippy>
          <hr className='mt-3 mb-2' />
          <InputFormGroup eRef={nameRef} label='Nombres' required />
          <InputFormGroup eRef={lastnameRef} label='Apellidos' required />
          <div className='text-center'>
            <button className='btn btn-primary btn-block' type='submit'>
              <i className='fa fa-save'></i> Actualizar
            </button>
          </div>
          <hr className='mt-3 mb-2' />
          <p className='card-text text-center'>
            <small className='text-muted'>Ultima actualizacion {moment(session.updated_at).fromNow()}</small>
          </p>
        </div>
      </form>
    </div>
  </div>
}

CreateReactScript((el, properties) => {
  createRoot(el).render(<BaseAdminto {...properties} title='Perfil de usuario' >
    <Profile {...properties} />
  </BaseAdminto>);
})
