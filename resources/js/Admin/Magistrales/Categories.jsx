import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../../Utils/CreateReactScript';
import Table from '../../Components/Adminto/Table';
import Modal from '../../Components/Adminto/Modal';
import ReactAppend from '../../Utils/ReactAppend';
import DxButton from '../../Components/dx/DxButton';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import CategoriesRest from '../../Actions/Admin/Magistrales/CategoriesRest';

const categoriesRest = new CategoriesRest()

const Categories = ({ moduleTitle = 'Magistrales - Categoria' }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const descriptionRef = useRef()
  const warehouseRef = useRef()
  const saleMaterialRef = useRef()
  const statusRef = useRef()
  const subcategoryModalRef = useRef()
  const subcategoryFormModalRef = useRef()
  const subcategoryIdRef = useRef()
  const subcategoryDescriptionRef = useRef()
  const subcategoryStatusRef = useRef()
  const [warehouses, setWarehouses] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [subcategories, setSubcategories] = useState([])
  const [isSubcategoryEditing, setIsSubcategoryEditing] = useState(false)

  useEffect(() => {
    categoriesRest.getWarehouses().then(rows => setWarehouses((rows ?? []).filter(row => row.status !== null)))
  }, [])

  const onModalOpen = (data = null) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? ''
    descriptionRef.current.value = data?.description ?? ''
    warehouseRef.current.value = data?.warehouse_id ?? ''
    saleMaterialRef.current.checked = !!data?.sale_material
    statusRef.current.checked = data?.status !== false && data?.status !== 0
    $(modalRef.current).modal('show')
  }

  const onSave = async (e) => {
    e.preventDefault()
    const result = await categoriesRest.save({
      id: idRef.current.value || undefined,
      code: codeRef.current.value.trim(),
      description: descriptionRef.current.value.trim(),
      warehouse_id: warehouseRef.current.value || null,
      sale_material: saleMaterialRef.current.checked,
      status: statusRef.current.checked,
    })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onStatusChange = async ({ id, status }) => {
    const result = await categoriesRest.status({ id, status })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const refreshSubcategories = async (category = selectedCategory) => {
    if (!category?.id) return
    const rows = await categoriesRest.getSubcategories(category.id)
    setSubcategories(rows ?? [])
  }

  const onSubcategoryModalOpen = async (category) => {
    setSelectedCategory(category)
    setSubcategories([])
    $(subcategoryModalRef.current).modal('show')
    await refreshSubcategories(category)
  }

  const onSubcategoryFormOpen = (data = null) => {
    setIsSubcategoryEditing(!!data?.id)
    subcategoryIdRef.current.value = data?.id ?? ''
    subcategoryDescriptionRef.current.value = data?.description ?? ''
    subcategoryStatusRef.current.checked = data?.status !== false && data?.status !== 0
    $(subcategoryFormModalRef.current).modal('show')
  }

  const onSubcategorySave = async (e) => {
    e.preventDefault()
    if (!selectedCategory?.id) return

    const result = await categoriesRest.saveSubcategory(selectedCategory.id, {
      id: subcategoryIdRef.current.value || undefined,
      description: subcategoryDescriptionRef.current.value.trim(),
      status: subcategoryStatusRef.current.checked,
    })
    if (!result) return
    await refreshSubcategories()
    $(subcategoryFormModalRef.current).modal('hide')
  }

  const onSubcategoryStatusChange = async (subcategory) => {
    if (!selectedCategory?.id) return
    const result = await categoriesRest.statusSubcategory(selectedCategory.id, subcategory)
    if (!result) return
    await refreshSubcategories()
  }

  const onSubcategoryDelete = async (subcategory) => {
    if (!selectedCategory?.id) return
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar subcategoria', text: 'Se dara de baja la subcategoria magistral.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await categoriesRest.deleteSubcategory(selectedCategory.id, subcategory.id)
    if (!result) return
    await refreshSubcategories()
  }

  return <>
    <Table
      gridRef={gridRef}
      title={moduleTitle}
      rest={categoriesRest}
      pageSize={25}
      toolBar={(items) => {
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'refresh', onClick: () => $(gridRef.current).dxDataGrid('instance').refresh() } })
        items.unshift({ widget: 'dxButton', location: 'after', options: { icon: 'add', onClick: () => onModalOpen() } })
      }}
      columns={[
        {
          caption: 'Acciones',
          width: 130,
          allowFiltering: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({ className: 'btn btn-xs btn-soft-info', title: 'Detalles/Editar', icon: 'mdi mdi-pencil', onClick: () => onModalOpen(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-primary ms-1', title: 'Subcategoria', icon: 'mdi mdi-format-list-bulleted', onClick: () => onSubcategoryModalOpen(data) }))
          }
        },
        { dataField: 'id', caption: 'ID', width: 90 },
        { dataField: 'description', caption: 'Descripcion', minWidth: 220 },
        { dataField: 'code', caption: 'Codigo', width: 130 },
        { dataField: 'warehouse.name', caption: 'Almacen', minWidth: 160 },
        { dataField: 'sale_material', caption: 'Material para venta', dataType: 'boolean', width: 150 },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          width: 95,
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) return
            ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => onStatusChange(data)} />)
          }
        },
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar categoria magistral' : 'Agregar categoria magistral'} size='lg' onSubmit={onSave} btnSubmitText='Registrar'>
      <div className='row'>
        <input ref={idRef} hidden />
        <div className='col-md-8 mb-3'><label className='form-label'>Descripcion</label><input ref={descriptionRef} className='form-control' required /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Codigo</label><input ref={codeRef} className='form-control' required /></div>
        <div className='col-md-8 mb-3'><label className='form-label'>Almacen</label><select ref={warehouseRef} className='form-control'><option value=''>Seleccione</option>{warehouses.map(row => <option key={`mag-cat-wh-${row.id}`} value={row.id}>{row.name}</option>)}</select></div>
        <div className='col-md-4 mb-3 form-check mt-4'><input ref={saleMaterialRef} type='checkbox' className='form-check-input' id='magCategorySaleMaterial' /><label className='form-check-label' htmlFor='magCategorySaleMaterial'>Material para Ventas</label></div>
        <div className='col-md-4 mb-3 form-check mt-2'><input ref={statusRef} type='checkbox' className='form-check-input' id='magCategoryStatus' /><label className='form-check-label' htmlFor='magCategoryStatus'>Estado</label></div>
      </div>
    </Modal>

    <Modal modalRef={subcategoryModalRef} title={`Subcategorias${selectedCategory?.description ? ` - ${selectedCategory.description}` : ''}`} size='lg' hideButtonSubmit>
      <div className='d-flex justify-content-end mb-2'>
        <button type='button' className='btn btn-sm btn-primary' onClick={() => onSubcategoryFormOpen()}>Nuevo</button>
      </div>
      <div className='table-responsive border rounded'>
        <table className='table table-sm table-striped mb-0'>
          <thead>
            <tr>
              <th>Acciones</th>
              <th>ID</th>
              <th>Descripcion</th>
              <th>Articulos con esta subcategoria</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {subcategories.length === 0 && (
              <tr>
                <td colSpan={5} className='text-center text-muted'>Sin subcategorias registradas</td>
              </tr>
            )}
            {subcategories.map(subcategory => (
              <tr key={`mag-subcategory-${subcategory.id}`}>
                <td>
                  <button type='button' className='btn btn-xs btn-soft-info me-1' title='Detalles/Editar' onClick={() => onSubcategoryFormOpen(subcategory)}>
                    <i className='mdi mdi-pencil'></i>
                  </button>
                  <button type='button' className='btn btn-xs btn-soft-danger' title='Eliminar' onClick={() => onSubcategoryDelete(subcategory)}>
                    <i className='mdi mdi-delete'></i>
                  </button>
                </td>
                <td>{subcategory.id}</td>
                <td>{subcategory.description}</td>
                <td>{subcategory.articles_count ?? 0}</td>
                <td><SwitchFormGroup checked={subcategory.status == 1} onChange={() => onSubcategoryStatusChange(subcategory)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>

    <Modal modalRef={subcategoryFormModalRef} title={isSubcategoryEditing ? 'Editar subcategoria' : 'Nueva subcategoria'} size='md' onSubmit={onSubcategorySave} btnSubmitText='Registrar' zIndex={1065}>
      <div className='row'>
        <input ref={subcategoryIdRef} hidden />
        <div className='col-12 mb-3'><label className='form-label'>Descripcion</label><input ref={subcategoryDescriptionRef} className='form-control' required /></div>
        <div className='col-12 mb-3 form-check'><input ref={subcategoryStatusRef} type='checkbox' className='form-check-input' id='magSubcategoryStatus' /><label className='form-check-label' htmlFor='magSubcategoryStatus'>Estado</label></div>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'magistrales-category'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Magistrales - Categoria'}><Categories {...properties} /></BaseAdminto>)
})
