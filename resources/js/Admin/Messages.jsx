import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '@Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import DxButton from '../Components/dx/DxButton';
import ReactAppend from '@Utils/ReactAppend';
import MessagesRest from '@Rest/Admin/MessagesRest';
import Modal from '@Adminto/Modal';
import Swal from 'sweetalert2';

const messagesRest = new MessagesRest()

const Messages = () => {
  const gridRef = useRef()
  const modalRef = useRef()

  const [dataLoaded, setDataLoaded] = useState(null)

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar mensaje',
      text: '¿Estas seguro de eliminar este mensaje?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await messagesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onModalOpen = (data) => {
    if (!data.seen) {
      messagesRest.boolean({
        id: data,
        field: 'seen',
        value: true
      })
      $(gridRef.current).dxDataGrid('instance').refresh()
    }
    setDataLoaded(data)
    $(modalRef.current).modal('show');
  }

  return (<>
    <Table gridRef={gridRef} title='Mensajes' rest={messagesRest}
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
      columns={[
        {
          dataField: 'id',
          caption: 'ID',
          visible: false
        },
        {
          dataField: 'name',
          caption: 'Nombre',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <span style={{
              width: '100%',
              fontWeight: data.seen ? 'lighter' : 'bold',
              cursor: 'pointer'
            }} onClick={() => onModalOpen(data)}>
              {data.name}
            </span>)
          }
        },
        {
          dataField: 'email',
          caption: 'Correo',
        },
        {
          dataField: 'created_at',
          caption: 'Fecha',
          dataType: 'datetime',
          format: 'yyyy-MM-dd HH:mm:ss',
          sortOrder: 'desc'
        },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          cellTemplate: (container, { data }) => {
            if (data.seen) {
              ReactAppend(container, <span className='badge bg-success rounded-pill'>Leído</span>)
            } else {
              ReactAppend(container, <span className='badge bg-danger rounded-pill'>No leído</span>)
            }
          }
        },
        {
          caption: 'Acciones',
          cellTemplate: (container, { data }) => {
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-dark',
              title: 'Ver mensaje',
              icon: 'fa fa-eye',
              onClick: () => onModalOpen(data)
            }))
            // container.append(DxButton({
            //   className: 'btn btn-xs btn-light',
            //   title: data.status === null ? 'Restaurar' : 'Cambiar estado',
            //   icon: data.status === 1 ? 'fa fa-toggle-on text-success' : data.status === 0 ? 'fa fa-toggle-off text-danger' : 'fas fa-trash-restore',
            //   onClick: () => onStatusChange(data)
            // }))
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
    <Modal modalRef={modalRef} title='Mensaje' hideFooter >
      <p>
        <b>Nombre</b>:
        <span className='ms-1'>{dataLoaded?.name}</span>
      </p>
      <p>
        <b>Correo</b>:
        <span className='ms-1'>{dataLoaded?.email || <i className='text-muted'>- Sin correo -</i>}</span>
      </p>
      <p>
        <b>Asunto</b>:
        <span className='ms-1'>{dataLoaded?.subject}</span>
      </p>
      <p>
        <b>Mensaje</b>:
        <span className='ms-1'>{dataLoaded?.description}</span>
      </p>
    </Modal>
  </>
  )
}

CreateReactScript((el, properties) => {

  createRoot(el).render(<BaseAdminto {...properties} title='Mensajes'>
    <Messages {...properties} />
  </BaseAdminto>);
})