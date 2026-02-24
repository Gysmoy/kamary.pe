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
import Swal from 'sweetalert2';
import SelectFormGroup from '../Components/Adminto/form/SelectFormGroup';
import CouponsRest from '../Actions/Admin/CouponsRest';
import Number2Currency from '../Utils/Number2Currency';
import { renderToString } from 'react-dom/server';

const couponsRest = new CouponsRest()

const Coupons = ({ }) => {
  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()
  const typeRef = useRef()
  const amountRef = useRef()
  const saleAmountRef = useRef()
  const initialStockRef = useRef()
  const dateBeginRef = useRef()
  const dateEndRef = useRef()
  const oneTimeUseRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id ?? ''
    nameRef.current.value = (data?.name ?? '').toUpperCase()
    descriptionRef.current.value = data?.description ?? ''
    $(typeRef.current).val(data?.type ?? 'percentage').trigger('change')
    amountRef.current.value = data?.amount ?? 0
    saleAmountRef.current.value = data?.sale_amount ?? 0
    initialStockRef.current.value = data?.initial_stock ?? null
    dateBeginRef.current.value = data?.date_begin ?? null
    dateEndRef.current.value = data?.date_end ?? null
    oneTimeUseRef.current.value = data?.one_time_use ?? false

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value.toUpperCase(),
      type: typeRef.current.value,
      amount: amountRef.current.value,
      sale_amount: saleAmountRef.current.value,
      initial_stock: initialStockRef.current.value,
      date_begin: dateBeginRef.current.value,
      date_end: dateEndRef.current.value,
      one_time_use: oneTimeUseRef.current.checked ?? false,
      description: descriptionRef.current.value,
    }

    const result = await couponsRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

const onStatusChange = async ({ id, value }) => {
    const result = await couponsRest.boolean({ id, field: 'status', value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar cupón',
      text: '¿Estás seguro de eliminar este cupón?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await couponsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table gridRef={gridRef} title='Cupones' rest={couponsRest}
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
            text: 'Nuevo cupón',
            hint: 'Nuevo cupón',
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
          width: '40%',
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
          dataField: 'percentage',
          caption: 'Descuento',
          dataType: 'number',
          cellTemplate: (container, { data }) => {
            if (data.type === 'percentage') {
              container.text(`${Math.round(data.amount * 100) / 100}%`)
            } else {
              container.text(`S/. ${Number2Currency(data.amount)}`)
            }
          }
        },
        {
          dataField: 'stock',
          caption: 'Cantidad',
          cellTemplate: (container, { data }) => {
            if (data.initial_stock == null) {
              container.html(renderToString(<>
                <b className='d-block'>Ilimitado</b >
                <small className='text-muted'>{data.one_time_use ? 'De uso único' : 'De uso múltiple'}</small>
              </>))
            } else {
              container.html(renderToString(<>
                <b className='d-block'>{data.stock} de {data.initial_stock}</b>
                <small className='text-muted'>{data.one_time_use ? 'De uso único' : 'De uso múltiple'}</small>
              </>))
            }
          }
        },
        {
          dataField: 'date_begin',
          caption: 'Fecha de inicio',
          dataType: 'date',
        },
        {
          dataField: 'date_end',
          caption: 'Fecha de fin',
          dataType: 'date',
        },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          width: '120px',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <SwitchFormGroup checked={data.status} onChange={(e) => onStatusChange({ id: data.id, value: e.target.checked })} />)
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
    <Modal modalRef={modalRef} title={isEditing ? 'Editar cupón' : 'Agregar cupón'} onSubmit={onModalSubmit} size='md'>
      <div className='row' id='principal-container'>
        <input ref={idRef} type='hidden' />
        <InputFormGroup eRef={nameRef} label='Código' required uppercase />
        <TextareaFormGroup eRef={descriptionRef} label='Descripción' rows={2} required />
        <SelectFormGroup eRef={typeRef} label='Tipo' col='col-md-4 col-sm-6' dropdownParent='#principal-container' required>
          <option value='percentage'>Porcentaje</option>
          <option value='fixed_amount'>Monto fijo</option>
        </SelectFormGroup>  
        <InputFormGroup eRef={amountRef} label='Descuento' type='number' step={0.01} col='col-md-4' required />
        <InputFormGroup eRef={saleAmountRef} label='Monto de venta' specification='Monto mínimo de compra para aplicar el descuento' type='number' step={0.01} col='col-md-4' />
        <InputFormGroup eRef={initialStockRef} label='Cantidad' type='number' col='col-md-4 col-sm-6' />
        <InputFormGroup eRef={dateBeginRef} label='Fecha de inicio' type='date' col='col-md-4 col-sm-6' />
        <InputFormGroup eRef={dateEndRef} label='Fecha de fin' type='date' col='col-md-4 col-sm-6' />
        <SwitchFormGroup eRef={oneTimeUseRef} label='De uso único' col='col-md-4 col-sm-6' />
      </div>
    </Modal>
  </>
  )
}

CreateReactScript((el, properties) => {
  createRoot(el).render(<BaseAdminto {...properties} title='Cupones'>
    <Coupons {...properties} />
  </BaseAdminto>);
})