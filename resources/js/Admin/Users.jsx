import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import ReactAppend from '../Utils/ReactAppend';
import DxButton from '../Components/dx/DxButton';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import { renderToString } from 'react-dom/server';
import UsersRest from '../Actions/Admin/UsersRest';
import PasswordFormGroup from '../Components/Adminto/form/PasswordFormGroup';
import { Clipboard } from 'sode-extend-react';
import { toast } from 'sonner';

const usersRest = new UsersRest()

const Users = ({ }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const passwordModalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const lastnameRef = useRef()
  const emailRef = useRef()
  const phoneRef = useRef()

  // Password form elements ref
  const passwordIdRef = useRef()
  const passwordRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.uuid) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.uuid ?? ''
    nameRef.current.value = data?.name ?? ''
    lastnameRef.current.value = data?.lastname ?? ''
    emailRef.current.value = data?.email ?? ''
    phoneRef.current.value = data?.phone ?? ''

    $(modalRef.current).modal('show')
  }

  const onPasswordModalOpen = (data) => {
    setIsEditing(true)

    passwordIdRef.current.value = data.uuid
    passwordRef.current.value = ''

    $(passwordModalRef.current).modal('show');
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value,
      lastname: lastnameRef.current.value,
      email: emailRef.current.value,
      phone: phoneRef.current.value,
    }

    const result = await usersRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await usersRest.boolean({ id, field, value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar usuario',
      text: '¿Estas seguro de eliminar a este usuario? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, banear',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await usersRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onPasswordModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: passwordIdRef.current.value,
      password: passwordRef.current.value,
    }

    const result = await usersRest.save(request)
    if (!result) return

    $(passwordModalRef.current).modal('hide')
  }

  return (<>
    <Table gridRef={gridRef} title='Usuarios' rest={usersRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
          }
        });
      }}
      columns={[
        {
          dataField: 'id',
          caption: 'ID',
          visible: false
        },
        {
          dataField: 'fullname',
          caption: 'Nombre completo',
        },
        {
          dataField: 'username',
          caption: 'Usuario',
          cellTemplate: (container, { data }) => {
            const verifiedIcon = data.verified
              ? '<i class="mdi mdi-check-decagram text-primary ms-1" title="Verificado"></i>'
              : '';
            container.html(`<span>${data.username || ''}</span>${verifiedIcon}`);
          }
        },
        {
          dataField: 'email',
          caption: 'Correo electronico',
        },
        {
          dataField: 'phone',
          caption: 'Celular',
        },
        {
          dataField: 'roles',
          caption: 'Roles',
          allowSorting: false,
          allowFiltering: false,
          cellTemplate: (container, { data }) => {
            if (data.roles && data.roles.length) {
              const badgesHtml = data.roles.map(r => `<span class="badge badge-soft-primary mr-1">${r.name}</span>`).join('')
              container.html(`<div class='d-flex gap-1'>${badgesHtml}</div>`)
            } else {
              container.html(renderToString(<i className='text-muted'>Sin roles</i>))
            }
          }
        },
        {
          dataField: 'billing',
          caption: 'Facturación',
          width: '120px',
          lookup: {
            dataSource: [
              { value: 'masterset', text: 'Masterset' },
              { value: 'seller', text: 'Vendedor' }
            ],
            valueExpr: 'value',
            displayExpr: 'text'
          },
          cellTemplate: (container, { text, data }) => {
            if (!data.roles || !data.roles.some(r => r.name === 'Seller')) return
            $(container).css({
              'padding': '0',
              'overflow': 'unset'
            });
            ReactAppend(container, <div class="dropdown" style={{ width: '120px', height: '42px' }}>
              <button class="btn btn-white dropdown-toggle w-100 p-1 text-start rounded-0 border-0 justify-content-between" type="button" data-bs-toggle="dropdown" aria-expanded="false"
                style={{ width: '120px', height: '42px' }}>
                {text}
              </button>
              <div class="dropdown-menu">
                <button class="dropdown-item"
                  onClick={() => onBooleanChange({ id: data.uuid, field: 'billing', value: 'masterset' })}
                  disabled={data.billing === 'masterset'}>
                  Masterset
                </button>
                <button class="dropdown-item"
                  onClick={() => onBooleanChange({ id: data.uuid, field: 'billing', value: 'seller' })}
                  disabled={data.billing === 'seller'}>
                  Vendedor
                </button>
              </div>
            </div>)
          }
        },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) {
              container.html(renderToString(<i className='text-muted'>Baneado</i>))
            } else {
              ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => onBooleanChange({
                id: data.uuid,
                field: 'status',
                value: !data.status
              })} />)
            }
          }
        },
        {
          caption: 'Acciones',
          width: '200px',
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            // Add onboarding link button if user is not a seller
            if (!data.roles || !data.roles.some(r => r.name === 'Seller')) {
              container.append(DxButton({
                className: 'btn btn-xs btn-soft-info',
                title: 'Generar link de Onboarding',
                icon: 'mdi mdi-link-variant',
                onClick: () => {
                  Clipboard.copy(`${location.origin}/onboarding/${data.uuid}`, () => {
                    toast.success("Correcto", {
                      description: `Enlace copiado correctamente`,
                      duration: 3000,
                      position: "top-right",
                      richColors: true,
                    });
                  })
                }
              }))
            }
            // Add verify/unverify button only for sellers
            if (data.roles && data.roles.some(r => r.name === 'Seller')) {
              container.append(DxButton({
                className: data.verified ? 'btn btn-xs btn-soft-warning' : 'btn btn-xs btn-soft-success',
                title: data.verified ? 'Anular verificación' : 'Verificar',
                icon: data.verified ? 'mdi mdi-close-circle' : 'mdi mdi-check-circle',
                onClick: () => onBooleanChange({
                  id: data.uuid,
                  field: 'verified',
                  value: !data.verified
                })
              }))
            }
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-primary',
              title: 'Editar',
              icon: 'mdi mdi-pencil',
              onClick: () => onModalOpen(data)
            }))
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger',
              title: 'Eliminar usuario',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.uuid)
            }))

          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar usuario' : 'Agregar usuario'} onSubmit={onModalSubmit} size='md'>
      <input ref={idRef} type='hidden' />
      <div className='row'>
        <InputFormGroup eRef={nameRef} label='Nombre' col='col-md-6' required />
        <InputFormGroup eRef={lastnameRef} label='Apellido' col='col-md-6' required />
        <InputFormGroup eRef={emailRef} label='Correo' required disabled />
        <InputFormGroup eRef={phoneRef} label='Celular' />
      </div>
    </Modal>

    <Modal modalRef={passwordModalRef} title='Cambio de contraseña' onSubmit={onPasswordModalSubmit} size='sm'>
      <input ref={passwordIdRef} type='hidden' />
      <PasswordFormGroup eRef={passwordRef} label='Contraseña nueva' />
    </Modal>
  </>
  )
}

CreateReactScript((el, properties) => {

  createRoot(el).render(<BaseAdminto {...properties} title='Usuarios'>
    <Users {...properties} />
  </BaseAdminto>);
})