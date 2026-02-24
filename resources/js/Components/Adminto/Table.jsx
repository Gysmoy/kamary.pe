import React from 'react'
import DataGrid from './DataGrid'
import { renderToString } from 'react-dom/server'

const Table = ({ title, gridRef, rest, columns, toolBar, masterDetail, filterValue = null, allowQueryBuilder, isLoading, onRefresh, exportable, pageSize, hidden }) => {

  const html = renderToString(<div>{title}</div>)
  const text = $(html).text().trim().clean('-')

  return (<div className="row position-relative" hidden={hidden}>
    {
      isLoading && <div style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        position: 'absolute',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        backgroundColor: 'rgba(255,255,255,0.8)',
      }} role="status">
        <i className="mdi mdi-spin mdi-loading mdi-48px"></i>
      </div>
    }
    <div className="col-12">
      <div className="card">
        {
          typeof title == 'object'
            ? <div className='card-header'>{title}</div>
            : ''
        }
        <div className="card-body">
          {
            typeof title != 'object'
              ? <h4 className="header-title">
                <div id="header-title-options" className="float-end"></div>
                <span id="header-title-prefix"></span> Lista de {title} <span id="header-title-suffix"></span>
              </h4>
              : ''
          }
          <DataGrid gridRef={gridRef} rest={rest} allowQueryBuilder={allowQueryBuilder} columns={columns.filter(Boolean)} toolBar={toolBar} exportable={exportable} exportableName={text.toLowerCase()} masterDetail={masterDetail} filterValue={filterValue} pageSize={pageSize} onRefresh={onRefresh} />
        </div>
      </div>
    </div>
  </div>
  )
}

export default Table