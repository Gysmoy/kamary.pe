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
import FormatsRest from '../../Actions/Admin/Magistrales/FormatsRest';
import renderGridEditLink from '../../Utils/renderGridEditLink';

const formatsRest = new FormatsRest()

const Formats = ({ moduleTitle = 'Magistrales - Formatos' }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const descriptionRef = useRef()
  const quantityRef = useRef()
  const statusRef = useRef()
  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    descriptionRef.current.value = data?.description ?? ''
    quantityRef.current.value = data?.quantity ?? 0
    statusRef.current.checked = data?.status !== false && data?.status !== 0
    $(modalRef.current).modal('show')
  }

  const onSave = async (e) => {
    e.preventDefault()
    const result = await formatsRest.save({
      id: idRef.current.value || undefined,
      description: descriptionRef.current.value.trim(),
      quantity: quantityRef.current.value,
      status: statusRef.current.checked,
    })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onStatusChange = async ({ id, status }) => {
    const result = await formatsRest.status({ id, status })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar formato', text: 'Se dara de baja el formato magistral.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await formatsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return <>
    <Table
      gridRef={gridRef}
      title={moduleTitle}
      rest={formatsRest}
      pageSize={25}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => onModalOpen() } })
      }}
      columns={[
        {
          caption: 'Acciones',
          width: 120,
          allowFiltering: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({ className: 'btn btn-xs btn-soft-primary', title: 'Editar', icon: 'mdi mdi-pencil', onClick: () => onModalOpen(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-delete', onClick: () => onDelete(data.id) }))
          }
        },
        {
          dataField: 'description',
          caption: 'Descripcion',
          minWidth: 240,
          cellTemplate: (container, { data }) => renderGridEditLink(container, data?.description, () => onModalOpen(data), 'Editar formato')
        },
        { dataField: 'quantity', caption: 'Cantidad', dataType: 'number', width: 120, format: { type: 'fixedPoint', precision: 3 } },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          width: 95,
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) return
            ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => onStatusChange(data)} />)
          }
        },
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar formato magistral' : 'Agregar formato magistral'} size='md' onSubmit={onSave} btnSubmitText='Registrar'>
      <div className='row'>
        <input ref={idRef} hidden />
        <div className='col-md-8 mb-3'><label className='form-label'>Descripcion</label><input ref={descriptionRef} className='form-control' required /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Cantidad</label><input ref={quantityRef} type='number' step='0.001' className='form-control' /></div>
        <div className='col-md-4 mb-3 form-check'><input ref={statusRef} type='checkbox' className='form-check-input' id='magFormatStatus' /><label className='form-check-label' htmlFor='magFormatStatus'>Estado</label></div>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'magistrales-formats'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Magistrales - Formatos'}><Formats {...properties} /></BaseAdminto>)
})
