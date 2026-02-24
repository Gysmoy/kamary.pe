import React from 'react'
import DataGrid from './DataGrid'

const Table = ({ title, gridRef, rest, columns, toolBar, masterDetail, filterValue, exportable = false, customizeCell, selectable = false }) => {
  return (
    <DataGrid
      exportableName={title}
      gridRef={gridRef}
      rest={rest}
      columns={columns.filter(Boolean)}
      toolBar={toolBar}
      masterDetail={masterDetail}
      filterValue={filterValue}
      exportable={exportable}
      customizeCell={customizeCell}
      selectable={selectable}
    />)
}

export default Table