import React, { useRef } from 'react';
import Table from '../Tailwind/Table';
import SalesRest from '../../Actions/Customer/SalesRest';
import Tippy from '@tippyjs/react';
import ReactAppend from '../../Utils/ReactAppend';
import DxButton from '../dx/DxButton';
import Number2Currency from '../../Utils/Number2Currency';

const salesRest = new SalesRest()

const Sales = ({ }) => {

  const gridRef = useRef()

  return (
    <div>
      <h2 className='text-xl border-b pb-2 mb-4 font-bold'>
        Historial de compras 📃
      </h2>

      <div className='p-0'>

        <Table gridRef={gridRef} rest={salesRest}
          toolBar={(container) => {
            container.unshift({
              widget: 'dxButton', location: 'after',
              options: {
                icon: 'refresh', hint: 'Refrescar tabla',
                onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
              }
            });
          }}
          columns={[
            {
              caption: 'Compra',
              width: '325px',
              cellTemplate: (container, { data }) => {
                ReactAppend(container, <>
                  <b className='block text-lg'>Compraste {data?.bundle?.name || 'solo 1 producto'}</b>
                  <p><b>Formula</b>: {data.formula.name ?? 'Sin nombre'}</p>
                  <p><b>Envio a</b>: {data?.address} {data?.number}
                    <small className='opacity-75 block'>{data?.province ?? data?.district}, {data?.department}, {data?.country} {data?.zip_code && <>- {data?.zip_code}</>}</small></p>
                </>)
              }
            },
            {
              dataField: 'total_amount',
              caption: 'Total',
              dataType: 'number',
              cellTemplate: (container, { data }) => {
                container.css({
                  textAlign: 'center',
                  verticalAlign: 'middle'
                })
                container.text(`S/. ${Number2Currency(data.total_amount)}`)
              }
            },
            {
              dataField: 'status.name',
              caption: 'Estado',
              cellTemplate: (container, { data }) => {
                container.css({
                  verticalAlign: 'middle'
                })
                ReactAppend(container, <span className='block mx-auto w-max px-2 py-1 rounded-full' style={{
                  backgroundColor: data.status.color ? `${data.status.color}2e` : '#3333332e',
                  color: data.status.color ?? '#333'
                }}>{data.status.name}</span>)
              }
            },
            {
              dataField: 'created_at',
              caption: 'Fecha creacion',
              dataType: 'datetime',
              format: 'yyyy-MM-dd HH:mm:ss',
              sortOrder: 'desc',
              cellTemplate: (container, { text }) => {
                container.css({
                  textAlign: 'center',
                  verticalAlign: 'middle'
                })
                container.text(text)
              }
            }
          ]}
        />
      </div>
    </div>
  )
};

export default Sales;
