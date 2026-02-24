import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import InputFormGroup from '../Components/Adminto/form/InputFormGroup';
import ReactAppend from '../Utils/ReactAppend';
import DxButton from '../Components/dx/DxButton';
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import ImageFormGroup from '../Components/Adminto/form/ImageFormGroup';
import Swal from 'sweetalert2';
import ItemsRest from '../Actions/Admin/ItemsRest';

const itemsRest = new ItemsRest()

const Gifts = ({ }) => {
  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()
  const priceRef = useRef()
  const imageRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id ?? ''
    nameRef.current.value = data?.name ?? ''
    descriptionRef.current.value = data?.description ?? ''
    priceRef.current.value = data?.price ?? ''
    imageRef.image.src = `/api/items/media/${data?.image}`
    imageRef.current.value = null

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value,
      price: priceRef.current.value,
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

    const result = await itemsRest.save(formData)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onFeaturedChange = async ({ id, value }) => {
    const result = await itemsRest.boolean({ id, field: 'featured', value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onIsDefaultChange = async ({ id, value }) => {
    const result = await itemsRest.boolean({ id, field: 'is_default', value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onVisibleChange = async ({ id, value }) => {
    const result = await itemsRest.boolean({ id, field: 'visible', value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar item',
      text: '¿Estás seguro de eliminar este item?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await itemsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table gridRef={gridRef} title='Items' rest={itemsRest}
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
            text: 'Nuevo item',
            hint: 'Nuevo item',
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
          width: '50%',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <p className='mb-0' style={{ width: '100%' }}>
              <b className='d-block'>{data.name}</b>
              <small className='text-wrap text-muted' style={{
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
              }}>{data.description}</small>
            </p>)
          }
        },
        {
          dataField: 'price',
          caption: 'Precio',
          dataType: 'number',
          width: '100px',
          cellTemplate: (container, { data }) => {
            container.text(`S/.${Number(data.price).toFixed(2)}`)
          }
        },
        {
          dataField: 'image',
          caption: 'Imagen',
          width: '60px',
          allowFiltering: false,
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <img src={`/api/items/media/${data.image}`} style={{ width: '40px', aspectRatio: 3 / 4, objectFit: 'cover', objectPosition: 'center', borderRadius: '4px' }} onError={e => e.target.src = '/assets/img/routine/conditioner.png'} />)
          }
        },
        {
          dataField: 'is_default',
          caption: 'Preseleccionar',
          dataType: 'boolean',
          width: '120px',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <SwitchFormGroup checked={data.is_default} onChange={(e) => onIsDefaultChange({ id: data.id, value: e.target.checked })} />)
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
    <Modal modalRef={modalRef} title={isEditing ? 'Editar item' : 'Agregar item'} onSubmit={onModalSubmit} size='md'>
      <div className='row' id='principal-container'>
        <input ref={idRef} type='hidden' />
        <ImageFormGroup eRef={imageRef} label='Imagen' col='col-md-4' aspect={3 / 4} onError='/assets/img/routine/conditioner.png' />
        <div className="col-md-8">
          <InputFormGroup eRef={nameRef} label='Nombre' required />
          <InputFormGroup eRef={priceRef} label='Precio' type='number' step={0.01} required />
          <TextareaFormGroup eRef={descriptionRef} label='Resumen' rows={3} required />
        </div>
      </div>
    </Modal>
  </>
  )
}

CreateReactScript((el, properties) => {
  createRoot(el).render(<BaseAdminto {...properties} title='Gifts'>
    <Gifts {...properties} />
  </BaseAdminto>);
})