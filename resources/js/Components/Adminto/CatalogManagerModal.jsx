import React, { useRef, useState } from 'react'
import Swal from 'sweetalert2'
import Modal from './Modal'

const emptyFormValues = (fields) => fields.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {})

/**
 * Modal generico para gestionar un catalogo simple (crear, listar paginado, editar, eliminar).
 * Se usa anidado dentro de otro modal (mismo patron que los modales de solo-crear existentes).
 */
const CatalogManagerModal = ({
  modalRef,
  title = 'Gestionar registros',
  fields = [],
  fetchList,
  save,
  remove,
  onChanged = () => { },
  pageSize = 5,
  canManage = true,
}) => {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formValues, setFormValues] = useState(() => emptyFormValues(fields))
  const [page, setPage] = useState(1)

  const loadList = async () => {
    setIsLoading(true)
    const rows = await fetchList?.()
    setItems(Array.isArray(rows) ? rows : [])
    setIsLoading(false)
  }

  const resetForm = () => {
    setEditingId(null)
    setFormValues(emptyFormValues(fields))
  }

  // Se reasigna en cada render para evitar closures obsoletas dentro del handler jQuery (bindeado una sola vez).
  const onShownRef = useRef(() => { })
  onShownRef.current = () => {
    setPage(1)
    resetForm()
    loadList()
  }

  React.useEffect(() => {
    const el = modalRef.current
    if (!el) return
    const handler = () => onShownRef.current()
    $(el).on('shown.bs.modal', handler)
    return () => $(el).off('shown.bs.modal', handler)
  }, [])

  const onFieldChanged = (key, value) => {
    setFormValues(prev => ({ ...prev, [key]: value }))
  }

  const onEditClicked = (row) => {
    setEditingId(row.id)
    setFormValues(fields.reduce((acc, field) => ({ ...acc, [field.key]: row[field.key] ?? '' }), {}))
  }

  const onCancelEdit = () => resetForm()

  const onFormSubmit = async (e) => {
    e.preventDefault()
    if (!canManage) return

    setIsSaving(true)
    const payload = { ...formValues }
    if (editingId) payload.id = editingId
    const result = await save?.(payload)
    setIsSaving(false)
    if (!result) return

    resetForm()
    await loadList()
    onChanged?.()
  }

  const onDeleteClicked = async (row) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar registro',
      text: 'Estas seguro de eliminar este registro? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
    })
    if (!isConfirmed) return

    const ok = await remove?.(row.id)
    if (!ok) return

    if (editingId === row.id) resetForm()
    await loadList()
    onChanged?.()
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const columnCount = fields.length + 1

  return (
    <Modal modalRef={modalRef} title={title} size='lg' asForm={false} hideFooter>
      {canManage === false ? (
        <div className='alert alert-warning py-2 px-3 mb-3'>
          Selecciona primero un registro relacionado para poder gestionar esta lista.
        </div>
      ) : (
        <form className='row g-2 align-items-end mb-3' onSubmit={onFormSubmit}>
          {fields.map(field => (
            <div key={`catalog-field-${field.key}`} className={`form-group mb-0 ${field.col || 'col-12'}`}>
              <label className='form-label mb-1'>
                {field.label} {field.required && <b className='text-danger'>*</b>}
              </label>
              <input
                type={field.type || 'text'}
                className='form-control form-control-sm'
                value={formValues[field.key] ?? ''}
                required={!!field.required}
                onChange={(e) => onFieldChanged(field.key, e.target.value)}
              />
            </div>
          ))}
          <div className='col-12 d-flex gap-2 mt-2'>
            <button type='submit' className='btn btn-sm btn-primary' disabled={isSaving}>
              <i className={`mdi ${editingId ? 'mdi-content-save' : 'mdi-plus'} me-1`}></i>
              {editingId ? 'Actualizar' : 'Agregar'}
            </button>
            {!!editingId && (
              <button type='button' className='btn btn-sm btn-light' onClick={onCancelEdit}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      <div className='table-responsive border rounded'>
        <table className='table table-sm table-striped mb-0 align-middle'>
          <thead>
            <tr>
              {fields.map(field => <th key={`catalog-th-${field.key}`}>{field.label}</th>)}
              <th style={{ width: 90 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={columnCount} className='text-center text-muted'>Cargando...</td></tr>
            )}
            {!isLoading && pagedItems.length === 0 && (
              <tr><td colSpan={columnCount} className='text-center text-muted'>Sin registros</td></tr>
            )}
            {!isLoading && pagedItems.map(row => (
              <tr key={`catalog-row-${row.id}`}>
                {fields.map(field => <td key={`catalog-cell-${row.id}-${field.key}`}>{row[field.key] ?? ''}</td>)}
                <td>
                  <div className='d-flex gap-1'>
                    <button type='button' className='btn btn-xs btn-soft-primary' title='Editar' onClick={() => onEditClicked(row)}>
                      <i className='mdi mdi-pencil'></i>
                    </button>
                    <button type='button' className='btn btn-xs btn-soft-danger' title='Eliminar' onClick={() => onDeleteClicked(row)}>
                      <i className='mdi mdi-delete'></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className='d-flex justify-content-between align-items-center mt-2'>
          <button type='button' className='btn btn-sm btn-outline-secondary' disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
            <i className='mdi mdi-chevron-left'></i> Anterior
          </button>
          <small className='text-muted'>Pagina {currentPage} de {totalPages}</small>
          <button type='button' className='btn btn-sm btn-outline-secondary' disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
            Siguiente <i className='mdi mdi-chevron-right'></i>
          </button>
        </div>
      )}

      <div className='d-flex justify-content-end mt-3'>
        <button type='button' className='btn btn-sm btn-light' data-bs-dismiss='modal'>Cerrar</button>
      </div>
    </Modal>
  )
}

export default CatalogManagerModal
