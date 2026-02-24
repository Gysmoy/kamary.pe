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
import ColorsRest from '../Actions/Admin/ColorsRest';

const colorsRest = new ColorsRest()

const Colors = ({ }) => {
  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const colorRef = useRef()
  const descriptionRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id ?? ''
    nameRef.current.value = data?.name ?? ''
    colorRef.current.value = data?.hex ?? '#fff'
    descriptionRef.current.value = data?.description ?? ''

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value,
      hex: colorRef.current.value,
      description: descriptionRef.current.value,
    }

    const result = await colorsRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onVisibleChange = async ({ id, value }) => {
    const result = await colorsRest.boolean({ id, field: 'visible', value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }


  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar color',
      text: '¿Estás seguro de eliminar este color?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await colorsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table gridRef={gridRef} title='Colores' rest={colorsRest}
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
            text: 'Nuevo color',
            hint: 'Nuevo color',
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
          dataField: 'item.name',
          caption: 'Item'
        },
        {
          dataField: 'name',
          caption: 'Color',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <p className='mb-0' style={{ width: '100%' }}>
              <b className='d-block'>
                <i className='mdi mdi-circle me-1' style={{ color: data.hex, textShadow: '0 0 2.5px rgba(0, 0, 0, .5)' }}></i>
                {data.name}
              </b>
            </p>)
          }
        },
        {
          dataField: 'image',
          caption: 'Imagen',
          width: '60px',
          allowFiltering: false,
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <img src={`/api/colors/media/${data.image}`} style={{ width: '40px', aspectRatio: 3 / 4, objectFit: 'cover', objectPosition: 'center', borderRadius: '4px' }} onError={e => e.target.src = '/assets/img/routine/conditioner.png'} />)
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
    <Modal modalRef={modalRef} title={isEditing ? 'Editar color' : 'Agregar color'} onSubmit={onModalSubmit} size='sm'>
      <div className='row' id='principal-container'>
        <input ref={idRef} type='hidden' />
        <InputFormGroup eRef={nameRef} label='Nombre' required />
        <InputFormGroup eRef={colorRef} label='Color' type='color' required />
        <TextareaFormGroup eRef={descriptionRef} label='Descripción' rows={3} />
      </div>
    </Modal>
  </>
  )
}

CreateReactScript((el, properties) => {
  createRoot(el).render(<BaseAdminto {...properties} title='Colores'>
    <Colors {...properties} />
  </BaseAdminto>);
})