import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../../Utils/CreateReactScript';
import Table from '../../Components/Adminto/Table';
import Modal from '../../Components/Adminto/Modal';
import ReactAppend from '../../Utils/ReactAppend';
import DxButton from '../../Components/dx/DxButton';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import ResponsiblesRest from '../../Actions/Admin/Magistrales/ResponsiblesRest';

const rest = new ResponsiblesRest()

const Responsibles = ({ moduleTitle = 'Magistrales - Responsable' }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const documentRef = useRef()
  const nameRef = useRef()
  const [isEditing, setIsEditing] = useState(false)

  const openModal = (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    documentRef.current.value = data?.document_number ?? ''
    nameRef.current.value = data?.name ?? ''
    $(modalRef.current).modal('show')
  }

  const save = async (e) => {
    e.preventDefault()
    const result = await rest.save({
      id: idRef.current.value || undefined,
      document_number: documentRef.current.value.trim(),
      name: nameRef.current.value.trim(),
    })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const remove = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar responsable', text: 'Se dara de baja el responsable.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await rest.delete(id)
    if (result) $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return <>
    <Table
      gridRef={gridRef}
      title={moduleTitle}
      rest={rest}
      pageSize={25}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => openModal() } })
      }}
      columns={[
        { dataField: 'document_number', caption: 'Documento', width: 140 },
        { dataField: 'name', caption: 'Nombre', minWidth: 220 },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          width: 95,
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) return
            ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => rest.status(data).then(ok => ok && $(gridRef.current).dxDataGrid('instance').refresh())} />)
          }
        },
        {
          caption: 'Acciones',
          width: 120,
          allowFiltering: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => openModal(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => remove(data.id) }))
          }
        },
      ]}
    />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar responsable' : 'Agregar responsable'} onSubmit={save} size='md'>
      <div className='row'>
        <input ref={idRef} hidden />
        <div className='col-md-4 mb-3'><label className='form-label'>Documento</label><input ref={documentRef} className='form-control' required /></div>
        <div className='col-md-8 mb-3'><label className='form-label'>Nombre</label><input ref={nameRef} className='form-control' required /></div>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'magistrales-responsible'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Magistrales - Responsable'}><Responsibles {...properties} /></BaseAdminto>)
})
