import BaseAdminto from '@Adminto/Base';
import SubscriptionsRest from '@Rest/Admin/SubscriptionsRest';
import React, { useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import Swal from 'sweetalert2';
import Table from '../Components/Adminto/Table';
import DxButton from '../Components/dx/DxButton';
import CreateReactScript from '../Utils/CreateReactScript';
import ReactAppend from '../Utils/ReactAppend';

const subscriptionsRest = new SubscriptionsRest()

const Subscriptions = () => {
  const gridRef = useRef()

  const onStatusChange = async ({ id, status }) => {
    const result = await subscriptionsRest.status({ id, status })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar subscripcion',
      text: '¿Estas seguro de eliminar esta subscripcion?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await subscriptionsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table gridRef={gridRef} title='Subscripciones' rest={subscriptionsRest}
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
      exportable={true}
      pageSize={25}
      columns={[
        {
          dataField: 'id',
          caption: 'ID',
          visible: false
        },
        {
          dataField: 'name',
          caption: 'Proveedor',
        },
        {
          dataField: 'description',
          caption: 'Correo',
        },
        {
          dataField: 'is_user',
          caption: 'Es usuario',
          dataType: 'boolean',
          lookup: {
            dataSource: [
              { value: 1, text: 'Sí' },
              { value: 0, text: 'No' }
            ],
            valueExpr: 'value',
            displayExpr: 'text'
          },
          cellTemplate: (container, { data }) => {
            container.html(renderToString(<span>
              {
                data.is_user
                  ? <span className='text-primary'>
                    <i className=' mdi mdi-check me-1'></i>
                    Si
                  </span>
                  : <span className='text-danger'>
                    <i className='mdi mdi-close me-1'></i>
                    No
                  </span>
              }
            </span>))
          },
        },
        {
          dataField: 'created_formula',
          caption: 'Creó una formula',
          dataType: 'boolean',
          lookup: {
            dataSource: [
              { value: 1, text: 'Sí' },
              { value: 0, text: 'No' }
            ],
            valueExpr: 'value',
            displayExpr: 'text'
          },
          cellTemplate: (container, { data }) => {
            container.html(renderToString(<>
              {
                data.created_formula
                  ? <span className='text-primary'>
                    <i className=' mdi mdi-check me-1'></i>
                    Si
                  </span>
                  : <span className='text-danger'>
                    <i className='mdi mdi-close me-1'></i>
                    No
                  </span>
              }
            </>))
          }
        },
        {
          dataField: 'made_order',
          caption: 'Hizo un pedido',
          dataType: 'boolean',
          lookup: {
            dataSource: [
              { value: 1, text: 'Sí' },
              { value: 0, text: 'No' }
            ],
            valueExpr: 'value',
            displayExpr: 'text'
          },
          cellTemplate: (container, { data }) => {
            container.html(renderToString(<span>
              {
                data.made_order
                  ? <span className='text-primary'>
                    <i className=' mdi mdi-check me-1'></i>
                    Si
                  </span>
                  : <span className='text-danger'>
                    <i className='mdi mdi-close me-1'></i>
                    No
                  </span>
              }
            </span>))
          }
        },
        {
          dataField: 'created_at',
          caption: 'Fecha subscripcion',
          dataType: 'datetime',
          format: 'yyyy-MM-dd HH:mm:ss',
          sortOrder: 'desc'
        },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          cellTemplate: (container, { data }) => {
            switch (data.status) {
              case 1:
                ReactAppend(container, <span className='badge bg-success rounded-pill'>Activo</span>)
                break
              case 0:
                ReactAppend(container, <span className='badge bg-danger rounded-pill'>Inactivo</span>)
                break
              default:
                ReactAppend(container, <span className='badge bg-dark rounded-pill'>Eliminado</span>)
                break
            }
          }
        },
        {
          caption: 'Acciones',
          cellTemplate: (container, { data }) => {
            container.append(DxButton({
              className: 'btn btn-xs btn-light',
              title: data.status === null ? 'Restaurar' : 'Cambiar estado',
              icon: data.status === 1 ? 'fa fa-toggle-on text-success' : data.status === 0 ? 'fa fa-toggle-off text-danger' : 'fas fa-trash-restore',
              onClick: () => onStatusChange(data)
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
  </>
  )
}

CreateReactScript((el, properties) => {

  createRoot(el).render(<BaseAdminto {...properties} title='Subscripciones'>
    <Subscriptions {...properties} />
  </BaseAdminto>);
})