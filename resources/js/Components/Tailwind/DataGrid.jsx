import React, { useEffect } from 'react'

const DataGrid = ({ gridRef: dataGridRef, rest, columns, toolBar, masterDetail, filterValue, exportable, exportableName, customizeCell = () => { }, selectable = false}) => {
  useEffect(() => {
    DevExpress.localization.locale(navigator.language);
    $(dataGridRef.current).dxDataGrid({
      language: "es",
      dataSource: {
        load: async (params) => {
          const data = await rest.paginate({ ...params, _token: $('[name="csrf_token"]').attr('content') })
          return data
        },
      },
      onToolbarPreparing: (e) => {
        const { items } = e.toolbarOptions;
        toolBar(items)
      },
      remoteOperations: true,
      columnResizingMode: "widget",
      allowColumnResizing: true,
      allowColumnReordering: true,
      columnAutoWidth: true,
      scrollbars: 'auto',
      filterPanel: { visible: true },
      searchPanel: { visible: true },
      headerFilter: { visible: true, search: { enabled: true } },
      height: 'calc(100vh - 250px)',
      filterValue: filterValue ? filterValue : null,
      export: {
        enabled: exportable
      },
      selection: selectable ? {
        mode: 'multiple',
        selectAllMode: 'page'
      }: undefined,
      onExporting: function (e) {
        var workbook = new ExcelJS.Workbook();
        var worksheet = workbook.addWorksheet('Main sheet');
        DevExpress.excelExporter.exportDataGrid({
          worksheet: worksheet,
          component: e.component,
          customizeCell: function (options) {
            customizeCell(options)
            options.excelCell.alignment = {
              horizontal: 'left',
              vertical: 'top',
              ...options.excelCell.alignment
            };
          }
        }).then(function () {
          workbook.xlsx.writeBuffer().then(function (buffer) {
            saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `${exportableName}.xlsx`);
          });
        });
      },
      rowAlternationEnabled: true,
      showBorders: true,
      filterRow: {
        visible: true,
        applyFilter: "auto"
      },
      filterBuilderPopup: {
        visible: false,
        position: {
          of: window, at: 'top', my: 'top', offset: { y: 10 },
        },
      },
      paging: {
        pageSize: 10,
      },
      pager: {
        visible: true,
        allowedPageSizes: [5, 10, 25, 50, 100],
        showPageSizeSelector: true,
        showInfo: true,
        showNavigationButtons: true,
      },
      allowFiltering: true,
      scrolling: {
        mode: 'standard',
        useNative: true,
        preloadEnabled: true,
        rowRenderingMode: 'standard'
      },
      columnChooser: {
        title: 'Mostrar/Ocultar columnas',
        enabled: true,
        mode: 'select',
        search: { enabled: true }
      },
      columns,
      masterDetail,
      onContentReady: (...props) => {
        tippy('.tippy-here', { arrow: true, animation: 'scale' })
      }
    }).dxDataGrid('instance')

    tippy('.dx-button', { arrow: true })
  }, [null])

  return (
    <div id='grid-container' ref={dataGridRef}></div>
  )
}

export default DataGrid