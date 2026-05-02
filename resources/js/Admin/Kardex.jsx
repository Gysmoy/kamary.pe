import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import KardexRest from '../Actions/Admin/KardexRest';
import { scopedPermission } from '../Utils/permissionScope';

const kardexRest = new KardexRest()

const Kardex = () => {
  const gridRef = useRef()

  const [businesses, setBusinesses] = useState([])
  const [branches, setBranches] = useState([])
  const [laboratories, setLaboratories] = useState([])
  const [articles, setArticles] = useState([])

  const [businessId, setBusinessId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [laboratoryId, setLaboratoryId] = useState('')
  const [articleId, setArticleId] = useState('')

  useEffect(() => {
    const load = async () => {
      const [businessesData, labsData, articlesData] = await Promise.all([
        kardexRest.getBusinesses(),
        kardexRest.getLaboratories(),
        kardexRest.getArticles(),
      ])
      setBusinesses((businessesData ?? []).filter(item => item.status !== null))
      setLaboratories((labsData ?? []).filter(item => item.status !== null))
      setArticles((articlesData ?? []).filter(item => item.status !== null))
    }
    load()
  }, [])

  useEffect(() => {
    const loadBranches = async () => {
      if (!businessId) {
        setBranches([])
        setBranchId('')
        return
      }
      const data = await kardexRest.getBranchesByBusiness(businessId)
      setBranches((data ?? []).filter(item => item.status !== null))
      setBranchId('')
    }
    loadBranches()
  }, [businessId])

  useEffect(() => {
    kardexRest.setFilters({
      business_id: businessId || '',
      business_branch_id: branchId || '',
      laboratory_id: laboratoryId || '',
      article_id: articleId || '',
    })
    if (!gridRef.current) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }, [businessId, branchId, laboratoryId, articleId])

  return (
    <div className='row'>
      <div className='col-12'>
        <div className='card mb-3'>
          <div className='card-body'>
            <div className='row'>
              <div className='col-md-3'>
                <label className='form-label'>Empresa</label>
                <select className='form-control' value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
                  <option value=''>-- Seleccionar empresa --</option>
                  {businesses.map(item => <option key={`kardex-business-${item.id}`} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div className='col-md-3'>
                <label className='form-label'>Sede</label>
                <select className='form-control' value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                  <option value=''>-- Seleccionar sede --</option>
                  {branches.map(item => <option key={`kardex-branch-${item.id}`} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div className='col-md-3'>
                <label className='form-label'>Laboratorio</label>
                <select className='form-control' value={laboratoryId} onChange={(e) => setLaboratoryId(e.target.value)}>
                  <option value=''>-- Seleccionar laboratorio --</option>
                  {laboratories.map(item => <option key={`kardex-lab-${item.id}`} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div className='col-md-3'>
                <label className='form-label'>Producto</label>
                <select className='form-control' value={articleId} onChange={(e) => setArticleId(e.target.value)}>
                  <option value=''>-- Seleccionar producto --</option>
                  {articles
                    .filter(item => !laboratoryId || `${item.laboratory_id}` === `${laboratoryId}`)
                    .map(item => <option key={`kardex-article-${item.id}`} value={item.id}>{item.code} - {item.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='col-12'>
        <Table
          gridRef={gridRef}
          title='Kardex'
          rest={kardexRest}
          pageSize={25}
          toolBar={(container) => {
            container.unshift({
              widget: 'dxButton',
              location: 'after',
              options: {
                icon: 'refresh',
                hint: 'Refrescar tabla',
                onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
              }
            })
          }}
          columns={[
            {
              dataField: 'movement_date',
              caption: 'Fecha',
              minWidth: 140,
              dataType: 'datetime'
            },
            { dataField: 'movement_type', caption: 'Tipo', minWidth: 90 },
            { dataField: 'business_name', caption: 'Empresa', minWidth: 180 },
            { dataField: 'branch_name', caption: 'Sede', minWidth: 140 },
            { dataField: 'batch_code', caption: 'Codigo Lote', minWidth: 130 },
            { dataField: 'article_code', caption: 'Codigo', minWidth: 110 },
            { dataField: 'article_name', caption: 'Producto', minWidth: 220 },
            {
              dataField: 'lab_principle',
              caption: 'Laboratorio | Principio activo',
              minWidth: 250,
              calculateCellValue: (rowData) => `${rowData.laboratory_name || '-'} | ${rowData.principle_name || '-'}`
            },
            { dataField: 'unit_label', caption: 'Unidad', minWidth: 90 },
            { dataField: 'warehouse_name', caption: 'Almacen', minWidth: 140 },
            { dataField: 'location', caption: 'Ubicacion', minWidth: 120 },
            { dataField: 'destination_location', caption: 'Ubi. Destino', minWidth: 120 },
            {
              dataField: 'quantity_in',
              caption: 'Entrada',
              minWidth: 100,
              cellTemplate: (container, { data }) => container.text(Number(data.quantity_in ?? 0).toFixed(3))
            },
            {
              dataField: 'quantity_out',
              caption: 'Salida',
              minWidth: 100,
              cellTemplate: (container, { data }) => container.text(Number(data.quantity_out ?? 0).toFixed(3))
            },
            {
              dataField: 'delta',
              caption: 'Movimiento',
              minWidth: 100,
              cellTemplate: (container, { data }) => {
                const qtyIn = Number(data.quantity_in ?? 0)
                const qtyOut = Number(data.quantity_out ?? 0)
                container.text((qtyIn - qtyOut).toFixed(3))
              }
            },
          ]}
        />
      </div>
    </div>
  )
}

CreateReactScript((el, properties) => {
  if (!properties.can(scopedPermission('kardex')) && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Kardex'>
    <Kardex {...properties} />
  </BaseAdminto>);
})
