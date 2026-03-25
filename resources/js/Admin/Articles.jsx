import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import ReactAppend from '../Utils/ReactAppend';
import DxButton from '../Components/dx/DxButton';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import Swal from 'sweetalert2';
import InputFormGroup from '@Adminto/form/InputFormGroup';
import TextareaFormGroup from '@Adminto/form/TextareaFormGroup';
import SelectAPIFormGroup from '@Adminto/form/SelectAPIFormGroup';
import SelectFormGroup from '@Adminto/form/SelectFormGroup';
import SetSelectValue from '../Utils/SetSelectValue';
import ArticlesRest from '../Actions/Admin/ArticlesRest';

const articlesRest = new ArticlesRest()

const formatAuditUser = (user) => {
  if (!user) return ''
  const firstName = (user.name ?? '').toString().trim().split(' ')[0] ?? ''
  const firstLastname = (user.lastname ?? '').toString().trim().split(' ')[0] ?? ''
  const full = `${firstName} ${firstLastname}`.trim()
  const username = (user.username ?? '').toString().trim()
  if (full && username) return `${full} (@${username})`
  if (full) return full
  if (username) return `@${username}`
  return ''
}

const emptyPresentation = () => ({
  uid: crypto.randomUUID(),
  name: '',
  units: 1,
  price: 0,
})

const Articles = () => {
  const gridRef = useRef()
  const modalRef = useRef()
  const principleCreateModalRef = useRef()
  const unitCreateModalRef = useRef()

  const idRef = useRef()
  const codeRef = useRef()
  const nameRef = useRef()
  const laboratoryRef = useRef()
  const principleRef = useRef()
  const unitRef = useRef()
  const volumeRef = useRef()
  const marginRuleRef = useRef()
  const igvRuleRef = useRef()
  const unitsPerArticleRef = useRef()
  const unitWeightRef = useRef()
  const notesRef = useRef()
  const newPrincipleNameRef = useRef()
  const newUnitNameRef = useRef()
  const newUnitSymbolRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [principles, setPrinciples] = useState([])
  const [units, setUnits] = useState([])
  const [presentations, setPresentations] = useState([emptyPresentation()])
  const [selectedLaboratoryId, setSelectedLaboratoryId] = useState('')
  const [selectedPrincipleId, setSelectedPrincipleId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')

  const loadUnits = async (preferredUnitId = null) => {
    const list = await articlesRest.getUnits()
    const active = list.filter(item => item.status !== null)
    setUnits(active)

    if (preferredUnitId && active.some(item => `${item.id}` === `${preferredUnitId}`)) {
      setSelectedUnitId(`${preferredUnitId}`)
      return
    }
    setSelectedUnitId('')
  }

  const loadPrinciples = async (laboratoryId, preferredPrincipleId = null) => {
    if (!laboratoryId) {
      setPrinciples([])
      setSelectedPrincipleId('')
      return
    }

    const data = await articlesRest.getPrinciplesByLaboratory(laboratoryId)
    const active = (data ?? []).filter(item => item.status !== null)
    setPrinciples(active)

    if (preferredPrincipleId && active.some(item => `${item.id}` === `${preferredPrincipleId}`)) {
      setSelectedPrincipleId(`${preferredPrincipleId}`)
      return
    }
    setSelectedPrincipleId('')
  }

  const onModalOpen = async (data = null) => {
    setIsEditing(!!data?.id)

    idRef.current.value = data?.id ?? ''
    codeRef.current.value = data?.code ?? ''
    nameRef.current.value = data?.name ?? ''
    volumeRef.current.value = data?.volume ?? ''
    if (marginRuleRef.current) marginRuleRef.current.checked = !!data?.margin_rule
    if (igvRuleRef.current) igvRuleRef.current.checked = !!data?.igv_rule
    unitsPerArticleRef.current.value = data?.units_per_article ?? 1
    unitWeightRef.current.value = data?.unit_weight ?? ''
    notesRef.current.value = data?.notes ?? ''

    const laboratoryId = data?.laboratory_id ? `${data.laboratory_id}` : ''
    setSelectedLaboratoryId(laboratoryId)
    if (data?.laboratory_id && data?.laboratory?.name) {
      SetSelectValue(laboratoryRef.current, data.laboratory_id, data.laboratory.name)
    } else {
      $(laboratoryRef.current).empty().trigger('change')
    }

    const presentationRows = (data?.presentations ?? []).map(presentation => ({
      uid: crypto.randomUUID(),
      name: presentation.name ?? '',
      units: presentation.units ?? 1,
      price: presentation.price ?? 0,
    }))
    setPresentations(presentationRows.length ? presentationRows : [emptyPresentation()])

    $(modalRef.current).modal('show')
    await loadUnits(data?.unit_id ?? null)
    await loadPrinciples(data?.laboratory_id ?? null, data?.active_principle_id ?? null)
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      code: codeRef.current.value.trim(),
      name: nameRef.current.value.trim(),
      laboratory_id: selectedLaboratoryId || null,
      active_principle_id: selectedPrincipleId || null,
      unit_id: selectedUnitId || null,
      volume: volumeRef.current.value,
      margin_rule: marginRuleRef.current.checked,
      igv_rule: igvRuleRef.current.checked,
      units_per_article: unitsPerArticleRef.current.value,
      unit_weight: unitWeightRef.current.value,
      notes: notesRef.current.value.trim(),
      presentations: presentations.map(item => ({
        name: (item.name ?? '').toString().trim(),
        units: item.units,
        price: item.price,
      }))
    }

    const result = await articlesRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onBooleanChange = async ({ id, field, value }) => {
    const result = await articlesRest.boolean({ id, field, value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar articulo',
      text: 'Estas seguro de eliminar este articulo? Esta accion no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await articlesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onLaboratoryChanged = async (e) => {
    const laboratoryId = e.target.value || ''
    setSelectedLaboratoryId(laboratoryId)
    await loadPrinciples(laboratoryId, null)
  }

  const onOpenCreatePrincipleModal = () => {
    if (!selectedLaboratoryId) {
      Swal.fire({
        icon: 'warning',
        title: 'Laboratorio requerido',
        text: 'Primero selecciona un laboratorio para asociar el principio activo'
      })
      return
    }
    newPrincipleNameRef.current.value = ''
    $(principleCreateModalRef.current).modal('show')
  }

  const onCreatePrincipleSubmit = async (e) => {
    e.preventDefault()
    const name = (newPrincipleNameRef.current.value ?? '').trim()
    if (!name) return

    const created = await articlesRest.createPrinciple(selectedLaboratoryId, { name })
    if (!created) return

    await loadPrinciples(selectedLaboratoryId, created.id)
    $(principleCreateModalRef.current).modal('hide')
  }

  const onOpenCreateUnitModal = () => {
    newUnitNameRef.current.value = ''
    newUnitSymbolRef.current.value = ''
    $(unitCreateModalRef.current).modal('show')
  }

  const onCreateUnitSubmit = async (e) => {
    e.preventDefault()
    const request = {
      name: (newUnitNameRef.current.value ?? '').trim(),
      symbol: (newUnitSymbolRef.current.value ?? '').trim(),
    }
    if (!request.name || !request.symbol) return

    const created = await articlesRest.createUnit(request)
    if (!created?.id) return

    await loadUnits(created.id)
    $(unitCreateModalRef.current).modal('hide')
  }

  const onPresentationUpdated = (uid, field, value) => {
    setPresentations(prev => prev.map(item => item.uid === uid ? { ...item, [field]: value } : item))
  }

  const onPresentationAdded = () => {
    setPresentations(prev => [...prev, emptyPresentation()])
  }

  const onPresentationRemoved = (uid) => {
    setPresentations(prev => {
      const next = prev.filter(item => item.uid !== uid)
      return next.length ? next : [emptyPresentation()]
    })
  }

  return (<>
    <Table
      gridRef={gridRef}
      title='Articulos'
      rest={articlesRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
          }
        });
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'add',
            title: 'Agregar',
            hint: 'Agregar articulo',
            onClick: () => onModalOpen()
          }
        });
      }}
      pageSize={25}
      columns={[
        { dataField: 'id', caption: 'ID', visible: false },
        { dataField: 'code', caption: 'Codigo', width: '130px' },
        { dataField: 'name', caption: 'Articulo', minWidth: 180 },
        { dataField: 'laboratory.name', caption: 'Laboratorio', width: '150px' },
        { dataField: 'activePrinciple.name', caption: 'Principio activo', width: '180px' },
        {
          dataField: 'unit.symbol',
          caption: 'Unidad',
          width: '110px',
          cellTemplate: (container, { data }) => container.text(data?.unit?.symbol || data?.unit?.name || '')
        },
        { dataField: 'volume', caption: 'Volumen', width: '100px' },
        { dataField: 'units_per_article', caption: 'Und x articulo', width: '110px' },
        { dataField: 'unit_weight', caption: 'Peso unit.', width: '100px' },
        { dataField: 'margin_rule', caption: 'Regla margen', dataType: 'boolean', width: '105px' },
        { dataField: 'igv_rule', caption: 'Regla IGV', dataType: 'boolean', width: '95px' },
        {
          dataField: 'presentations.name',
          caption: 'Presentaciones',
          allowFiltering: false,
          minWidth: 220,
          cellTemplate: (container, { data }) => {
            const lines = (data?.presentations ?? []).map(item => `${item.name} (${Number(item.units).toFixed(2)}) - S/. ${Number(item.price).toFixed(2)}`)
            ReactAppend(container, <div>
              {lines.length === 0 && <small className='text-muted'>Sin presentaciones</small>}
              {lines.map((line, idx) => <div key={`p-${data.id}-${idx}`}><small>{line}</small></div>)}
            </div>)
          }
        },
        { dataField: 'notes', caption: 'Notas', visible: false },
        {
          dataField: 'creator.fullname',
          caption: 'Creado por',
          visible: false,
          cellTemplate: (container, { data }) => container.text(formatAuditUser(data.creator))
        },
        {
          dataField: 'updater.fullname',
          caption: 'Actualizado por',
          visible: false,
          cellTemplate: (container, { data }) => container.text(formatAuditUser(data.updater))
        },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          width: '95px',
          cellTemplate: (container, { data }) => {
            $(container).empty()
            if (data.status === null) return
            ReactAppend(container, <SwitchFormGroup checked={data.status == 1} onChange={() => onBooleanChange({
              id: data.id,
              field: 'status',
              value: !data.status
            })} />)
          }
        },
        {
          caption: 'Acciones',
          width: '120px',
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-primary',
              title: 'Editar',
              icon: 'mdi mdi-pencil',
              onClick: () => onModalOpen(data)
            }))
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger',
              title: 'Eliminar articulo',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.id)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]}
    />

    <Modal modalRef={modalRef} title={isEditing ? 'Editar articulo' : 'Agregar articulo'} onSubmit={onModalSubmit} size='xl'>
      <div className='row' id='article-form-container'>
        <input ref={idRef} type='hidden' />
        <InputFormGroup eRef={codeRef} label='Codigo de articulo' col='col-md-4' required />
        <InputFormGroup eRef={nameRef} label='Nombre del articulo' col='col-md-8' required />

        <SelectAPIFormGroup
          eRef={laboratoryRef}
          label='Laboratorio'
          col='col-md-4'
          required
          searchAPI='/api/admin/laboratories/paginate'
          searchBy='name'
          dropdownParent='#article-form-container'
          onChange={onLaboratoryChanged}
        />

        <SelectFormGroup
          eRef={principleRef}
          label={<span>Principio activo <button type='button' className='btn btn-link p-0 ms-2' onClick={onOpenCreatePrincipleModal}>Agregar</button></span>}
          col='col-md-4'
          dropdownParent='#article-form-container'
          required
          value={selectedPrincipleId}
          onChange={(e) => setSelectedPrincipleId(e.target.value)}
          effectWith={[selectedPrincipleId, principles.length]}
        >
          <option value=''>Seleccionar...</option>
          {principles.map(principle => (
            <option key={`principle-${principle.id}`} value={principle.id}>{principle.name}</option>
          ))}
        </SelectFormGroup>

        <SelectFormGroup
          eRef={unitRef}
          label={<span>Unidad de medida <button type='button' className='btn btn-link p-0 ms-2' onClick={onOpenCreateUnitModal}>Agregar</button></span>}
          col='col-md-4'
          dropdownParent='#article-form-container'
          required
          value={selectedUnitId}
          onChange={(e) => setSelectedUnitId(e.target.value)}
          effectWith={[selectedUnitId, units.length]}
        >
          <option value=''>Seleccionar...</option>
          {units.map(unit => (
            <option key={`unit-${unit.id}`} value={unit.id}>
              {unit.name}{unit.symbol ? ` (${unit.symbol})` : ''}
            </option>
          ))}
        </SelectFormGroup>

        <InputFormGroup eRef={volumeRef} label='Volumen' col='col-md-3' type='number' step='0.001' />
        <InputFormGroup eRef={unitsPerArticleRef} label='Unidad por articulo' col='col-md-3' type='number' min='1' required />
        <InputFormGroup eRef={unitWeightRef} label='Peso unitario' col='col-md-3' type='number' step='0.0001' />

        <div className='form-group col-md-3 mb-2'>
          <label className='form-label d-block'>Regla de margen</label>
          <div className='form-check form-switch'>
            <input ref={marginRuleRef} className='form-check-input' type='checkbox' />
          </div>
        </div>
        <div className='form-group col-md-3 mb-2'>
          <label className='form-label d-block'>Regla de IGV</label>
          <div className='form-check form-switch'>
            <input ref={igvRuleRef} className='form-check-input' type='checkbox' />
          </div>
        </div>

        <TextareaFormGroup eRef={notesRef} label='Notas' col='col-12' rows={3} />

        <div className='col-12 mt-2'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h6 className='mb-0'>Presentaciones</h6>
            <button type='button' className='btn btn-sm btn-soft-primary' onClick={onPresentationAdded}>
              <i className='mdi mdi-plus me-1'></i> Agregar presentacion
            </button>
          </div>

          <div className='table-responsive border rounded'>
            <table className='table table-sm table-striped mb-0'>
              <thead>
                <tr>
                  <th style={{ width: '46%' }}>Nombre</th>
                  <th style={{ width: '20%' }}>Unidades</th>
                  <th style={{ width: '20%' }}>Precio</th>
                  <th style={{ width: '14%' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {presentations.map((presentation) => (
                  <tr key={presentation.uid}>
                    <td>
                      <input
                        className='form-control form-control-sm'
                        value={presentation.name}
                        onChange={(e) => onPresentationUpdated(presentation.uid, 'name', e.target.value)}
                        placeholder='Ej. Six'
                      />
                    </td>
                    <td>
                      <input
                        className='form-control form-control-sm'
                        type='number'
                        min='0.001'
                        step='0.001'
                        value={presentation.units}
                        onChange={(e) => onPresentationUpdated(presentation.uid, 'units', e.target.value)}
                        placeholder='Ej. 6'
                      />
                    </td>
                    <td>
                      <input
                        className='form-control form-control-sm'
                        type='number'
                        min='0'
                        step='0.01'
                        value={presentation.price}
                        onChange={(e) => onPresentationUpdated(presentation.uid, 'price', e.target.value)}
                        placeholder='Ej. 25.90'
                      />
                    </td>
                    <td>
                      <button type='button' className='btn btn-xs btn-soft-danger' onClick={() => onPresentationRemoved(presentation.uid)}>
                        <i className='mdi mdi-delete'></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>

    <Modal
      modalRef={principleCreateModalRef}
      title='Agregar principio activo'
      onSubmit={onCreatePrincipleSubmit}
      size='md'
    >
      <InputFormGroup eRef={newPrincipleNameRef} label='Nombre del principio activo' col='col-12' required />
      <small className='text-muted'>Se asociara al laboratorio actualmente seleccionado.</small>
    </Modal>

    <Modal
      modalRef={unitCreateModalRef}
      title='Agregar unidad de medida'
      onSubmit={onCreateUnitSubmit}
      size='md'
    >
      <div className='row'>
        <InputFormGroup eRef={newUnitNameRef} label='Nombre' col='col-md-8' required />
        <InputFormGroup eRef={newUnitSymbolRef} label='Simbolo' col='col-md-4' required />
      </div>
    </Modal>
  </>)
}

CreateReactScript((el, properties) => {
  if (!properties.can('articles') && !properties.hasRole('Admin')) location.href = '/admin/';
  createRoot(el).render(<BaseAdminto {...properties} title='Articulos'>
    <Articles {...properties} />
  </BaseAdminto>);
})
