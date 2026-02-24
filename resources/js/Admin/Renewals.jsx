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
import Swal from 'sweetalert2';
import RenewalsRest from '../Actions/Admin/RenewalsRest';
import { renderToString } from 'react-dom/server';

const renewalsRest = new RenewalsRest()

const Renewals = ({ }) => {
  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const percentageRef = useRef()
  const monthsRef = useRef()
  const itemsRef = useRef()
  const dateBeginRef = useRef()
  const dateEndRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id ?? ''
    nameRef.current.value = data?.name ?? ''
    percentageRef.current.value = (data?.percentage ?? 0) * 100
    monthsRef.current.value = data?.months ?? ''
    itemsRef.current.value = data?.items ?? 1
    dateBeginRef.current.value = data?.date_begin ?? ''
    dateEndRef.current.value = data?.date_end ?? ''

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value,
      percentage: percentageRef.current.value / 100,
      months: monthsRef.current.value,
      items: itemsRef.current.value,
      date_begin: dateBeginRef.current.value || null,
      date_end: dateEndRef.current.value || null,
    }

    const result = await renewalsRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onVisibleChange = async ({ id, value }) => {
    const result = await renewalsRest.boolean({ id, field: 'visible', value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeliveryFreeChange = async ({ id, value }) => {
    const result = await renewalsRest.boolean({ id, field: 'delivery_free', value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar renovación',
      text: '¿Estás seguro de eliminar esta renovación?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await renewalsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table gridRef={gridRef} title='Renovaciones' rest={renewalsRest}
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
            text: 'Nueva renovación',
            hint: 'Nueva renovación',
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
          caption: 'Contenido',
          width: '200px',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <p className='mb-0' style={{ width: '100%' }}>
              <b className='d-block'>{data.name}</b>
              <small className='text-wrap text-muted' style={{
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
              }}>Renovación cada {data.months} {data.months > 1 ? 'meses' : 'mes'}</small>
            </p>
            )
          }
        },
        {
          dataField: 'items',
          caption: 'A partir de',
          dataType: 'number',
          cellTemplate: (container, { data }) => {
            container.text(`${data.items} ${data.items > 1 ? 'items' : 'item'}`)
          },
          width: 75
        },
        {
          dataField: 'percentage',
          caption: 'Descuento',
          dataType: 'number',
          format: 'percent',
          width: 75
        },
        {
          dataField: 'date_begin',
          caption: 'Promoción',
          cellTemplate: (container, { data }) => {
            if (data.date_begin && data.date_end)
              container.html(renderToString(<>
                <p className='mb-0'><b>Desde:</b> {moment(data.date_begin).format('DD [de] MMMM')}</p>
                <p className='mb-0'><b>Hasta:</b> {moment(data.date_end).format('DD [de] MMMM')}</p>
              </>))
            else
              container.html('<p class="mb-0"><b>Válida:</b> Todo el tiempo</p>')
          }
        },
        {
          dataField: 'delivery_free',
          caption: 'Envío gratis',
          dataType: 'boolean',
          width: '120px',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <SwitchFormGroup checked={data.delivery_free} onChange={(e) => onDeliveryFreeChange({ id: data.id, value: e.target.checked })} />)
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
    <Modal modalRef={modalRef} title={isEditing ? 'Editar plan' : 'Nuevo plan'} onSubmit={onModalSubmit} size='md'>
      <div className="row">
        <input ref={idRef} type='hidden' />
        <InputFormGroup
          eRef={nameRef}
          label='Nombre del plan'
          required
          col='col-12'
        />
        <InputFormGroup
          eRef={percentageRef}
          label='Descuento'
          type='number'
          min={0}
          max={100}
          required
          col='col-md-4'
        />
        <InputFormGroup
          eRef={monthsRef}
          label='Meses'
          specification='¿Cada cuántos meses?'
          type='number'
          min={1}
          required
          col='col-md-4'
        />
        <InputFormGroup
          eRef={itemsRef}
          label='Items'
          specification='¿A partir de cuántos items?'
          type='number'
          min={1}
          required
          col='col-md-4'
        />
        <InputFormGroup
          eRef={dateBeginRef}
          label='Fecha inicio'
          type='date'
          col='col-md-6'
        />
        <InputFormGroup
          eRef={dateEndRef}
          label='Fecha fin'
          type='date'
          col='col-md-6'
        />
      </div>
    </Modal>
  </>
  )
}

CreateReactScript((el, properties) => {
  createRoot(el).render(<BaseAdminto {...properties} title='Renovaciones'>
    <Renewals {...properties} />
  </BaseAdminto>);
})