import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import Modal from '@Adminto/Modal';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import Swal from 'sweetalert2';
import TransactionsRest from '../Actions/Admin/TransactionsRest';
import Number2Currency from '../Utils/Number2Currency';
import { Fetch } from 'sode-extend-react';

const transactionsRest = new TransactionsRest()

const PAYMENT_METHODS = ['Efectivo', 'Transferencia', 'Cheque', 'Tarjeta', 'Yape', 'Plin']

const Transactions = ({ }) => {

  const tableRef = useRef()
  const modalRef = useRef()
  const previewModalRef = useRef();
  const categoryCreateModalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const newCategoryNameRef = useRef()
  const descriptionRef = useRef()
  const amountRef = useRef()
  const dateRef = useRef()
  const issueRef = useRef()
  const noteRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [previewData, setPreviewData] = useState(null);
  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')

  const refresh = () => tableRef.current?.refresh()

  const loadCategories = async () => {
    try {
      const { status, result } = await Fetch('/api/admin/transactions/categories/paginate', {
        method: 'POST',
        body: JSON.stringify({ isLoadingAll: true, sort: [{ selector: 'name', desc: false }] })
      })
      if (!status) throw new Error(result?.message || 'No se pudieron cargar las categorías')
      setCategories(result?.data ?? [])
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message, confirmButtonText: 'Entendido' })
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id ?? ''
    setSelectedCategoryId(data?.category_id ? `${data.category_id}` : '')
    descriptionRef.current.value = data?.description ?? ''
    amountRef.current.value = data?.amount ?? ''
    dateRef.current.value = data?.date ?? ''
    setSelectedPaymentMethod(data?.payment_method ?? '')
    issueRef.current.value = data?.issue ?? ''
    noteRef.current.value = data?.note ?? ''

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    if (!selectedCategoryId) {
      Swal.fire({ icon: 'warning', title: 'Falta categoría', text: 'Selecciona una categoría.', confirmButtonText: 'Entendido' })
      return
    }
    if (!selectedPaymentMethod) {
      Swal.fire({ icon: 'warning', title: 'Falta método de pago', text: 'Selecciona un método de pago.', confirmButtonText: 'Entendido' })
      return
    }

    const request = {
      id: idRef.current.value || undefined,
      category_id: selectedCategoryId,
      category: categories.find(item => `${item.id}` === `${selectedCategoryId}`)?.name ?? '',
      description: descriptionRef.current.value,
      amount: Math.abs(amountRef.current.value) * -1,
      date: dateRef.current.value,
      payment_method: selectedPaymentMethod,
      issue: issueRef.current.value,
      note: noteRef.current.value,
    }

    const result = await transactionsRest.save(request)
    if (!result) return

    refresh()
    $(modalRef.current).modal('hide')
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar gasto',
      text: '¿Estas seguro de eliminar este gasto?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await transactionsRest.delete(id)
    if (!result) return
    refresh()
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

    const result = await transactionsRest.createCategory({ name, status: true })
    if (!result) return

    await loadCategories()
    const created = result?.data ?? result
    if (created?.id) setSelectedCategoryId(`${created.id}`)
    $(categoryCreateModalRef.current).modal('hide')
  }

  const rowActions = (row) => [
    { icon: 'mdi mdi-eye', title: 'Ver', bg: '#eef0f4', color: '#5b69bc', onClick: (r) => onPreviewOpen(r) },
    { icon: 'mdi mdi-pencil', title: 'Editar', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onModalOpen(r), hidden: !!row.automatically_created },
    { icon: 'mdi mdi-delete', title: 'Eliminar', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => onDeleteClicked(r.id), hidden: !!row.automatically_created },
  ]

  return (<>
    <VdTable
      ref={tableRef}
      rest={transactionsRest}
      icon="mdi mdi-cash-multiple"
      title="Gastos"
      unit="gastos"
      defaultSort={{ field: 'date', desc: true }}
      defaultPageSize={25}
      searchFields={['category', 'description', 'payment_method', 'issue']}
      searchPlaceholder="Buscar por categoría, descripción, método o documento…"
      emptyText="No se encontraron gastos."
      headerActions={<>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={refresh}>
          <i className="mdi mdi-refresh"></i>
        </button>
        <button type="button" className="vdt-btn-pri" onClick={() => onModalOpen()}>
          <i className="mdi mdi-plus"></i> Nuevo gasto
        </button>
      </>}
      actions={rowActions}
      columns={[
        { key: 'id', label: 'ID', field: 'id', visible: false, sortable: false },
        { key: 'fecha', label: 'Fecha', field: 'date', width: '120px', filter: { type: 'date' } },
        { key: 'categoria', label: 'Categoría', field: 'category', filter: { type: 'text' } },
        { key: 'descripcion', label: 'Descripción', field: 'description', filter: { type: 'text' }, muted: true },
        {
          key: 'monto', label: 'Monto', field: 'amount', align: 'right', width: '140px', filter: { type: 'number' },
          render: (row) => (
            <span style={{ fontWeight: 'bold', color: row.amount > 0 ? '#10c469' : '#ff5b5b' }}>
              S/ {Number2Currency(row.amount)}
            </span>
          ),
        },
        { key: 'metodo_pago', label: 'Metodo de pago', field: 'payment_method', filter: { type: 'text' } },
        { key: 'documento', label: 'Documento', field: 'issue', filter: { type: 'text' } },
      ]}
      renderCard={(row, actionButtons) => (
        <div className="vdt-card">
          <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{row.category}</p>
              <small className="text-muted">{row.date}</small>
            </div>
            <span style={{ fontWeight: 'bold', color: row.amount > 0 ? '#10c469' : '#ff5b5b' }}>
              S/ {Number2Currency(row.amount)}
            </span>
          </div>
          {row.description && <p className="text-muted mb-0 mt-2" style={{ fontSize: 12 }}>{row.description}</p>}
          <small className="text-muted d-block mt-2">{[row.payment_method, row.issue].filter(Boolean).join(' · ')}</small>
          {actionButtons && <div className="d-flex mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }}>{actionButtons}</div>}
        </div>
      )}
    />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar gasto' : 'Agregar gasto'} onSubmit={onModalSubmit} size='lg'>
      <div className='row' id='testimony-container'>
        <input ref={idRef} type='hidden' />
        <div className='col-md-6'>
          <div className='d-flex align-items-end gap-1'>
            <VdSelect col='flex-grow-1' label='Categoría' required
              value={selectedCategoryId}
              onChange={setSelectedCategoryId}
              options={categories.map(item => ({ value: `${item.id}`, label: item.name }))}
              placeholder='-- Seleccionar categoría --' />
            <button type='button' className='btn btn-soft-primary mb-2' title='Nueva categoría' onClick={onOpenCreateCategoryModal}>
              <i className='mdi mdi-plus'></i>
            </button>
          </div>
          <TextareaFormGroup eRef={descriptionRef} label='Descripción' rows={3} required />
          <TextareaFormGroup eRef={noteRef} label='Notas' rows={3} />
        </div>
        <div className='col-md-6'>
          <InputFormGroup eRef={amountRef} label='Monto' type='number' required step={0.01} />
          <InputFormGroup eRef={dateRef} label='Fecha' type='date' required />
          <VdSelect label='Metodo de pago' required
            value={selectedPaymentMethod}
            onChange={setSelectedPaymentMethod}
            options={PAYMENT_METHODS.map(method => ({ value: method, label: method }))}
            placeholder='-- Seleccionar método --' />
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
