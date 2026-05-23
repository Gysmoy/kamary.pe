import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import BaseAdminto from '@Adminto/Base'
import CreateReactScript from '../Utils/CreateReactScript'
import Table from '../Components/Adminto/Table'
import Modal from '../Components/Adminto/Modal'
import DxButton from '../Components/dx/DxButton'
import InputFormGroup from '@Adminto/form/InputFormGroup'
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup'
import BusinessesRest from '../Actions/Admin/BusinessesRest'
import renderGridEditLink from '../Utils/renderGridEditLink'

const businessesRest = new BusinessesRest()

const formatAuditUser = (user) => {
  if (!user) return ''
  const firstName = (user.name ?? '').toString().trim().split(' ')[0] ?? ''
  const firstLastname = (user.lastname ?? '').toString().trim().split(' ')[0] ?? ''
  const full = `${firstName} ${firstLastname}`.trim()
  const username = (user.username ?? '').toString().trim()
  if (full && username) return `${full} (@${username})`
  if (full) return full
  if (username) return `@${username}`
  return ''
}

const Businesses = ({ can }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    nameRef.current.value = data?.name ?? ''
    descriptionRef.current.value = data?.description ?? ''
    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value.trim(),
      description: descriptionRef.current.value.trim(),
    }

    const result = await businessesRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  return <>
    <div className='alert alert-info border mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2'>
      <div>
        Estructura: Empresa &gt; Sedes &gt; Almacenes.
        {' '}La configuracion fiscal, sedes, series y certificados se gestionan en Sedes y facturacion.
        {can('services-billing') || can('businesses')
          ? <> Los almacenes se gestionan en <b>Configuraciones &gt; Estructura operativa &gt; Almacenes</b>.</>
          : null}
      </div>
      {(can('services-billing') || can('businesses')) && (
        <a href='/admin/billing-settings' className='btn btn-sm btn-primary'>
          Gestionar sedes
        </a>
      )}
    </div>

    <Table
      gridRef={gridRef}
      title='Empresas'
      rest={businessesRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
          }
        })
      }}
      pageSize={25}
      columns={[
        {
          dataField: 'id',
          caption: 'ID',
          visible: false
        },
        {
          dataField: 'business_key',
          caption: 'Grupo',
          width: 130,
          cellTemplate: (container, { data }) => {
            const label = data.business_key === 'kamary_medicals' ? 'Kamary Medicals' : 'Kamary Peru'
            const color = data.business_key === 'kamary_medicals' ? 'success' : 'primary'
            container.html(`<span class="badge bg-${color}-subtle text-${color}">${label}</span>`)
          }
        },
        {
          dataField: 'name',
          caption: 'Nombre',
          minWidth: 220,
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.name, () => onModalOpen(data), 'Editar empresa')
        },
        {
          dataField: 'description',
          caption: 'Descripcion',
          minWidth: 280
        },
        {
          dataField: 'creator.fullname',
          caption: 'Creado por',
          visible: false,
          cellTemplate: (container, { data }) => {
            container.text(formatAuditUser(data.creator))
          }
        },
        {
          dataField: 'updater.fullname',
          caption: 'Actualizado por',
          visible: false,
          cellTemplate: (container, { data }) => {
            container.text(formatAuditUser(data.updater))
          }
        },
        {
          dataField: 'status',
          caption: 'Estado',
          width: '100px',
          cellTemplate: (container, { data }) => {
            $(container).empty()
            const status = data.status == 1 ? 'Activo' : 'Inactivo'
            const color = data.status == 1 ? 'success' : 'secondary'
            container.html(`<span class="badge bg-${color}-subtle text-${color}">${status}</span>`)
          }
        },
        {
          caption: 'Acciones',
          width: '90px',
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')

            container.append(DxButton({
              className: 'btn btn-xs btn-soft-primary',
              title: 'Editar',
              icon: 'mdi mdi-pencil',
              onClick: () => onModalOpen(data)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar empresa' : 'Agregar empresa'} onSubmit={onModalSubmit} size='md'>
      <input ref={idRef} type='hidden' />
      <div className='row'>
        <InputFormGroup eRef={nameRef} label='Nombre' col='col-12' required />
        <TextareaFormGroup eRef={descriptionRef} label='Descripcion' col='col-12' rows={3} />
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  if (!properties.can('businesses') && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title='Empresas'>
    <Businesses {...properties} />
  </BaseAdminto>)
})
