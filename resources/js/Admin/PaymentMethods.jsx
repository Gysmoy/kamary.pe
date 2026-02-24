import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import InputFormGroup from '../Components/Adminto/Form/InputFormGroup';
import SelectFormGroup from '../Components/Adminto/Form/SelectFormGroup';
import SwitchFormGroup from '../Components/Adminto/Form/SwitchFormGroup';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import ReactAppend from '../Utils/ReactAppend';
import PaymentMethodsRest from '../Actions/Admin/payment-methods-rest';

const paymenthMethodsRest = new PaymentMethodsRest

const PaymentMethods = ({ }) => {

  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const typeRef = useRef()
  const numberRef = useRef()
  const cciRef = useRef()
  const holderRef = useRef()

  const [type, setType] = useState('');
  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id ?? ''
    nameRef.current.value = data?.name ?? ''
    $(typeRef.current).val(data?.type ?? '').trigger('change')
    holderRef.current.value = data?.holder ?? ''
    numberRef.current.value = data?.number ?? ''
    cciRef.current.value = data?.cci ?? ''

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value,
      type: typeRef.current.value,
      holder: holderRef.current.value,
      number: numberRef.current.value,
      cci: cciRef?.current.value ?? null
    }

    const result = await paymenthMethodsRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await paymenthMethodsRest.boolean({ id, field, value })
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
    const result = await paymenthMethodsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table gridRef={gridRef} title='Medios' rest={paymenthMethodsRest}
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
          caption: 'Nombre',
        },
        {
          dataField: 'type',
          caption: 'Tipo',
          lookup: {
            dataSource: [
              { value: 'cci', text: 'Cuenta bancaria' },
              { value: 'wallet', text: 'Yape/Plin' }
            ],
            valueExpr: 'value',
            displayExpr: 'text'
          },
        },
        {
          dataField: 'holder',
          caption: 'Titular',
        },
        {
          dataField: 'number',
          caption: 'Número',
        },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          width: '120px',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <SwitchFormGroup checked={data.status} onChange={(e) => onBooleanChange({ id: data.id, field: 'status', value: e.target.checked })} />)
          }
        },
        {
          caption: 'Acciones',
          cellTemplate: (container, { data }) => {
            container.append(DxButton({
              className: 'btn btn-sm btn-soft-primary',
              title: 'Editar',
              icon: 'mdi mdi-pen',
              onClick: () => onModalOpen(data)
            }))
            container.append(DxButton({
              className: 'btn btn-sm btn-soft-danger',
              title: 'Eliminar',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.id)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar medio de pago' : 'Agregar medio de pago'} onSubmit={onModalSubmit} size='sm'>
      <div className='row' id='payment-methods-container'>
        <input ref={idRef} type='hidden' />
        <InputFormGroup eRef={nameRef} label='Nombre' required />
        <SelectFormGroup eRef={typeRef} label='Tipo' value={type} onChange={e => setType(e.target.value)} required>
          <option value='' disabled></option>
          <option value='cci'>CCI</option>
          <option value='wallet'>Yape/Plin</option>
        </SelectFormGroup>
        <InputFormGroup eRef={numberRef} label={type == 'wallet' ? 'Número de celular' : 'Número de cuenta'} />
        <div hidden={type != 'cci'}>
          <InputFormGroup eRef={cciRef} label='Número de cuenta interbancaria' />
        </div>
        <InputFormGroup eRef={holderRef} label='Titular' />
      </div>
    </Modal>
  </>
  )
}

CreateReactScript((el, properties) => {

  createRoot(el).render(<BaseAdminto {...properties} title='Medios de pago'>
    <PaymentMethods {...properties} />
  </BaseAdminto>);
})