import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import DxButton from '../Components/dx/DxButton';
import AccountsPayableRest from '../Actions/Admin/AccountsPayableRest';
import { scopedPermission } from '../Utils/permissionScope';
import {
  getPaymentStatusLabel,
  paymentStatusOptions,
  toLookup,
} from '../Utils/statusLabels';

const accountsPayableRest = new AccountsPayableRest()

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
const fileUrl = (filename) => filename ? `/api/admin/accounts-payable/payments/media/${filename}` : null

const AccountsPayable = () => {
  const gridRef = useRef()
  const modalRef = useRef()
  const paymentModalRef = useRef()

  const amountRef = useRef()
  const paymentDateRef = useRef()
  const paymentMethodRef = useRef()
  const bankRef = useRef()
  const operationNumberRef = useRef()
  const paymentFileRef = useRef()
  const observationsRef = useRef()

  const [selectedRow, setSelectedRow] = useState(null)

  const refreshGrid = () => $(gridRef.current).dxDataGrid('instance').refresh()

  const resetPaymentForm = (row = null) => {
    if (amountRef.current) amountRef.current.value = row ? formatMoney(row.balance_amount) : ''
    if (paymentDateRef.current) paymentDateRef.current.value = new Date().toISOString().slice(0, 10)
    if (paymentMethodRef.current) paymentMethodRef.current.value = 'Transferencia'
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

    const formData = new FormData()
    formData.append('amount', amountRef.current?.value || '')
    formData.append('payment_date', paymentDateRef.current?.value || '')
    formData.append('payment_method', paymentMethodRef.current?.value || '')
    formData.append('bank', bankRef.current?.value || '')
    formData.append('operation_number', operationNumberRef.current?.value || '')
    formData.append('observations', observationsRef.current?.value || '')

    const file = paymentFileRef.current?.files?.[0]
    if (file) formData.append('payment_file', file)

    const result = await accountsPayableRest.registerPayment(selectedRow.id, formData)
    if (!result?.data) return

    setSelectedRow(result.data)
    $(paymentModalRef.current).modal('hide')
    refreshGrid()
  }

  return (<>
    <Table
      gridRef={gridRef}
      title='Cuentas por pagar'
      rest={accountsPayableRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: refreshGrid
          }
        });
      }}
      pageSize={25}
      columns={[
        { dataField: 'id', caption: 'ID', width: 80 },
        { dataField: 'code', caption: 'Codigo', width: 130 },
        { dataField: 'purchase_receipt_code', caption: 'Recepcion', width: 130 },
        { dataField: 'purchase_order_code', caption: 'OC', width: 130 },
        { dataField: 'supplier.business_name', caption: 'Proveedor', minWidth: 220 },
        { dataField: 'document_type', caption: 'Tipo doc', width: 100 },
        { dataField: 'series', caption: 'Serie', width: 90 },
        { dataField: 'sequence', caption: 'Secuencia', width: 110 },
        { dataField: 'issue_date', caption: 'F. emision', width: 110, dataType: 'date' },
        { dataField: 'due_date', caption: 'F. vcto', width: 110, dataType: 'date' },
        { dataField: 'payment_condition', caption: 'Condicion', width: 100 },
        { dataField: 'currency', caption: 'Moneda', width: 90 },
        { dataField: 'total', caption: 'Total', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
        { dataField: 'paid_amount', caption: 'Pagado', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
        { dataField: 'balance_amount', caption: 'Saldo', width: 110, dataType: 'number', format: { type: 'fixedPoint', precision: 2 } },
        { dataField: 'payment_status', caption: 'Estado pago', width: 110, lookup: toLookup(paymentStatusOptions) },
        {
          dataField: 'installments.id',
          caption: 'Cuotas',
          width: 90,
          allowFiltering: false,
          cellTemplate: (container, { data }) => {
            container.text((data?.installments ?? []).length || 0)
          }
        },
        {
          dataField: 'payments.id',
          caption: 'Pagos',
          width: 90,
          allowFiltering: false,
          cellTemplate: (container, { data }) => {
            container.text((data?.payments ?? []).length || 0)
          }
        },
        {
          caption: 'Acciones',
          width: 140,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-primary',
              title: 'Ver detalle',
              icon: 'mdi mdi-eye',
              onClick: () => onViewDetail(data)
            }))

            if (data?.status && Number(data?.balance_amount || 0) > 0) {
              container.append(DxButton({
                className: 'btn btn-xs btn-soft-success ms-1',
                title: 'Registrar pago',
                icon: 'mdi mdi-cash-plus',
                onClick: () => onOpenPayment(data)
              }))
            }
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]}
    />

    <Modal modalRef={modalRef} title='Detalle de cuenta por pagar' size='xl' hideFooter>
      <div className='row'>
        <div className='col-md-4 mb-2'><strong>Codigo:</strong> {selectedRow?.code || '-'}</div>
        <div className='col-md-4 mb-2'><strong>Recepcion:</strong> {selectedRow?.purchase_receipt_code || '-'}</div>
        <div className='col-md-4 mb-2'><strong>Orden compra:</strong> {selectedRow?.purchase_order_code || '-'}</div>
        <div className='col-md-6 mb-2'><strong>Proveedor:</strong> {selectedRow?.supplier?.business_name || '-'}</div>
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
                  <tr key={`accounts-payable-installment-${installment.id}`}>
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
                  <tr key={`accounts-payable-payment-${payment.id}`}>
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
        <div className='col-md-4 mb-3'>
          <label className='form-label'>Tipo de pago</label>
          <select ref={paymentMethodRef} className='form-control' required>
            {paymentMethodOptions.map(option => (
              <option key={`accounts-payable-payment-method-${option}`} value={option}>{option}</option>
            ))}
          </select>
        </div>
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
  if (!properties.can(scopedPermission('accounts-payable')) && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Cuentas por pagar'>
    <AccountsPayable {...properties} />
  </BaseAdminto>);
})
