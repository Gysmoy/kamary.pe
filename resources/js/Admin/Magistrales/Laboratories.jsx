import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../../Utils/CreateReactScript';
import Table from '../../Components/Adminto/Table';
import Modal from '../../Components/Adminto/Modal';
import DxButton from '../../Components/dx/DxButton';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import LaboratoriesRest from '../../Actions/Admin/Magistrales/LaboratoriesRest';
import renderGridEditLink from '../../Utils/renderGridEditLink';
import setSwitchChecked from '../../Utils/setSwitchChecked';

const laboratoriesRest = new LaboratoriesRest()

const Laboratories = ({ moduleTitle = 'Magistrales - Laboratorio' }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const descriptionRef = useRef()
  const codeRef = useRef()
  const statusRef = useRef()
  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    descriptionRef.current.value = data?.description ?? ''
    codeRef.current.value = data?.code ?? ''
    setSwitchChecked(statusRef.current, data?.status !== false && data?.status !== 0)
    $(modalRef.current).modal('show')
  }

  const onSave = async (e) => {
    e.preventDefault()
    const result = await laboratoriesRest.save({
      id: idRef.current.value || undefined,
      description: descriptionRef.current.value.trim(),
      code: codeRef.current.value.trim(),
      status: statusRef.current.checked,
    })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar laboratorio magistral',
      text: 'Se dara de baja el laboratorio magistral.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await laboratoriesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return <>
    <Table
      gridRef={gridRef}
      title={moduleTitle}
      rest={laboratoriesRest}
      pageSize={10}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', hint: 'Refrescar tabla', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', hint: 'Agregar laboratorio', onClick: () => onModalOpen() } })
      }}
      columns={[
        {
          caption: 'Acciones',
          width: 95,
          allowFiltering: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => onModalOpen(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => onDelete(data.id) }))
          }
        },
        { dataField: 'id', caption: 'ID', width: 90 },
        {
          dataField: 'description',
          caption: 'Descripcion',
          minWidth: 260,
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.description, () => onModalOpen(data), 'Editar laboratorio')
        },
        { dataField: 'code', caption: 'Codigo', width: 180 },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          width: 120,
          cellTemplate: (container, { data }) => {
            const active = data.status !== false && data.status !== 0 && data.status !== null
            container.html(`<span class="badge ${active ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}">${active ? 'ACTIVO' : 'INACTIVO'}</span>`)
          }
        },
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar laboratorio magistral' : 'Agregar laboratorio magistral'} size='md' onSubmit={onSave} btnSubmitText='Registrar'>
      <input ref={idRef} hidden />
      <div className='row'>
        <div className='col-12 mb-3'>
          <label className='form-label'>Descripcion</label>
          <input ref={descriptionRef} className='form-control' required />
        </div>
        <div className='col-12 mb-3'>
          <label className='form-label'>Codigo</label>
          <input ref={codeRef} className='form-control' required />
        </div>
        <SwitchFormGroup eRef={statusRef} label='Estado' col='col-12' checked />
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'magistrales-laboratory'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Magistrales - Laboratorio'}><Laboratories {...properties} /></BaseAdminto>)
})
