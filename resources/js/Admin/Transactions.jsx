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
import Swal from 'sweetalert2';
import TransactionsRest from '../Actions/Admin/TransactionsRest';
import Number2Currency from '../Utils/Number2Currency';
import SelectFormGroup from '../Components/Adminto/form/SelectFormGroup';
import SelectAPIFormGroup from '../Components/Adminto/form/SelectAPIFormGroup';
import SetSelectValue from '../Utils/SetSelectValue';

const faqsRest = new TransactionsRest()

const Transactions = ({ }) => {

  const gridRef = useRef()
  const modalRef = useRef()
  const previewModalRef = useRef();
  const categoryCreateModalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const categoryRef = useRef()
  const newCategoryNameRef = useRef()
  const descriptionRef = useRef()
  const amountRef = useRef()
  const dateRef = useRef()
  const paymentMethodRef = useRef()
  const issueRef = useRef()
  const noteRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [previewData, setPreviewData] = useState(null);

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id ?? ''
    // $(categoryRef.current).val(data?.category ?? '').trigger('change')
    SetSelectValue(categoryRef.current, data?.category_id, data?.category)
    descriptionRef.current.value = data?.description ?? ''
    amountRef.current.value = data?.amount ?? ''
    dateRef.current.value = data?.date ?? ''
    $(paymentMethodRef.current).val(data?.payment_method ?? '').trigger('change')
    issueRef.current.value = data?.issue ?? ''
    noteRef.current.value = data?.note ?? ''

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      category_id: categoryRef.current.value,
      category: $(categoryRef.current).find('option:selected').text(),
      description: descriptionRef.current.value,
      amount: Math.abs(amountRef.current.value) * -1,
      date: dateRef.current.value,
      payment_method: paymentMethodRef.current.value,
      issue: issueRef.current.value,
      note: noteRef.current.value,
    }

    const result = await faqsRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar faq',
      text: '¿Estas seguro de eliminar este faq?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await faqsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onPreviewOpen = (data) => {
    $(previewModalRef.current).modal('show');
    setPreviewData(data);
  };

  const onOpenCreateCategoryModal = () => {
    newCategoryNameRef.current.value = ''
    $(categoryCreateModalRef.current).modal('show')
  }

  const onCreateCategorySubmit = async (e) => {
    e.preventDefault()
    const name = (newCategoryNameRef.current.value ?? '').trim()
    if (!name) return

    const result = await faqsRest.createCategory({ name, status: true })
    if (!result) return

    const created = result?.data ?? result
    if (created?.id) SetSelectValue(categoryRef.current, created.id, created.name ?? name)
    $(categoryCreateModalRef.current).modal('hide')
  }

  return (<>
    <Table gridRef={gridRef} title='Gastos' rest={faqsRest}
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
            text: 'Nuevo gasto',
            hint: 'Nuevo gasto',
            onClick: () => onModalOpen()
          }
        });
      }}
      pageSize={25}
      columns={[
        {
          dataField: 'id',
          caption: 'ID',
          visible: false
        },
        {
          dataField: 'date',
          caption: 'Fecha',
          dataType: 'date',
          format: 'yyyy-MM-dd',
          sortOrder: 'desc'
        },
        {
          dataField: 'category',
          caption: 'Categoría',
        },
        {
          dataField: 'description',
          caption: 'Descripción',
        },
        {
          dataField: 'amount',
          caption: 'Monto',
          dataType: 'number',
          cellTemplate: (container, { data }) => {
            container.css('font-weight', 'bold')
            if (data.amount > 0) {
              container.css('color', '#10c469')
            } else {
              container.css('color', '#ff5b5b')
            }
            container.text(`S/ ${Number2Currency(data.amount)}`)
          }
        },
        {
          dataField: 'payment_method',
          caption: 'Metodo de pago',
        },
        {
          dataField: 'issue',
          caption: 'Documento',
        },
        {
          caption: 'Acciones',
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-dark',
              title: 'Ver',
              icon: 'fa fa-eye',
              onClick: () => onPreviewOpen(data)
            }))
            if (data.automatically_created) return
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
    <Modal modalRef={modalRef} title={isEditing ? 'Editar gasto' : 'Agregar gasto'} onSubmit={onModalSubmit} size='lg'>
      <div className='row' id='testimony-container'>
        <input ref={idRef} type='hidden' />
        <div className='col-md-6'>
          <div className='d-flex align-items-end gap-1'>
            <SelectAPIFormGroup col='flex-grow-1' eRef={categoryRef} label='Categoría'
              searchAPI={'/api/admin/transactions/categories/paginate'} searchBy={'name'} />
            <button type='button' className='btn btn-soft-primary mb-2' title='Nueva categoría' onClick={onOpenCreateCategoryModal}>
              <i className='mdi mdi-plus'></i>
            </button>
          </div>
          {/* <SelectFormGroup eRef={categoryRef} label='Categoría' required>
            <option value="Ventas" disabled>Ventas</option>
            <option value="Publicidad">Publicidad</option>
            <option value="Químicos">Químicos</option>
            <option value="Asistentes">Asistentes</option>
            <option value="Diseño">Diseño</option>
            <option value="Otros">Otros</option>
          </SelectFormGroup> */}
          <TextareaFormGroup eRef={descriptionRef} label='Descripción' rows={3} required />
          <TextareaFormGroup eRef={noteRef} label='Notas' rows={3} />
        </div>
        <div className='col-md-6'>
          <InputFormGroup eRef={amountRef} label='Monto' type='number' required step={0.01} />
          <InputFormGroup eRef={dateRef} label='Fecha' type='date' required />
          <SelectFormGroup eRef={paymentMethodRef} label='Metodo de pago' required>
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Cheque">Cheque</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Yape">Yape</option>
            <option value="Plin">Plin</option>
          </SelectFormGroup>
          <InputFormGroup eRef={issueRef} label='Documento' />
        </div>
      </div>
    </Modal>
    <Modal modalRef={categoryCreateModalRef} title='Nueva categoría de gasto' onSubmit={onCreateCategorySubmit} size='sm'>
      <div className='row'>
        <InputFormGroup eRef={newCategoryNameRef} label='Nombre de la categoría' required />
      </div>
    </Modal>
    <Modal modalRef={previewModalRef} title='Detalles de transacción' onClose={() => setPreviewData(null)} bodyClass='p-0' hideFooter>
      <table className='table table-sm table-bordered mb-0'>
        <tbody>
          <tr>
            <th>ID</th>
            <td>{previewData?.id}</td>
          </tr>
          <tr>
            <th>Fecha</th>
            <td>{previewData?.date}</td>
          </tr>
          <tr>
            <th>Categoría</th>
            <td>{previewData?.category}</td>
          </tr>
          <tr>
            <th>Descripción</th>
            <td>{previewData?.description}</td>
          </tr>
          <tr>
            <th>Monto</th>
            <td>S/ {Number2Currency(previewData?.amount)}</td>
          </tr>
          <tr>
            <th>Método de pago</th>
            <td>{previewData?.payment_method}</td>
          </tr>
          <tr>
            <th>Documento</th>
            <td>{previewData?.issue}</td>
          </tr>
          <tr>
            <th>Notas</th>
            <td>
              <div style={{whiteSpace: 'pre-line'}}>
                {previewData?.note}
            </div>
            </td>
          </tr>
        </tbody>
      </table>
    </Modal>
  </>
  )
}

CreateReactScript((el, properties) => {
  if (!properties.can('expenses') && !properties.hasRole('Admin')) location.href = '/admin/';

  createRoot(el).render(<BaseAdminto {...properties} title='Gastos'>
    <Transactions {...properties} />
  </BaseAdminto>);
})
