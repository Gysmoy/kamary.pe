import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import ReactAppend from '../Utils/ReactAppend';
import DxButton from '../Components/dx/DxButton';
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import SocialsRest from '../Actions/Admin/SocialsRest';
import SelectFormGroup from '@Adminto/form/SelectFormGroup';
import { renderToString } from 'react-dom/server';

const socialsRest = new SocialsRest()

const Socials = ({ icons }) => {
  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const iconRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()
  const linkRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id ?? ''
    $(iconRef.current).val(data?.icon ?? null);
    nameRef.current.value = data?.name ?? ''
    descriptionRef.current.value = data?.description ?? ''
    linkRef.current.value = data?.link ?? ''

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      icon: iconRef.current.value,
      name: nameRef.current.value,
      description: descriptionRef.current.value,
      link: linkRef.current.value,
    }

    const result = await socialsRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onVisibleChange = async ({ id, value }) => {
    const result = await socialsRest.boolean({ id, field: 'visible', value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar registro',
      text: '¿Estas seguro de eliminar este registro?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await socialsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const iconTemplate = (e) => {
    return $(renderToString(<span>
      <i className={`${e.id} me-1`}></i>
      {e.text.replace('fab fa-', '')}
    </span>))
  }

  return (<>
    <Table gridRef={gridRef} title='Redes Sociales' rest={socialsRest}
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
            text: 'Nuevo registro',
            hint: 'Nuevo registro',
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
          caption: 'Usuario',
        },
        {
          dataField: 'description',
          caption: 'Red Social',
          cellTemplate: (container, { data }) => {
            container.html(renderToString(<>
            <i className={`fab ${data.icon} me-1`}></i>
            {data.description}
            </>))
          }
        },
        {
          dataField: 'link',
          caption: 'Link',
          width: '400px'
        },
        {
          dataField: 'visible',
          caption: 'Visible',
          dataType: 'boolean',
          cellTemplate: (container, { data }) => {
            $(container).empty()
            ReactAppend(container, <SwitchFormGroup checked={data.visible == 1} onChange={() => onVisibleChange({
              id: data.id,
              value: !data.visible
            })} />)
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
    <Modal modalRef={modalRef} title={isEditing ? 'Editar red social' : 'Agregar red social'} onSubmit={onModalSubmit} size='md'>
      <div className='row' id='socials-container'>
        <input ref={idRef} type='hidden' />
        <SelectFormGroup eRef={iconRef} label='Ícono' dropdownParent='#socials-container' col='col-md-4' templateResult={iconTemplate} templateSelection={iconTemplate} >
          {icons.filter(x => x.id.startsWith('fab')).map((icon, index) => {
            return <option key={index} value={icon.id}>{icon.value}</option>
          })}
        </SelectFormGroup>
        <InputFormGroup eRef={descriptionRef} label='Red social' col='col-md-8' required />
        <InputFormGroup eRef={nameRef} label='Usuario' col='col-12' required />
        <TextareaFormGroup eRef={linkRef} label='Enlace (https://...)' col='col-12' rows={2} required />
      </div>
    </Modal>
  </>
  )
}

CreateReactScript((el, properties) => {

  createRoot(el).render(<BaseAdminto {...properties} title='Redes Sociales'>
    <Socials {...properties} />
  </BaseAdminto>);
})