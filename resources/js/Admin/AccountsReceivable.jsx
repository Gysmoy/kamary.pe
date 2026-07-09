import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import VdTable from '@Adminto/VdTable';
import VdSelect from '@Adminto/VdSelect';
import Modal from '@Adminto/Modal';
import Swal from 'sweetalert2';
import AccountsReceivableRest from '../Actions/Admin/AccountsReceivableRest';
import { buildMagistralesRows, openMagistralesRecordPdf } from '../Utils/magistralesRecordPdf';
import {
  getOperationalOrderStatusLabel,
  getPaymentStatusLabel,
  getSourceTypeLabel,
  paymentStatusOptions,
  sourceTypeOptions,
} from '../Utils/statusLabels';

const accountsReceivableRest = new AccountsReceivableRest()

const paymentMethodOptions = [
  'Efectivo',
  'Transferencia',
  'Deposito',
  'Yape',
  'Plin',
  'POS',
  'Cheque',
  'Otro'
]

const formatMoney = (value) => Number(value || 0).toFixed(2)
const formatDate = (value) => value?.toString?.().slice?.(0, 10) || value || '-'
const fileUrl = (filename) => filename ? `/api/admin/accounts-receivable/payments/media/${filename}` : null

const AccountsReceivable = () => {
  const tableRef = useRef()
  const modalRef = useRef()
  const paymentModalRef = useRef()

  const amountRef = useRef()
  const paymentDateRef = useRef()
  const bankRef = useRef()
  const operationNumberRef = useRef()
  const paymentFileRef = useRef()
  const observationsRef = useRef()

  const [selectedRow, setSelectedRow] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('Transferencia')

  const refresh = () => tableRef.current?.refresh()

  const resetPaymentForm = (row = null) => {
    if (amountRef.current) amountRef.current.value = row ? formatMoney(row.balance_amount) : ''
    if (paymentDateRef.current) paymentDateRef.current.value = new Date().toISOString().slice(0, 10)
    setPaymentMethod('Transferencia')
    if (bankRef.current) bankRef.current.value = ''
    if (operationNumberRef.current) operationNumberRef.current.value = ''
    if (observationsRef.current) observationsRef.current.value = ''
    if (paymentFileRef.current) paymentFileRef.current.value = ''
  }

  const onViewDetail = (row) => {
    setSelectedRow(row)
    $(modalRef.current).modal('show')
  }

  const onOpenPayment = (row) => {
    setSelectedRow(row)
    setTimeout(() => {
      resetPaymentForm(row)
      $(paymentModalRef.current).modal('show')
    }, 0)
  }

  const onSubmitPayment = async (e) => {
    e.preventDefault()
    if (!selectedRow) return

    if (!paymentMethod) {
      Swal.fire({ icon: 'warning', title: 'Falta tipo de pago', text: 'Selecciona el tipo de pago.', confirmButtonText: 'Entendido' })
      return
    }

    const formData = new FormData()
    formData.append('amount', amountRef.current?.value || '')
    formData.append('payment_date', paymentDateRef.current?.value || '')
    formData.append('payment_method', paymentMethod || '')
    formData.append('bank', bankRef.current?.value || '')
    formData.append('operation_number', operationNumberRef.current?.value || '')
    formData.append('observations', observationsRef.current?.value || '')

    const file = paymentFileRef.current?.files?.[0]
    if (file) formData.append('payment_file', file)

    const result = await accountsReceivableRest.registerPayment(selectedRow.id, formData)
    if (!result?.data) return

    setSelectedRow(result.data)
    $(paymentModalRef.current).modal('hide')
    refresh()
  }

  const rowActions = (row) => {
    const canPay = !!row?.status && Number(row?.balance_amount || 0) > 0
    return [
      { icon: 'mdi mdi-eye', title: 'Ver detalle', bg: '#e7f2fd', color: '#188ae2', onClick: (r) => onViewDetail(r) },
      { icon: 'mdi mdi-file-pdf-box', title: 'Imprimir PDF', bg: '#fcebeb', color: '#e24b4a', onClick: (r) => openMagistralesRecordPdf(buildMagistralesRows.accountsReceivable(r)) },
      { icon: 'mdi mdi-cash-plus', title: 'Registrar pago', bg: '#e7faf1', color: '#10c469', onClick: (r) => onOpenPayment(r), hidden: !canPay },
    ]
  }

  return (<>
    <VdTable
      ref={tableRef}
      rest={accountsReceivableRest}
      icon="mdi mdi-cash-multiple"
      title="Cuentas por cobrar"
      unit="cuentas por cobrar"
      defaultPageSize={25}
      searchFields={['code', 'document_type', 'payment_condition', 'currency']}
      searchPlaceholder="Buscar por codigo, tipo doc, condicion o moneda…"
      emptyText="No se encontraron cuentas por cobrar."
      headerActions={<>
        <button type="button" className="vdt-btn-soft vdt-btn-icon" title="Refrescar" onClick={refresh}>
          <i className="mdi mdi-refresh"></i>
        </button>
      </>}
      actions={rowActions}
      columns={[
        { key: 'id', label: 'ID', field: 'id', width: '80px', align: 'right' },
        {
          key: 'code', label: 'Codigo', field: 'code', width: '130px',
          filter: { type: 'text' },
          render: (row) => (
            <a className="admin-grid-edit-link" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => onViewDetail(row)} title="Ver detalle">
              {row.code || '-'}
            </a>
          ),
        },
        {
          key: 'origen', label: 'Origen', field: 'source_type', width: '120px',
          filter: { type: 'select', options: sourceTypeOptions },
          render: (row) => getSourceTypeLabel(row.source_type),
        },
        {
          key: 'documento_origen', label: 'Documento origen', sortable: false, width: '160px',
          render: (row) => row.commercial_order?.code ?? row.commercialOrder?.code ?? row.service_order?.code ?? row.serviceOrder?.code ?? '-',
        },
        {
          key: 'cliente', label: 'Cliente', sortable: false, width: '220px',
          render: (row) => row.client?.full_name ?? row.eventual_client?.business_name ?? row.eventualClient?.business_name ?? '-',
        },
        { key: 'tipo_doc', label: 'Tipo doc', field: 'document_type', width: '100px', filter: { type: 'text' } },
        {
          key: 'f_emision', label: 'F. emision', field: 'issue_date', width: '110px',
          filter: { type: 'date' },
          render: (row) => formatDate(row.issue_date),
        },
        {
          key: 'f_vcto', label: 'F. vcto', field: 'due_date', width: '110px',
          filter: { type: 'date' },
          render: (row) => formatDate(row.due_date),
        },
        { key: 'condicion', label: 'Condicion', field: 'payment_condition', width: '100px', filter: { type: 'text' } },
        { key: 'moneda', label: 'Moneda', field: 'currency', width: '90px', filter: { type: 'text' } },
        {
          key: 'total', label: 'Total', field: 'total', width: '110px', align: 'right',
          filter: { type: 'number' },
          render: (row) => formatMoney(row.total),
        },
        {
          key: 'pagado', label: 'Pagado', field: 'paid_amount', width: '110px', align: 'right',
          filter: { type: 'number' },
          render: (row) => formatMoney(row.paid_amount),
        },
        {
          key: 'saldo', label: 'Saldo', field: 'balance_amount', width: '110px', align: 'right',
          filter: { type: 'number' },
          render: (row) => formatMoney(row.balance_amount),
        },
        {
          key: 'estado_pago', label: 'Estado pago', field: 'payment_status', width: '120px',
          filter: { type: 'select', options: paymentStatusOptions },
          render: (row) => getPaymentStatusLabel(row.payment_status),
        },
        {
          key: 'cuotas', label: 'Cuotas', sortable: false, align: 'right', width: '90px', nowrap: true,
          render: (row) => (row?.installments ?? []).length || 0,
        },
        {
          key: 'pagos', label: 'Pagos', sortable: false, align: 'right', width: '90px', nowrap: true,
          render: (row) => (row?.payments ?? []).length || 0,
        },
      ]}
      renderCard={(row, actionButtons) => (
        <div className="vdt-card" onClick={() => onViewDetail(row)}>
          <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p className="fw-semibold mb-0" style={{ color: 'var(--vd-ink)' }}>{row.code}</p>
              <small className="text-muted">{row.client?.full_name ?? row.eventual_client?.business_name ?? row.eventualClient?.business_name ?? '-'}</small>
            </div>
            <span className={`badge ${row.payment_status === 'paid' ? 'badge-soft-success' : row.payment_status === 'cancelled' ? 'badge-soft-danger' : 'badge-soft-warning'}`}>
              {getPaymentStatusLabel(row.payment_status)}
            </span>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-2">
            <small className="text-muted">{getSourceTypeLabel(row.source_type)} · vence {formatDate(row.due_date)}</small>
            <small className="fw-semibold">{row.currency} {formatMoney(row.balance_amount)}</small>
          </div>
          {actionButtons && <div className="d-flex mt-3 pt-3" style={{ gap: 8, borderTop: '1px solid #f1f1f6' }} onClick={(e) => e.stopPropagation()}>{actionButtons}</div>}
        </div>
      )}
    />

    <Modal modalRef={modalRef} title='Detalle de cuenta por cobrar' size='xl' hideFooter>
      <div className='row'>
        <div className='col-md-4 mb-2'><strong>Codigo:</strong> {selectedRow?.code || '-'}</div>
        <div className='col-md-4 mb-2'><strong>Origen:</strong> {getSourceTypeLabel(selectedRow?.source_type)}</div>
        <div className='col-md-4 mb-2'><strong>Documento origen:</strong> {selectedRow?.commercial_order?.code || selectedRow?.commercialOrder?.code || selectedRow?.service_order?.code || selectedRow?.serviceOrder?.code || '-'}</div>
        <div className='col-md-4 mb-2'><strong>Estado origen:</strong> {getOperationalOrderStatusLabel(selectedRow?.commercial_order?.order_status || selectedRow?.commercialOrder?.order_status || selectedRow?.service_order?.order_status || selectedRow?.serviceOrder?.order_status || '-')}</div>
        <div className='col-md-6 mb-2'><strong>Cliente:</strong> {selectedRow?.client?.full_name || selectedRow?.eventual_client?.business_name || selectedRow?.eventualClient?.business_name || '-'}</div>
        <div className='col-md-3 mb-2'><strong>Documento:</strong> {[selectedRow?.document_type, selectedRow?.series, selectedRow?.sequence].filter(Boolean).join(' ') || '-'}</div>
        <div className='col-md-3 mb-2'><strong>Estado pago:</strong> {getPaymentStatusLabel(selectedRow?.payment_status || '-')}</div>
        <div className='col-md-3 mb-2'><strong>Fecha emision:</strong> {formatDate(selectedRow?.issue_date)}</div>
        <div className='col-md-3 mb-2'><strong>Fecha vencimiento:</strong> {formatDate(selectedRow?.due_date)}</div>
        <div className='col-md-3 mb-2'><strong>Moneda:</strong> {selectedRow?.currency || '-'}</div>
        <div className='col-md-3 mb-2'><strong>Condicion:</strong> {selectedRow?.payment_condition || '-'}</div>
        <div className='col-md-4 mb-2'><strong>Subtotal:</strong> {formatMoney(selectedRow?.subtotal)}</div>
        <div className='col-md-4 mb-2'><strong>Impuesto:</strong> {formatMoney(selectedRow?.tax_amount)}</div>
        <div className='col-md-4 mb-2'><strong>Total:</strong> {formatMoney(selectedRow?.total)}</div>
        <div className='col-md-4 mb-2'><strong>Pagado:</strong> {formatMoney(selectedRow?.paid_amount)}</div>
        <div className='col-md-4 mb-2'><strong>Saldo:</strong> {formatMoney(selectedRow?.balance_amount)}</div>
        <div className='col-12 mb-2'><strong>Observaciones:</strong> {selectedRow?.observations || '-'}</div>

        <div className='col-12 mt-3'>
          <h6>Cuotas</h6>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Vencimiento</th>
                  <th>Importe</th>
                  <th>Pagado</th>
                  <th>Saldo</th>
                  <th>Estado</th>
                  <th>Fecha pago</th>
                </tr>
              </thead>
              <tbody>
                {(selectedRow?.installments ?? []).length === 0 && (
                  <tr>
                    <td colSpan='7' className='text-center text-muted'>Sin cuotas registradas</td>
                  </tr>
                )}
                {(selectedRow?.installments ?? []).map(installment => (
                  <tr key={`accounts-receivable-installment-${installment.id}`}>
                    <td>{installment.installment_number}</td>
                    <td>{formatDate(installment?.due_date)}</td>
                    <td>{formatMoney(installment.amount)}</td>
                    <td>{formatMoney(installment.paid_amount)}</td>
                    <td>{formatMoney(installment.balance_amount)}</td>
                    <td>{getPaymentStatusLabel(installment.payment_status)}</td>
                    <td>{formatDate(installment?.paid_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className='col-12 mt-4 d-flex justify-content-between align-items-center'>
          <h6 className='mb-0'>Pagos registrados</h6>
          {selectedRow?.status && Number(selectedRow?.balance_amount || 0) > 0 && (
            <button type='button' className='btn btn-sm btn-primary' onClick={() => onOpenPayment(selectedRow)}>
              Registrar pago
            </button>
          )}
        </div>

        <div className='col-12 mt-2'>
          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th>Fecha pago</th>
                  <th>Monto</th>
                  <th>Tipo</th>
                  <th>Banco</th>
                  <th>Nro operacion</th>
                  <th>Archivo</th>
                  <th>Usuario</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {(selectedRow?.payments ?? []).length === 0 && (
                  <tr>
                    <td colSpan='8' className='text-center text-muted'>Sin pagos registrados</td>
                  </tr>
                )}
                {(selectedRow?.payments ?? []).map(payment => (
                  <tr key={`accounts-receivable-payment-${payment.id}`}>
                    <td>{formatDate(payment.payment_date)}</td>
                    <td>{formatMoney(payment.amount)}</td>
                    <td>{payment.payment_method || '-'}</td>
                    <td>{payment.bank || '-'}</td>
                    <td>{payment.operation_number || '-'}</td>
                    <td>
                      {payment.payment_file
                        ? <a href={fileUrl(payment.payment_file)} target='_blank' rel='noreferrer'>Ver archivo</a>
                        : '-'}
                    </td>
                    <td>{payment?.creator?.fullname || payment?.creator?.username || '-'}</td>
                    <td>{payment.observations || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>

    <Modal
      modalRef={paymentModalRef}
      title={selectedRow ? `Registrar pago - ${selectedRow.code}` : 'Registrar pago'}
      size='lg'
      onSubmit={onSubmitPayment}
      onClose={() => resetPaymentForm()}
    >
      <div className='row'>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Total</label>
          <input className='form-control' value={formatMoney(selectedRow?.total)} readOnly />
        </div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Pagado</label>
          <input className='form-control' value={formatMoney(selectedRow?.paid_amount)} readOnly />
        </div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Saldo</label>
          <input className='form-control' value={formatMoney(selectedRow?.balance_amount)} readOnly />
        </div>

        <div className='col-md-4 mb-3'>
          <label className='form-label'>Monto a pagar</label>
          <input ref={amountRef} type='number' min='0.01' step='0.01' className='form-control' required />
        </div>
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Fecha de pago</label>
          <input ref={paymentDateRef} type='date' className='form-control' required />
        </div>
        <VdSelect
          label='Tipo de pago'
          col='col-md-4'
          required
          value={paymentMethod}
          onChange={setPaymentMethod}
          options={paymentMethodOptions.map(option => ({ value: option, label: option }))}
          placeholder='-- Seleccionar --'
        />
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Banco</label>
          <input ref={bankRef} type='text' className='form-control' />
        </div>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Nro operacion</label>
          <input ref={operationNumberRef} type='text' className='form-control' />
        </div>
        <div className='col-12 mb-3'>
          <label className='form-label'>Archivo de sustento</label>
          <input ref={paymentFileRef} type='file' className='form-control' />
        </div>
        <div className='col-12 mb-1'>
          <label className='form-label'>Observaciones</label>
          <textarea ref={observationsRef} className='form-control' rows='3' />
        </div>
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can('accounts-receivable') && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Cuentas por cobrar'>
    <AccountsReceivable {...properties} />
  </BaseAdminto>);
})
