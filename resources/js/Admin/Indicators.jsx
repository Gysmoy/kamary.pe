import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import InputFormGroup from '../Components/Adminto/Form/InputFormGroup';
import ReactAppend from '../Utils/ReactAppend';
import DxButton from '../Components/dx/DxButton';
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import IndicatorsRest from '../Actions/Admin/IndicatorsRest';
import Swal from 'sweetalert2';

const indicatorsRest = new IndicatorsRest()

const Indicators = () => {

  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const symbolRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id ?? ''
    symbolRef.current.value = data?.symbol ?? ''
    nameRef.current.value = data?.name ?? ''
    descriptionRef.current.value = data?.description ?? ''

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      symbol: symbolRef.current.value,
      name: nameRef.current.value,
      description: descriptionRef.current.value,
    }

    const result = await indicatorsRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onStatusChange = async ({ id, status }) => {
    const result = await indicatorsRest.status({ id, status })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onVisibleChange = async ({ id, value }) => {
    const result = await indicatorsRest.boolean({ id, field: 'visible', value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar indicador',
      text: '¿Estas seguro de eliminar este indicador?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await indicatorsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table gridRef={gridRef} title='Indicadores' rest={indicatorsRest}
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
            text: 'Nuevo slider',
            hint: 'Nuevo slider',
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
          caption: 'Número',
        },
        {
          dataField: 'symbol',
          caption: 'Símbolo',
        },
        {
          dataField: 'description',
          caption: 'Descripción',
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
        // {
        //   dataField: 'status',
        //   caption: 'Estado',
        //   dataType: 'boolean',
        //   cellTemplate: (container, { data }) => {
        //     switch (data.status) {
        //       case 1:
        //         ReactAppend(container, <span className='badge bg-success rounded-pill'>Activo</span>)
        //         break
        //       case 0:
        //         ReactAppend(container, <span className='badge bg-danger rounded-pill'>Inactivo</span>)
        //         break
        //       default:
        //         ReactAppend(container, <span className='badge bg-dark rounded-pill'>Eliminado</span>)
        //         break
        //     }
        //   }
        // },
        {
          caption: 'Acciones',
          cellTemplate: (container, { data }) => {
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
    <Modal modalRef={modalRef} title={isEditing ? 'Editar indicador' : 'Agregar indicador'} onSubmit={onModalSubmit} size='md'>
      <div className='row' id='indicators-container'>
        <input ref={idRef} type='hidden' />
        <InputFormGroup eRef={nameRef} label='Número' col='col-sm-8' rows={2} required />
        <InputFormGroup eRef={symbolRef} label='Símbolo' col='col-sm-4' rows={2} required />
        <TextareaFormGroup eRef={descriptionRef} label='Descripción' rows={3} />
      </div>
    </Modal>
  </>
  )
}

CreateReactScript((el, properties) => {

  createRoot(el).render(<BaseAdminto {...properties} title='Indicadores'>
    <Indicators {...properties} />
  </BaseAdminto>);
})