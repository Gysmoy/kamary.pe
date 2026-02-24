
import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import CreateReactScript from '../Utils/CreateReactScript';
import Base from '../Components/Adminto/Base';
import TippyButton from '../Components/Adminto/form/TippyButton';
import ReactAppend from '../Utils/ReactAppend';
import Table from '../Components/Adminto/Table';
import SendingHistoryRest from '../actions/Admin/SendingHistoryRest';
import DxPanelButton from '../Components/Adminto/Dx/DxPanelButton';
import Modal from '../Components/Adminto/Modal';
import DataGrid from '../Components/Adminto/DataGrid';
import HistoryDetailsRest from '../actions/Admin/HistoryDetailsRest';

const sendingHistoryRest = new SendingHistoryRest()
const historyDetailsRest = new HistoryDetailsRest()

const SendingHistory = () => {
  const gridRef = useRef()
  const detailsGridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const tableRef = useRef()
  const descriptionRef = useRef()

  const [dataLoaded, setDataLoaded] = useState(false)

  const onModalOpen = (data) => {
    setDataLoaded(data)
    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      table_id: tableRef.current.value,
      name: nameRef.current.value,
      description: descriptionRef.current.value,
    }

    const result = await sendingHistoryRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onStatusChange = async ({ id, status }) => {
    const result = await sendingHistoryRest.status({ id, status })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const result = await sendingHistoryRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onReSendClicked = async (id) => {
    const result = await sendingHistoryRest.reSend(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table gridRef={gridRef} title={<h4 className='header-title my-0'>Historial de envios</h4>} rest={sendingHistoryRest}
      toolBar={(container) => {
        container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-dark',
          text: 'Actualizar',
          title: 'Refrescar tabla',
          icon: 'fas fa-undo-alt',
          onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
        }))
      }}
      pageSize={25}
      columns={[
        {
          dataField: 'created_at',
          dataType: 'datetime',
          caption: 'Fecha',
          width: '180px',
          sortOrder: 'desc',
          cellTemplate: (container, { data }) => {
            container.text(moment(data.created_at?.replace('Z', '+00:00')).format('lll'))
          }
        },
        {
          dataField: 'type',
          caption: 'Tipo',
          width: '120px',
          cellTemplate: (container, { value }) => {
            if (value == 'WhatsApp') {
              ReactAppend(container, <>
                <i className='mdi mdi-whatsapp me-1'></i>
                {value}
              </>)
            } else {
              ReactAppend(container, <>
                <i className='mdi mdi-email me-1'></i>
                {value}
              </>)
            }
          }
        },
        {
          dataField: 'name',
          caption: 'Plantilla'
        },
        {
          dataField: 'completed',
          caption: 'Completados',
          dataType: 'number',
          width: '80px',
          cssClass: 'text-success font-bold',
        },
        {
          dataField: 'failed',
          caption: 'Fallidos',
          dataType: 'number',
          width: '80px',
          cssClass: 'text-danger font-bold',
        },
        {
          dataField: 'total',
          caption: 'Total',
          dataType: 'number',
          width: '80px',
          cssClass: 'text-primary font-bold',
        },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          width: '140px',
          cellTemplate: (container, { data }) => {
            if (data.status === 1) ReactAppend(container, <>
              <i className='mdi mdi-check me-1'></i>
              <span>Terminado</span>
            </>)
            if (data.status === 0) ReactAppend(container, <>
              <i className='mdi mdi-alert me-1'></i>
              <span>Fallido</span>
            </>)
            if (data.status === null) {
              const percent = (data.completed + data.failed) / data.total * 100
              ReactAppend(container, <>
                <i className='mdi mdi-spin mdi-autorenew me-1'></i>
                <span className='me-1'>En curso</span>
                <small className='text-muted'>{percent.toFixed(2)}%</small>
              </>)
            }
          },
          lookup: {
            dataSource: [
              { key: 1, value: 'Completado' },
              { key: 0, value: 'Enviando' },
              { key: null, value: 'Pendiente' }
            ],
            valueExpr: 'key',
            displayExpr: 'value'
          }
        },
        {
          caption: 'Acciones',
          width: '130px',
          cellTemplate: (container, { data }) => {
            container.attr('style', 'display: flex; gap: 4px; overflow: unset')

            if (data.status === 0) ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-primary' title='Reintentar envio' onClick={() => onReSendClicked(data.id)}>
              <i className='mdi mdi-reload'></i>
            </TippyButton>)

            if (data.status !== null) ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-dark' title='Ver detalles de envio' onClick={() => onModalOpen(data)}>
              <i className='mdi mdi-format-list-bulleted-type'></i>
            </TippyButton>)
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
    <Modal modalRef={modalRef} title={<div>
      <h4 className='modal-title my-0'>Detalles de envío</h4>
      <small className='text-muted'>{dataLoaded?.name}</small>
    </div>}
      size='xl'
      onClose={() => setDataLoaded(null)}
      hideFooter>
      <DataGrid gridRef={detailsGridRef}
        rest={historyDetailsRest}
        filterValue={['sending_history_id', '=', dataLoaded?.id ?? null]}
        toolBar={(container) => {
          container.unshift(DxPanelButton({
            className: 'btn btn-xs btn-soft-dark',
            text: 'Actualizar',
            title: 'Refrescar tabla',
            icon: 'fas fa-undo-alt',
            onClick: () => $(detailsGridRef.current).dxDataGrid('instance').refresh()
          }))
        }}
        pageSize={25}
        allowQueryBuilder={false}
        columns={[
          {
            dataField: 'sending_history_id',
            caption: 'ID Historial',
            visible: false
          },
          {
            dataField: 'sent_to',
            caption: 'Destinatario',
          },
          {
            dataField: 'seen',
            caption: 'Visualización',
            dataType: 'boolean',
            cellTemplate: (container, { data }) => {
              ReactAppend(container, data.status
                ? <span className='text-primary font-bold'>
                  <i className='mdi mdi-email-open me-1'></i>
                  Abierto
                </span>
                : <span className='text-muted'>
                  <i className='mdi mdi-email me-1'></i>
                  No abierto
                </span>)
            },
            width: '150px'
          },
          {
            dataField: 'status',
            caption: 'Estado',
            dataType: 'boolean',
            cellTemplate: (container, { data }) => {
              ReactAppend(container, data.status
                ? <span className='text-success font-bold'>
                  <i className='mdi mdi-check me-1'></i>
                  Enviado
                </span>
                : <span className='text-danger font-bold'>
                  <i className='mdi mdi-alert me-1'></i>
                  No enviado
                </span>)
            },
            width: '150px'
          },
          {
            dataField: 'error',
            caption: 'Error',
            cssClass: 'text-danger',
            // cellTemplate: (container, { value }) => {
            //   container.html(renderToString(<span className='text-danger'>{value}</span>))
            // }
          },
          {
            dataField: 'created_at',
            dataType: 'datetime',
            caption: 'Fecha',
            width: '200px',
            sortOrder: 'desc',
            cellTemplate: (container, { data }) => {
              ReactAppend(container, <>{moment(data.created_at?.replace('Z', '+00:00')).format('lll')}</>)
            }
          },
        ]}
      />
    </Modal>
  </>
  )
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Base {...properties} title='Historial de envios'>
      <SendingHistory {...properties} />
    </Base>
  );
})
