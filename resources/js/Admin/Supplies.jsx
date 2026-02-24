import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import InputFormGroup from '../Components/Adminto/form/InputFormGroup';
import ReactAppend from '../Utils/ReactAppend';
import DxButton from '../Components/dx/DxButton';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import ImageFormGroup from '../Components/Adminto/form/ImageFormGroup';
import Swal from 'sweetalert2';
import SuppliesRest from '../Actions/Admin/SuppliesRest';

const suppliesRest = new SuppliesRest()

const Supplies = ({ }) => {
  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()
  const imageRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id ?? ''
    nameRef.current.value = data?.name ?? ''
    descriptionRef.current.value = data?.description ?? ''
    imageRef.image.src = `/api/supplies/media/${data?.image}`
    imageRef.current.value = null

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value,
      description: descriptionRef.current.value,
    }

    const formData = new FormData()
    for (const key in request) {
      formData.append(key, request[key])
    }
    const file = imageRef.current.files[0]
    if (file) {
      formData.append('image', file)
    }

    const result = await suppliesRest.save(formData)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onFeaturedChange = async ({ id, value }) => {
    const result = await suppliesRest.boolean({ id, field: 'featured', value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onVisibleChange = async ({ id, value }) => {
    const result = await suppliesRest.boolean({ id, field: 'visible', value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar ingrediente',
      text: '¿Estás seguro de eliminar este ingrediente?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await suppliesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table gridRef={gridRef} title='Ingredientes' rest={suppliesRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
          }
        });
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'plus',
            text: 'Nuevo ingrediente',
            hint: 'Nuevo ingrediente',
            onClick: () => onModalOpen()
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
          caption: 'Nombre',
        },
        {
          dataField: 'description',
          caption: 'Sirve para...',
        },
        {
          dataField: 'image',
          caption: 'Imagen',
          width: '60px',
          allowFiltering: false,
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <img src={`/api/supplies/media/${data.image}`} style={{ width: '40px', aspectRatio: 5 / 4, objectFit: 'cover', objectPosition: 'center', borderRadius: '4px' }} onError={e => e.target.src = '/assets/img/supplies/acido-salicilico.png'} />)
          }
        },
        {
          dataField: 'featured',
          caption: 'Destacado',
          dataType: 'boolean',
          width: '120px',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <SwitchFormGroup checked={data.featured} onChange={(e) => onFeaturedChange({ id: data.id, value: e.target.checked })} />)
          }
        },
        {
          dataField: 'visible',
          caption: 'Visible',
          dataType: 'boolean',
          width: '120px',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <SwitchFormGroup checked={data.visible} onChange={(e) => onVisibleChange({ id: data.id, value: e.target.checked })} />)
          }
        },
        {
          caption: 'Acciones',
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-primary',
              title: 'Editar',
              icon: 'fa fa-pen',
              onClick: () => onModalOpen(data)
            }))
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger',
              title: 'Eliminar',
              icon: 'fa fa-trash',
              onClick: () => onDeleteClicked(data.id)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar ingrediente' : 'Agregar ingrediente'} onSubmit={onModalSubmit} size='md'>
      <div className='row' id='principal-container'>
        <input ref={idRef} type='hidden' />
        <ImageFormGroup eRef={imageRef} label='Imagen' col='col-md-4' aspect={5 / 4} onError='/assets/img/supplies/acido-salicilico.png' />
        <div className="col-md-8">
          <InputFormGroup eRef={nameRef} label='Nombre' required />
          <InputFormGroup eRef={descriptionRef} label='Sirve para...' type='number' step={0.01} required />
        </div>
      </div>
    </Modal>
  </>
  )
}

CreateReactScript((el, properties) => {
  createRoot(el).render(<BaseAdminto {...properties} title='Ingredientes'>
    <Supplies {...properties} />
  </BaseAdminto>);
})