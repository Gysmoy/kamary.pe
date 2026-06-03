import React, { useEffect } from 'react'
import { Local } from 'sode-extend-react'
import { handleDataGridExport } from '../../Utils/dataGridExport'

const combineFilterValues = (baseFilter, userFilter) => {
  if (baseFilter && userFilter) return [baseFilter, 'and', userFilter]
  return baseFilter || userFilter
}

const DataGrid = ({ gridRef: dataGridRef, allowQueryBuilder = true, rest, columns, toolBar, masterDetail, filterValue = null, baseFilterValue = null, pageSize = 10, exportable, exportableName, customizeCell = () => { }, onRefresh = () => { } }) => {
  useEffect(() => {
    DevExpress.localization.locale(navigator.language);

    const emptyData = {
      totalCount: 0,
      data: []
    }

    $(dataGridRef.current).dxDataGrid({
      language: "es",
      dataSource: {
        load: async (params) => {
          try {
            if (filterValue && typeof params.filter === 'undefined') {
              return emptyData
            }
            const response = await rest.paginate({
              ...params,
              filter: combineFilterValues(baseFilterValue, params.filter)
            })
            const rows = Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response)
                ? response
                : []
            const totalCount = Number.isFinite(Number(response?.totalCount))
              ? Number(response.totalCount)
              : rows.length
            const data = response && typeof response === 'object' && !Array.isArray(response)
              ? { ...response, data: rows, totalCount }
              : { data: rows, totalCount }
            onRefresh(data)
            return data
          } catch (error) {
            if (error?.name === 'AbortError') return emptyData
            throw error
          }
        },
      },
      onToolbarPreparing: (e) => {
        const { items } = e.toolbarOptions;
        toolBar(items)

        // items.unshift({
        //   widget: 'dxButton',
        //   location: 'after',
        //   options: {
        //     icon: 'revert',
        //     hint: 'RESTABLECER TABLA',
        //     onClick: () => {
        //       const path = location.pathname
        //       const dxSettings = Local.get('dxSettings') || {}
        //       delete dxSettings[path]
        //       Local.set('dxSettings', dxSettings)
        //       $(dataGridRef.current).dxDataGrid('instance').state({})
        //     }
        //   }
        // });
      },
      remoteOperations: true,
      columnResizingMode: "widget",
      allowColumnResizing: true,
      allowColumnReordering: true,
      columnAutoWidth: true,
      scrollbars: 'auto',
      filterPanel: { visible: allowQueryBuilder },
      searchPanel: { visible: true },
      headerFilter: { visible: true, search: { enabled: true } },
      height: 'calc(100dvh - 235px)',
      filterValue,
      export: {
        enabled: exportable,
        formats: ['xlsx', 'pdf']
      },
      onExporting: function (e) {
        handleDataGridExport(e, { exportableName, customizeCell })
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
        pageSize,
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
      // onColumnsChanging: () => {
      //   const dataGrid = $(dataGridRef.current).dxDataGrid('instance')
      //   const state = dataGrid.state()

      //   if (Object.keys(state) == 0) return

      //   const path = location.pathname
      //   const dxSettings = Local.get('dxSettings') || {}
      //   if (JSON.stringify(dxSettings[path]) == JSON.stringify(state)) return

      //   dxSettings[path] = {}
      //   dxSettings[path].columns = state.columns
      //   dxSettings[path].masterDetail = state.masterDetail

      //   Local.set('dxSettings', dxSettings)
      // }
    })
      .dxDataGrid('instance')

    tippy('.dx-button', { arrow: true })

    // const dxSettings = Local.get('dxSettings') || {}
    // if (dxSettings[location.pathname]) {
    //   $(dataGridRef.current).dxDataGrid('instance').state(dxSettings[location.pathname])
    // }

    return () => {
      if (!dataGridRef.current) return
      try {
        $(dataGridRef.current).dxDataGrid('instance')?.dispose()
      } catch (error) { }
    }
  }, [filterValue, baseFilterValue])

  return (
    <div ref={dataGridRef} ></div>
  )
}

export default DataGrid
