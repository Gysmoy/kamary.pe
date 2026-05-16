import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../../Utils/CreateReactScript';
import Table from '../../Components/Adminto/Table';
import Modal from '../../Components/Adminto/Modal';
import DxButton from '../../Components/dx/DxButton';
import Swal from 'sweetalert2';
import CategoriesRest from '../../Actions/Admin/Magistrales/CategoriesRest';

const categoriesRest = new CategoriesRest()

const isActive = (value) => value === true || value === 1 || value === '1'
const renderStatusBadge = (value) => isActive(value)
  ? '<span class="badge bg-success">Activo</span>'
  : '<span class="badge bg-secondary">Inactivo</span>'

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

  const refreshSubcategories = async (category = selectedCategory) => {
    if (!category?.id) return
    const rows = await categoriesRest.getSubcategories(category.id)
    setSubcategories(rows ?? [])
  }

  const resetSubcategoryForm = () => {
    setIsSubcategoryEditing(false)
    if (subcategoryIdRef.current) subcategoryIdRef.current.value = ''
    if (subcategoryDescriptionRef.current) subcategoryDescriptionRef.current.value = ''
    if (subcategoryStatusRef.current) subcategoryStatusRef.current.value = '1'
  }

  const onSubcategoryModalOpen = async (category) => {
    setSelectedCategory(category)
    setSubcategories([])
    resetSubcategoryForm()
    $(subcategoryModalRef.current).modal('show')
    await refreshSubcategories(category)
  }

  const onSubcategoryFormOpen = (data = null) => {
    setIsSubcategoryEditing(!!data?.id)
    subcategoryIdRef.current.value = data?.id ?? ''
    subcategoryDescriptionRef.current.value = data?.description ?? ''
    subcategoryStatusRef.current.value = isActive(data?.status ?? 1) ? '1' : '0'
  }

  const onSubcategorySave = async (e) => {
    e.preventDefault()
    if (!selectedCategory?.id) return

    const result = await categoriesRest.saveSubcategory(selectedCategory.id, {
      id: subcategoryIdRef.current.value || undefined,
      description: subcategoryDescriptionRef.current.value.trim(),
      status: subcategoryStatusRef.current.value === '1',
    })
    if (!result) return
    await refreshSubcategories()
    resetSubcategoryForm()
  }

  const onSubcategoryDelete = async (subcategory) => {
    if (!selectedCategory?.id) return
    const { isConfirmed } = await Swal.fire({ title: 'Eliminar subcategoria', text: 'Se dara de baja la subcategoria magistral.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar' })
    if (!isConfirmed) return
    const result = await categoriesRest.deleteSubcategory(selectedCategory.id, subcategory.id)
    if (!result) return
    await refreshSubcategories()
    if (subcategoryIdRef.current?.value == subcategory.id) resetSubcategoryForm()
  }

  const onCategoryDelete = async (category) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar categoria',
      text: 'Se eliminara la categoria magistral seleccionada.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
    })
    if (!isConfirmed) return
    const result = await categoriesRest.delete(category.id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
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
          width: 150,
          allowFiltering: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({ className: 'btn btn-xs btn-soft-info', title: 'Detalles/Editar', icon: 'mdi mdi-pencil', onClick: () => onModalOpen(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-primary ms-1', title: 'Subcategoria', icon: 'mdi mdi-format-list-bulleted', onClick: () => onSubcategoryModalOpen(data) }))
            container.append(DxButton({ className: 'btn btn-xs btn-soft-danger ms-1', title: 'Eliminar', icon: 'mdi mdi-close', onClick: () => onCategoryDelete(data) }))
          }
        },
        { dataField: 'id', caption: 'ID', width: 90 },
        {
          dataField: 'description',
          caption: 'Descripcion',
          minWidth: 220,
        },
        { dataField: 'code', caption: 'Codigo', width: 130 },
        { dataField: 'warehouse.name', caption: 'Almacen', minWidth: 160 },
        {
          dataField: 'sale_material',
          caption: 'Material para venta',
          width: 170,
          cellTemplate: (container, { data }) => container.text(data?.sale_material ? 'SI' : 'NO')
        },
        {
          dataField: 'status',
          caption: 'Estado',
          width: 95,
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) return
            container.html(renderStatusBadge(data.status))
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

    <Modal modalRef={subcategoryModalRef} title='Subcategoria' size='xl' hideButtonSubmit onSubmit={onSubcategorySave}>
      <input ref={subcategoryIdRef} hidden />
      <div className='row align-items-end mb-3'>
        <div className='col-md-6 mb-2'>
          <label className='form-label'>Descripcion</label>
          <input ref={subcategoryDescriptionRef} className='form-control' required />
        </div>
        <div className='col-md-4 mb-2'>
          <label className='form-label'>Estado</label>
          <select ref={subcategoryStatusRef} className='form-control' defaultValue='1'>
            <option value='1'>Activo</option>
            <option value='0'>Inactivo</option>
          </select>
        </div>
        <div className='col-md-2 mb-2 d-flex gap-2'>
          <button type='submit' className='btn btn-primary w-100'>{isSubcategoryEditing ? 'Actualizar' : 'Registrar'}</button>
          {isSubcategoryEditing && <button type='button' className='btn btn-light' onClick={resetSubcategoryForm}>Limpiar</button>}
        </div>
      </div>
      <hr />
      <h4 className='mb-3'>Subcategorias registradas</h4>
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
                <td dangerouslySetInnerHTML={{ __html: renderStatusBadge(subcategory.status) }} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const requiredPermission = properties.requiredPermission ?? 'magistrales-category'
  if (!properties.can(requiredPermission) && !properties.hasRole('Admin')) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title={properties.moduleTitle ?? 'Magistrales - Categoria'}><Categories {...properties} /></BaseAdminto>)
})
