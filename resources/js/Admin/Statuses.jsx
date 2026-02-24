import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import { renderToString } from 'react-dom/server';
import StatusesRest from '../Actions/Admin/statuses-rest';
import TextareaFormGroup from '../Components/Adminto/form/TextareaFormGroup';

const statusesRest = new StatusesRest()

const Statuses = ({ }) => {
  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()
  const hexRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id ?? ''
    nameRef.current.value = data?.name ?? ''
    descriptionRef.current.value = data?.description ?? ''
    hexRef.current.value = data?.hex ?? ''

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value,
      description: descriptionRef.current.value,
      hex: hexRef.current.value,
    }

    const result = await statusesRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  return (<>
    <Table gridRef={gridRef} title='Estados' rest={statusesRest}
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
          dataField: 'name',
          caption: 'Estado',
        },
        {
          dataField: 'description',
          caption: 'Descripción',
        },
        {
          dataField: 'hex',
          caption: 'Color',
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(`<div style="width:20px;height:20px;background:${data.hex};border:1px solid #ccc;display:inline-block"></div>`)
          },
          width: '60px'
        },
        {
          caption: 'Acciones',
          width: '60px',
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({
              className: 'btn btn-sm btn-soft-primary',
              title: 'Editar',
              icon: 'mdi mdi-pen',
              onClick: () => onModalOpen(data)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar red social' : 'Agregar red social'} onSubmit={onModalSubmit} size='sm'>
      <input ref={idRef} type='hidden' />
      <InputFormGroup eRef={nameRef} label='Estado' required />
      <TextareaFormGroup eRef={descriptionRef} label='Descripcion' required />
      <InputFormGroup eRef={hexRef} label='Color' type='color' />
    </Modal>
  </>
  )
}

CreateReactScript((el, properties) => {

  createRoot(el).render(<BaseAdminto {...properties} title='Estados'>
    <Statuses {...properties} />
  </BaseAdminto>);
})