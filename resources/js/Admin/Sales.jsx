import BaseAdminto from '@Adminto/Base';
import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import SalesRest from '../Actions/Admin/SalesRest';
import Table from '../Components/Adminto/Table';
import CreateReactScript from '../Utils/CreateReactScript';
import Number2Currency from '../Utils/Number2Currency';
import ReactAppend from '../Utils/ReactAppend';
import DxButton from '../Components/dx/DxButton';
import Modal from '../Components/Adminto/Modal';
import Swal from 'sweetalert2';
import buildSchedule from '../Utils/buildSchedule';

const salesRest = new SalesRest()

const Sales = ({ }) => {
  const gridRef = useRef()
  const modalRef = useRef()

  const [dataLoaded, setDataLoaded] = useState(null)

  const onPaidToSellerClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Marcar como pagado?',
      text: '¿Estás seguro? Asegúrate de haber pagado al vendedor antes de confirmar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, marcar',
      cancelButtonText: 'Cancelar'
    });

    if (!isConfirmed) return

    const result = await salesRest.boolean({ id, field: 'paid_to_seller', value: true });
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh();
    $(modalRef.current).modal('hide')
  }

  const onConfirmClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Confirmar pedido?',
      text: 'Esta acción es irreversible. Asegúrese de que el pago ha sido confirmado y el monto aparece en su cuenta.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar'
    });

    if (!isConfirmed) return

    const result = await salesRest.save({ id, status_id: 'f47ac20c-58cc-11ef-8f8e-0242ac120002' });
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh();
    $(modalRef.current).modal('hide')
  }

  const onRejectClicked = async (id) => {
    const { value: reject_reason } = await Swal.fire({
      title: '¿Rechazar pedido?',
      text: 'Esta acción es irreversible. Por favor, indique el motivo del rechazo.',
      input: 'textarea',
      inputPlaceholder: 'Escriba el motivo del rechazo...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, rechazar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debe ingresar un motivo para rechazar';
        }
      }
    });

    if (!reject_reason) return

    const result = await salesRest.save({ id, status_id: 'f47ac50f-58cc-11ef-8f8e-0242ac120002', reject_reason });
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh();
    $(modalRef.current).modal('hide')
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Anular pedido',
      text: '¿Estas seguro de anular este pedido?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, anular',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await salesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table gridRef={gridRef} title='Pedidos' rest={salesRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
          }
        });
      }}
      exportable
      pageSize={25}
      columns={[
        {
          dataField: 'id',
          caption: 'ID de pedido',
          width: '120px',
          cellTemplate: (container, { data }) => {
            container.text(`MS${String(data.id).padStart(8, '0')}`)
          }
        },
        {
          dataField: 'date',
          caption: 'Fecha',
          dataType: 'date',
          width: '100px',
          format: 'dd MMM yyyy',
        },
        {
          dataField: 'seller.fullname',
          caption: 'Vendedor',
          width: '240px',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <div style={{ width: '230px' }}>
              <span className='d-block text-truncate'>{data.seller.fullname}</span>
              <small className='d-block text-muted text-truncate'>
                <i className='mdi mdi-email me-1' />
                {data.seller.email}
              </small>
              <small className='d-block text-muted text-truncate'>
                <i className='mdi mdi-phone me-1' />
                {data.seller.phone}
              </small>
            </div>)
          }
        },
        {
          dataField: 'customer.fullname',
          caption: 'Comprador',
          width: '240px',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <div style={{ width: '230px' }}>
              <span className='d-block text-truncated'>{data.customer.fullname}</span>
              <small className='d-block text-muted text-truncated'>
                <i className='mdi mdi-email me-1' />
                {data.customer.email}
              </small>
              <small className='d-block text-muted text-truncated'>
                <i className='mdi mdi-phone me-1' />
                {data.customer.phone ?? data.phone}
              </small>
            </div>)
          }
        },
        {
          caption: 'Cartas',
          width: '220px',
          cellTemplate: (container, { data }) => {
            const firstCard = data?.details?.[0]?.card?.fullname;
            const itemsCount = data?.details_count || 0;
            const otherCards = itemsCount - 1
            ReactAppend(container, <div style={{ width: '210px' }}>
              <span className='d-block' style={{ whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                {firstCard} {itemsCount > 1 && <>+ {otherCards} más</>}
              </span>
              <small className='d-block text-muted'>{itemsCount} carta{itemsCount != 1 && 's'}</small>
            </div>)
          }
        },
        {
          dataField: 'total_amount',
          caption: 'Total',
          width: '100px',
          cellTemplate: (container, { data }) => {
            container.text(`S/ ${Number2Currency(data.total_amount)}`)
          }
        },
        {
          dataField: 'delivery_point_name',
          caption: 'Punto de entrega'
        },
        {
          dataField: 'ready_for_pickup_at',
          caption: 'Fecha entrega',
          dataType: 'date',
          width: '120px',
          format: 'dd MMM yyyy',
        },
        {
          dataField: 'billing',
          caption: 'Pagado a',
          window: '80px',
          lookup: {
            dataSource: [
              { value: 'masterset', text: 'MasterSet' },
              { value: 'seller', text: 'Vendedor' }
            ],
            valueExpr: 'value',
            displayExpr: 'text'
          },
        },
        {
          dataField: 'status.name',
          caption: 'Estado',
          width: '180px',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <div className='text-center' style={{ width: '170px' }}>
              <span className="badge rounded-pill fs-13" style={{
                backgroundColor: `${data.status.hex}22`,
                color: data.status.hex
              }}>
                <i className='mdi mdi-circle me-1' style={{ color: data.status.hex }} />
                {data.status.name}
              </span>
            </div>)
          }
        },
        {
          dataField: 'paid_to_seller',
          caption: 'Estado de pago',
          width: '130px',
          cellTemplate: (container, { value, text }) => {
            ReactAppend(container, <div className='text-center' style={{ width: '120px' }}>
              <span className='badge rounded-pill fs-13' style={{
                backgroundColor: value ? '#188ae222' : '#5b69bc22',
                color: value ? '#188ae2' : '#5b69bc'
              }}>
                <i className={`mdi mdi-${value ? 'check' : 'timer-sand-full'} me-1`} />
                {text}
              </span>
            </div>)
          },
          lookup: {
            dataSource: [
              { value: true, text: 'Pagado' },
              { value: false, text: 'Pendiente' }
            ],
            valueExpr: 'value',
            displayExpr: 'text'
          },
        },
        {
          caption: 'Acciones',
          width: '200px',
          cellTemplate: (container, { data }) => {
            container.append(DxButton({
              className: 'btn btn-sm btn-soft-info',
              title: 'Ver detalles',
              icon: 'mdi mdi-eye',
              onClick: () => {
                setDataLoaded(data)
                $(modalRef.current).modal('show')
              }
            }));

            if ((
              data.status_id === 'f47ac40e-58cc-11ef-8f8e-0242ac120002' ||
              data.status_id === 'f47ac30d-58cc-11ef-8f8e-0242ac120002'
            ) && !data.paid_to_seller) {
              container.append(DxButton({
                className: 'btn btn-sm btn-soft-success',
                title: 'Marcar como pagado',
                icon: 'mdi mdi-cash-check',
                onClick: () => onPaidToSellerClicked(data.id)
              }));
            }

            if (data.status_id === 'f47ac10b-58cc-11ef-8f8e-0242ac120002' && data.billing === 'masterset') {
              container.append(DxButton({
                className: 'btn btn-sm btn-soft-success',
                title: 'Confirmar pedido',
                icon: 'mdi mdi-check',
                onClick: () => onConfirmClicked(data.id)
              }));
              container.append(DxButton({
                className: 'btn btn-sm btn-soft-danger',
                title: 'Rechazar pedido',
                icon: 'mdi mdi-close',
                onClick: () => onRejectClicked(data.id)
              }));
              container.append(DxButton({
                className: 'btn btn-sm btn-soft-dark',
                title: 'Anular pedido',
                icon: 'mdi mdi-cancel',
                onClick: () => onDeleteClicked(data.id)
              }));
            }
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
    <Modal modalRef={modalRef} title={`Pedido #MS${String(dataLoaded?.id).padStart(8, '0')}`} hideFooter onClose={() => setDataLoaded(null)} isStatic size='lg'>
      <div className="row">
        <div className='col-md-6 mb-3'>
          <h5 className="mb-2">Vendedor</h5>
          <div className="border rounded p-2">
            <div className="fw-bold">{dataLoaded?.seller?.fullname}</div>
            <div className="text-muted small">{dataLoaded?.seller?.email}</div>
            <div className="text-muted small">{dataLoaded?.seller?.phone}</div>
          </div>
        </div>
        <div className='col-md-6 mb-3'>
          <h5 className="mb-2">Comprador</h5>
          <div className="border rounded p-2">
            <div className="fw-bold">{dataLoaded?.customer?.fullname}</div>
            <div className="text-muted small">{dataLoaded?.customer?.email}</div>
            <div className="text-muted small">{dataLoaded?.customer?.phone ?? dataLoaded?.customer?.phone}</div>
          </div>
        </div>
      </div>

      <div className='mb-3'>
        <h5 className="mb-2">Punto de entrega</h5>
        <div className="border rounded p-2">
          <div className="d-flex align-items-center gap-3 mb-2">
            <i className='mdi mdi-store text-muted fs-4'></i>
            <div>
              <div className='fw-semibold'>{dataLoaded?.delivery_point_name}</div>
              <small className='text-muted'>{dataLoaded?.delivery_point_district}, {dataLoaded?.delivery_point_department}</small>
            </div>
          </div>
          <div className='text-muted small'>
            <div className='mb-1'>
              <i className='mdi mdi-map-marker-outline me-1'></i>
              {dataLoaded?.delivery_point_address} {dataLoaded?.delivery_point_number} {dataLoaded?.delivery_point_reference && `(${dataLoaded?.delivery_point_reference})`}
            </div>
            <div>
              <i className='mdi mdi-clock-outline me-1'></i>
              {buildSchedule(dataLoaded?.delivery_point_opening_hours)}
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-3 align-items-center justify-content-between">
        <div className="col-auto">
          <h5 className="mb-2">Estado & Pago</h5>
          <div className='mb-1'>
            <span className="text-muted me-1">Estado del pedido:</span>
            <span className="badge rounded-pill fs-13" style={{
              backgroundColor: `${dataLoaded?.status.hex}22`,
              color: dataLoaded?.status.hex
            }}>
              <i className='mdi mdi-circle me-1' style={{ color: dataLoaded?.status.hex }} />
              {dataLoaded?.status.name}
            </span>
          </div>
          {
            (dataLoaded?.status_id == 'f47ac50f-58cc-11ef-8f8e-0242ac120002' || dataLoaded?.status_id == 'f47ac610-58cc-11ef-8f8e-0242ac120002')
              ? <div>Motivo: {dataLoaded?.reject_reason}</div>
              : <div className='mb-1'>
                <span className="text-muted me-1">Estado de pago:</span>
                <span className="badge rounded-pill fs-13" style={{
                  backgroundColor: `${dataLoaded?.paid_to_seller ? '#188ae222' : '#5b69bc22'}`,
                  color: dataLoaded?.paid_to_seller ? '#188ae2' : '#5b69bc'
                }}>
                  <i className={`mdi mdi-${dataLoaded?.paid_to_seller ? 'check' : 'timer-sand-full'} me-1`} />
                  {dataLoaded?.paid_to_seller ? 'Pagado' : 'Pendiente'}
                </span>
              </div>
          }
          {
            (
              dataLoaded?.status_id === 'f47ac40e-58cc-11ef-8f8e-0242ac120002' ||
              dataLoaded?.status_id === 'f47ac30d-58cc-11ef-8f8e-0242ac120002'
            ) && !dataLoaded?.paid_to_seller &&
            <button className="btn btn-sm btn-soft-success mt-2" onClick={() => onPaidToSellerClicked(dataLoaded.id)}>
              <i className="mdi mdi-cash-check me-1"></i>Marcar como pagado
            </button>
          }
        </div>
        <div className="col-auto">
          {dataLoaded?.receipt ? (
            <img
              src={`/storage/images/receipts/${dataLoaded.receipt}`}
              alt="Comprobante"
              className="img-fluid rounded border"
              style={{ maxHeight: '90px', cursor: 'pointer', aspectRatio: 1, objectFit: 'cover', objectPosition: 'center' }}
              onClick={() => window.open(`/storage/images/receipts/${dataLoaded.receipt}`, '_blank')}
            />
          ) : (
            <div className="text-muted small">Sin comprobante</div>
          )}
        </div>
      </div>

      <div>
        <h5 className="mb-2">Cartas compradas</h5>
        <table className="table table-sm table-bordered mb-0">
          <thead>
            <tr>
              <th>Carta</th>
              <th>Cantidad</th>
              <th>Precio</th>
            </tr>
          </thead>
          <tbody>
            {dataLoaded?.details?.map((d, idx) => (
              <tr key={idx}>
                <td>
                  {d.card?.fullname}
                  <small className='d-block text-muted'>Condición: {d.condition}</small>
                  <small className='d-block text-muted'>Variante: {d.variant}</small>
                </td>
                <td>{d.quantity}</td>
                <td>S/ {Number2Currency(d.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {
        (dataLoaded?.status_id === 'f47ac10b-58cc-11ef-8f8e-0242ac120002' && dataLoaded?.billing === 'masterset') &&
        <div className="text-end d-flex gap-2 justify-content-end mt-3">
          <button className="btn btn-success" onClick={() => onConfirmClicked(dataLoaded.id)}>
            <i className="mdi mdi-check me-1"></i>Confirmar
          </button>
          <button className="btn btn-danger" onClick={() => onRejectClicked(dataLoaded.id)}>
            <i className="mdi mdi-close me-1"></i>Rechazar
          </button>
        </div>
      }
    </Modal>
  </>
  )
}

CreateReactScript((el, properties) => {

  createRoot(el).render(<BaseAdminto {...properties} title='Pedidos'>
    <Sales {...properties} />
  </BaseAdminto>);
})