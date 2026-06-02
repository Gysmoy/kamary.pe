import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import BaseAdminto from '@Adminto/Base'
import CreateReactScript from '../Utils/CreateReactScript'
import Table from '../Components/Adminto/Table'
import Modal from '../Components/Adminto/Modal'
import DxButton from '../Components/dx/DxButton'
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup'
import Swal from 'sweetalert2'
import InputFormGroup from '@Adminto/form/InputFormGroup'
import UbigeoCascade from '../Components/Adminto/Form/UbigeoCascade'
import { EMPTY_UBIGEO_SELECTION } from '../Utils/ubigeoInei'
import BusinessesRest from '../Actions/Admin/BusinessesRest'
import { getFacturadorSyncMeta } from '../Utils/statusLabels'
import { isMagistralesPath } from '../Utils/permissionScope'

const businessesRest = new BusinessesRest()

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

const BillingSettings = ({ can }) => {
  const gridRef = useRef()
  const fiscalModalRef = useRef()
  const branchesModalRef = useRef()
  const branchModalRef = useRef()

  const fiscalBusinessIdRef = useRef()
  const taxNumberRef = useRef()
  const tradeNameRef = useRef()
  const soapSendIdRef = useRef()
  const soapTypeIdRef = useRef()
  const soapUsernameRef = useRef()
  const soapPasswordRef = useRef()
  const soapUrlRef = useRef()
  const detractionAccountRef = useRef()
  const paymentAccountsTitleRef = useRef()
  const paymentAccountsSubtitleRef = useRef()
  const paymentAccountsLinesRef = useRef()
  const certificateDueRef = useRef()
  const operationAmazoniaRef = useRef()
  const sendDocumentToPseRef = useRef()
  const urlSignaturePseRef = useRef()
  const urlSendCdrPseRef = useRef()
  const clientIdPseRef = useRef()
  const integratedQueryClientIdRef = useRef()
  const integratedQueryClientSecretRef = useRef()
  const logoFileRef = useRef()
  const logoObjectUrlRef = useRef(null)
  const certificateFileRef = useRef()
  const certificatePasswordRef = useRef()
  const branchIdRef = useRef()
  const branchNameRef = useRef()
  const branchCodeRef = useRef()
  const branchAddressRef = useRef()
  const branchEmailRef = useRef()
  const branchTelephoneRef = useRef()
  const branchSeriesFacturaRef = useRef()
  const branchSeriesBoletaRef = useRef()
  const branchSeriesNotaCreditoRef = useRef()
  const branchSeriesGuiaRef = useRef()
  const branchModeRef = useRef()

  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [branches, setBranches] = useState([])
  const [isBranchEditing, setIsBranchEditing] = useState(false)
  const [selectedFiscalBusiness, setSelectedFiscalBusiness] = useState(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('')
  const [logoPreviewLabel, setLogoPreviewLabel] = useState('')
  const [logoPreviewError, setLogoPreviewError] = useState('')
  const [branchUbigeoSelection, setBranchUbigeoSelection] = useState(EMPTY_UBIGEO_SELECTION)
  const [facturadorMode, setFacturadorMode] = useState(null)
  const [selectedFacturadorMode, setSelectedFacturadorMode] = useState('demo')

  const clearLogoObjectUrl = () => {
    if (!logoObjectUrlRef.current) return
    URL.revokeObjectURL(logoObjectUrlRef.current)
    logoObjectUrlRef.current = null
  }

  const currentLogoUrl = (business) => {
    if (!business?.id || !business?.fiscal_logo_path) return ''
    const version = encodeURIComponent(`${business.fiscal_logo_path}-${business.updated_at ?? ''}`)
    return `/api/admin/businesses/${business.id}/fiscal-assets/logo?v=${version}`
  }

  const setCurrentLogoPreview = (business) => {
    clearLogoObjectUrl()
    const url = currentLogoUrl(business)
    setLogoPreviewUrl(url)
    setLogoPreviewLabel(url ? 'Logo actual' : '')
    setLogoPreviewError('')
  }

  useEffect(() => {
    loadFacturadorMode()
    return () => clearLogoObjectUrl()
  }, [])

  const loadFacturadorMode = async () => {
    const data = await businessesRest.getFacturadorMode()
    if (!data) return
    setFacturadorMode(data)
    setSelectedFacturadorMode(data.mode || 'demo')
  }

  const normalizePaymentAccounts = (value) => {
    if (!value) return {}
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) || {}
      } catch (error) {
        return { lines: value.split(/\r?\n/).map(line => line.trim()).filter(Boolean) }
      }
    }
    return value
  }

  const onSaveFacturadorMode = async () => {
    const nextMode = selectedFacturadorMode || 'demo'

    if (nextMode === 'production' && facturadorMode?.mode !== 'production') {
      const { isConfirmed } = await Swal.fire({
        title: 'Activar produccion',
        text: 'Los comprobantes dejaran de usar la respuesta demo y se enviaran al facturador configurado.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Activar produccion',
        cancelButtonText: 'Cancelar'
      })
      if (!isConfirmed) return
    }

    const updated = await businessesRest.updateFacturadorMode(nextMode)
    if (!updated) return
    setFacturadorMode(updated)
    setSelectedFacturadorMode(updated.mode || 'demo')
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const fillFiscalForm = (business) => {
    fiscalBusinessIdRef.current.value = business?.id ?? ''
    taxNumberRef.current.value = business?.tax_number ?? ''
    tradeNameRef.current.value = business?.trade_name ?? ''
    soapSendIdRef.current.value = business?.soap_send_id ?? '01'
    soapTypeIdRef.current.value = business?.soap_type_id ?? '01'
    soapUsernameRef.current.value = business?.soap_username ?? ''
    soapPasswordRef.current.value = business?.soap_password ?? ''
    soapUrlRef.current.value = business?.soap_url ?? ''
    detractionAccountRef.current.value = business?.detraction_account ?? ''
    const paymentAccounts = normalizePaymentAccounts(business?.payment_accounts)
    paymentAccountsTitleRef.current.value = paymentAccounts?.title ?? ''
    paymentAccountsSubtitleRef.current.value = paymentAccounts?.subtitle ?? ''
    paymentAccountsLinesRef.current.value = (paymentAccounts?.lines ?? []).join('\n')
    certificateDueRef.current.value = business?.certificate_due?.toString?.().slice?.(0, 10) ?? ''
    operationAmazoniaRef.current.checked = business?.operation_amazonia ?? false
    sendDocumentToPseRef.current.checked = business?.send_document_to_pse ?? false
    urlSignaturePseRef.current.value = business?.url_signature_pse ?? ''
    urlSendCdrPseRef.current.value = business?.url_send_cdr_pse ?? ''
    clientIdPseRef.current.value = business?.client_id_pse ?? ''
    integratedQueryClientIdRef.current.value = business?.integrated_query_client_id ?? ''
    integratedQueryClientSecretRef.current.value = business?.integrated_query_client_secret ?? ''
    if (logoFileRef.current) logoFileRef.current.value = ''
    if (certificateFileRef.current) certificateFileRef.current.value = ''
    if (certificatePasswordRef.current) certificatePasswordRef.current.value = ''
    setCurrentLogoPreview(business)
  }

  const onLogoFileChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      setCurrentLogoPreview(selectedFiscalBusiness)
      return
    }

    clearLogoObjectUrl()
    const objectUrl = URL.createObjectURL(file)
    logoObjectUrlRef.current = objectUrl
    setLogoPreviewUrl(objectUrl)
    setLogoPreviewLabel(`Nuevo: ${file.name}`)
    setLogoPreviewError('')
  }

  const onFiscalOpen = (business) => {
    setSelectedFiscalBusiness(business)
    fillFiscalForm(business)
    $(fiscalModalRef.current).modal('show')
  }

  const onSaveFiscal = async (e) => {
    e.preventDefault()
    const request = {
      id: fiscalBusinessIdRef.current.value,
      tax_number: taxNumberRef.current.value.trim(),
      trade_name: tradeNameRef.current.value.trim(),
      soap_send_id: soapSendIdRef.current.value,
      soap_type_id: soapTypeIdRef.current.value,
      soap_username: soapUsernameRef.current.value.trim(),
      soap_password: soapPasswordRef.current.value.trim(),
      soap_url: soapUrlRef.current.value.trim(),
      detraction_account: detractionAccountRef.current.value.trim(),
      payment_accounts: {
        title: paymentAccountsTitleRef.current.value.trim(),
        subtitle: paymentAccountsSubtitleRef.current.value.trim(),
        lines: paymentAccountsLinesRef.current.value.split(/\r?\n/).map(line => line.trim()).filter(Boolean),
      },
      certificate_due: certificateDueRef.current.value || null,
      operation_amazonia: operationAmazoniaRef.current.checked,
      send_document_to_pse: sendDocumentToPseRef.current.checked,
      url_signature_pse: urlSignaturePseRef.current.value.trim(),
      url_send_cdr_pse: urlSendCdrPseRef.current.value.trim(),
      client_id_pse: clientIdPseRef.current.value.trim(),
      integrated_query_client_id: integratedQueryClientIdRef.current.value.trim(),
      integrated_query_client_secret: integratedQueryClientSecretRef.current.value.trim(),
    }

    const result = await businessesRest.save(request)
    if (!result) return

    let latestBusiness = result.data
    const logo = logoFileRef.current?.files?.[0] ?? null
    const certificate = certificateFileRef.current?.files?.[0] ?? null
    const certificatePassword = certificatePasswordRef.current?.value?.trim?.() ?? ''

    if (logo || certificate || certificatePassword) {
      const assets = await businessesRest.uploadFiscalAssets(result.data.id, {
        logo,
        certificate,
        certificate_password: certificatePassword,
      })
      if (!assets) return
      latestBusiness = assets
    }

    setSelectedFiscalBusiness(latestBusiness)
    fillFiscalForm(latestBusiness)
    $(gridRef.current).dxDataGrid('instance').refresh()
    $(fiscalModalRef.current).modal('hide')
  }

  const onSyncFacturador = async () => {
    if (!selectedFiscalBusiness?.id) return
    const synced = await businessesRest.syncFacturador(selectedFiscalBusiness.id)
    if (!synced) return
    setSelectedFiscalBusiness(synced)
    fillFiscalForm(synced)
    if (selectedBusiness?.id === synced.id) {
      setSelectedBusiness(synced)
      await loadBranches(synced.id)
    }
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteFiscalAsset = async (type) => {
    if (!selectedFiscalBusiness?.id) return
    const { isConfirmed } = await Swal.fire({
      title: type === 'logo' ? 'Eliminar logo fiscal' : 'Eliminar certificado fiscal',
      text: 'Esta accion elimina el archivo local guardado para la empresa.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const updated = await businessesRest.deleteFiscalAsset(selectedFiscalBusiness.id, type)
    if (!updated) return
    setSelectedFiscalBusiness(updated)
    fillFiscalForm(updated)
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const loadBranches = async (businessId) => {
    const data = await businessesRest.getBranches(businessId)
    if (!data) return
    setBranches(data)
  }

  const onBranchesOpen = async (business) => {
    setSelectedBusiness(business)
    setBranches([])
    await loadBranches(business.id)
    $(branchesModalRef.current).modal('show')
  }

  const onBranchModalOpen = (branch = null) => {
    const editing = !!branch?.id
    setIsBranchEditing(editing)
    branchModeRef.current.value = editing ? 'update' : 'create'
    branchIdRef.current.value = branch?.id ?? ''
    branchNameRef.current.value = branch?.name ?? ''
    branchCodeRef.current.value = branch?.establishment_code ?? ''
    setBranchUbigeoSelection({
      ...EMPTY_UBIGEO_SELECTION,
      ubigeo: branch?.ubigeo ?? '',
    })
    branchAddressRef.current.value = branch?.address ?? ''
    branchEmailRef.current.value = branch?.email ?? ''
    branchTelephoneRef.current.value = branch?.telephone ?? ''
    branchSeriesFacturaRef.current.value = branch?.series_factura ?? ''
    branchSeriesBoletaRef.current.value = branch?.series_boleta ?? ''
    branchSeriesNotaCreditoRef.current.value = branch?.series_nota_credito ?? ''
    branchSeriesGuiaRef.current.value = branch?.series_guia ?? ''
    $(branchModalRef.current).modal('show')
  }

  const onBranchSubmit = async (e) => {
    e.preventDefault()
    if (!selectedBusiness?.id) return

    const request = {
      mode: branchModeRef.current.value || (isBranchEditing ? 'update' : 'create'),
      id: (branchModeRef.current.value === 'update' ? (branchIdRef.current.value || undefined) : undefined),
      name: branchNameRef.current.value.trim(),
      establishment_code: branchCodeRef.current.value.trim(),
      ubigeo: branchUbigeoSelection.ubigeo.trim(),
      address: branchAddressRef.current.value.trim(),
      email: branchEmailRef.current.value.trim(),
      telephone: branchTelephoneRef.current.value.trim(),
      series_factura: branchSeriesFacturaRef.current.value.trim(),
      series_boleta: branchSeriesBoletaRef.current.value.trim(),
      series_nota_credito: branchSeriesNotaCreditoRef.current.value.trim(),
      series_guia: branchSeriesGuiaRef.current.value.trim(),
    }

    const result = await businessesRest.saveBranch(selectedBusiness.id, request)
    if (!result) return

    await loadBranches(selectedBusiness.id)
    $(branchModalRef.current).modal('hide')
  }

  const onDeleteBranchClicked = async (branchId) => {
    if (!selectedBusiness?.id) return

    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar sede',
      text: 'Estas seguro de eliminar esta sede?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return

    const result = await businessesRest.deleteBranch(selectedBusiness.id, branchId)
    if (!result) return
    await loadBranches(selectedBusiness.id)
  }

  const onBranchBooleanChange = async ({ branchId, value }) => {
    if (!selectedBusiness?.id) return

    const result = await businessesRest.booleanBranch({
      businessId: selectedBusiness.id,
      branchId,
      field: 'status',
      value
    })
    if (!result) return
    await loadBranches(selectedBusiness.id)
  }

  return <>
    <div className='card mb-3'>
      <div className='card-body py-3'>
        <div className='d-flex align-items-center justify-content-between gap-3 flex-wrap'>
          <div>
            <div className='small text-muted mb-1'>Modo global de emision</div>
            <div className='d-flex align-items-center gap-2'>
              <span className={`badge bg-${facturadorMode?.mode === 'production' ? 'danger' : 'info'}-subtle text-${facturadorMode?.mode === 'production' ? 'danger' : 'info'}`}>
                {facturadorMode?.label ?? 'Demo / Test'}
              </span>
              <span className='small text-muted'>Origen: {facturadorMode?.source === 'panel' ? 'panel' : '.env'}</span>
            </div>
          </div>
          <div className='d-flex align-items-end gap-2 flex-wrap'>
            <div>
              <label className='form-label mb-1'>Ambiente</label>
              <select className='form-control' value={selectedFacturadorMode} onChange={(e) => setSelectedFacturadorMode(e.target.value)}>
                <option value='demo'>Demo / Test</option>
                <option value='production'>Produccion</option>
              </select>
            </div>
            <button type='button' className='btn btn-primary' onClick={onSaveFacturadorMode} disabled={selectedFacturadorMode === facturadorMode?.mode}>
              <i className='mdi mdi-content-save me-1'></i> Guardar modo
            </button>
          </div>
        </div>
      </div>
    </div>

    <div className='alert alert-info border mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2'>
      <div>
        Aquí solo se configura la facturación de empresas ya registradas.
        {can('businesses') ? <> El alta y edición general de empresas se hace en <b>Empresas</b>.</> : null}
      </div>
      {can('businesses') && (
        <a href='/admin/businesses' className='btn btn-sm btn-outline-primary'>
          Ir a empresas
        </a>
      )}
    </div>

    <Table
      gridRef={gridRef}
      title='Configuración de facturación'
      rest={businessesRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
          }
        })
      }}
      pageSize={25}
      columns={[
        {
          caption: 'Acciones',
          width: '120px',
          fixed: true,
          fixedPosition: 'left',
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')

            container.append(DxButton({
              className: 'btn btn-xs btn-soft-success',
              title: 'Configuracion fiscal',
              icon: 'mdi mdi-file-cog',
              onClick: () => onFiscalOpen(data)
            }))

            container.append(DxButton({
              className: 'btn btn-xs btn-soft-info',
              title: 'Sedes y series',
              icon: 'mdi mdi-office-building-marker',
              onClick: () => onBranchesOpen(data)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        },
        {
          dataField: 'id',
          caption: 'ID',
          visible: false
        },
        {
          dataField: 'name',
          caption: 'Empresa',
          minWidth: 220
        },
        {
          dataField: 'tax_number',
          caption: 'RUC',
          width: 130
        },
        {
          dataField: 'trade_name',
          caption: 'Nombre comercial',
          minWidth: 200
        },
        {
          dataField: 'facturador_sync_status',
          caption: 'Sync facturador',
          width: 145,
          cellTemplate: (container, { data }) => {
            const meta = getFacturadorSyncMeta(data.facturador_sync_status)
            container.html(`<span class="badge bg-${meta.color}-subtle text-${meta.color}">${meta.label}</span>`)
          }
        },
        {
          dataField: 'facturador_last_sync_at',
          caption: 'Último sync',
          width: 170
        },
        {
          dataField: 'fiscal_logo_path',
          caption: 'Logo',
          width: 90,
          allowFiltering: false,
          cellTemplate: (container, { data }) => {
            container.html(`<div class="form-check form-switch m-0"><input class="form-check-input" type="checkbox" ${data.fiscal_logo_path ? 'checked' : ''} disabled /></div>`)
          }
        },
        {
          dataField: 'fiscal_certificate_path',
          caption: 'Certificado',
          width: 110,
          allowFiltering: false,
          cellTemplate: (container, { data }) => {
            container.html(`<div class="form-check form-switch m-0"><input class="form-check-input" type="checkbox" ${data.fiscal_certificate_path ? 'checked' : ''} disabled /></div>`)
          }
        },
        {
          dataField: 'facturador_sync_message',
          caption: 'Mensaje sync',
          minWidth: 240
        },
        {
          dataField: 'creator.fullname',
          caption: 'Creado por',
          visible: false,
          cellTemplate: (container, { data }) => {
            container.text(formatAuditUser(data.creator))
          }
        },
        {
          dataField: 'updater.fullname',
          caption: 'Actualizado por',
          visible: false,
          cellTemplate: (container, { data }) => {
            container.text(formatAuditUser(data.updater))
          }
        },
        {
          dataField: 'status',
          caption: 'Estado',
          width: '100px',
          cellTemplate: (container, { data }) => {
            const status = data.status == 1 ? 'Activo' : 'Inactivo'
            const color = data.status == 1 ? 'success' : 'secondary'
            container.html(`<span class="badge bg-${color}-subtle text-${color}">${status}</span>`)
          }
        },
        {
          caption: 'Acciones',
          width: '220px',
          visible: false,
          showInColumnChooser: false,
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')

            container.append(DxButton({
              className: 'btn btn-xs btn-soft-success',
              title: 'Configuración fiscal',
              icon: 'mdi mdi-file-cog',
              onClick: () => onFiscalOpen(data)
            }))

            container.append(DxButton({
              className: 'btn btn-xs btn-soft-info',
              title: 'Sucursales y series',
              icon: 'mdi mdi-office-building-marker',
              onClick: () => onBranchesOpen(data)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]}
    />

    <Modal modalRef={fiscalModalRef} title={`Configuración fiscal${selectedFiscalBusiness ? ` - ${selectedFiscalBusiness.name}` : ''}`} onSubmit={onSaveFiscal} size='xl'>
      <input ref={fiscalBusinessIdRef} type='hidden' />
      <div className='row'>
        <div className='col-12 mb-2 d-flex justify-content-between align-items-center gap-2 flex-wrap'>
          <div className='small text-muted'>
            Sync actual: <b>{getFacturadorSyncMeta(selectedFiscalBusiness?.facturador_sync_status).label}</b>
            {selectedFiscalBusiness?.facturador_last_sync_at && <> | Último sync: <b>{selectedFiscalBusiness.facturador_last_sync_at.toString()}</b></>}
          </div>
          <button type='button' className='btn btn-sm btn-outline-primary' onClick={onSyncFacturador}>
            <i className='mdi mdi-sync me-1'></i> Sincronizar con facturador
          </button>
        </div>
        {selectedFiscalBusiness?.facturador_sync_message && (
          <div className='col-12 mb-3'>
            <div className='alert alert-light border mb-0 py-2'>{selectedFiscalBusiness.facturador_sync_message}</div>
          </div>
        )}
        <div className='col-md-3 mb-3'><label className='form-label'>RUC</label><input ref={taxNumberRef} className='form-control' maxLength={11} /></div>
        <div className='col-md-5 mb-3'><label className='form-label'>Nombre comercial</label><input ref={tradeNameRef} className='form-control' /></div>
        <div className='col-md-2 mb-3'><label className='form-label'>SOAP send</label><select ref={soapSendIdRef} className='form-control'><option value='01'>Sunat</option><option value='02'>OSE</option></select></div>
        <div className='col-md-2 mb-3'><label className='form-label'>SOAP type</label><select ref={soapTypeIdRef} className='form-control'><option value='01'>Beta</option><option value='02'>Producción</option></select></div>
        <div className='col-md-4 mb-3'><label className='form-label'>SOAP usuario</label><input ref={soapUsernameRef} className='form-control' /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>SOAP clave</label><input ref={soapPasswordRef} className='form-control' /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>SOAP URL</label><input ref={soapUrlRef} className='form-control' /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Cuenta detracción</label><input ref={detractionAccountRef} className='form-control' /></div>
        <div className='col-12'>
          <hr className='my-2' />
          <h5 className='mb-1'>Datos bancarios para comprobantes</h5>
          <small className='text-muted'>Estos datos se guardan por empresa y salen en la previsualizacion PDF local.</small>
        </div>
        <div className='col-md-4 mb-3'><label className='form-label'>Titulo</label><input ref={paymentAccountsTitleRef} className='form-control' placeholder='KAMARY PERU SAC' /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Subtitulo</label><input ref={paymentAccountsSubtitleRef} className='form-control' placeholder='Cuentas Soles' /></div>
        <div className='col-md-4 mb-3'></div>
        <div className='col-12 mb-3'>
          <label className='form-label'>Cuentas bancarias</label>
          <textarea
            ref={paymentAccountsLinesRef}
            className='form-control'
            rows={5}
            placeholder={'Banco Continental 0011-0341-0100042961\nCCI 011-341-000100042961-51\nBanco Crédito 191-8971815-0-91\nCCI 002-191-008971815091-58'}
          />
          <small className='text-muted'>Ingresa una linea por cada cuenta o CCI.</small>
        </div>
        <div className='col-md-4 mb-3'><label className='form-label'>Vence certificado</label><input ref={certificateDueRef} type='date' className='form-control' /></div>
        <div className='col-md-4 mb-3 d-flex align-items-end'><div className='form-check mb-2'><input ref={operationAmazoniaRef} type='checkbox' className='form-check-input' id='operation-amazonia-settings' /><label className='form-check-label' htmlFor='operation-amazonia-settings'>Operación amazonia</label></div></div>
        <div className='col-md-4 mb-3 d-flex align-items-end'><div className='form-check mb-2'><input ref={sendDocumentToPseRef} type='checkbox' className='form-check-input' id='send-document-to-pse-settings' /><label className='form-check-label' htmlFor='send-document-to-pse-settings'>Enviar a PSE</label></div></div>
        <div className='col-md-4 mb-3'><label className='form-label'>PSE firma URL</label><input ref={urlSignaturePseRef} className='form-control' /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>PSE CDR URL</label><input ref={urlSendCdrPseRef} className='form-control' /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>PSE client id</label><input ref={clientIdPseRef} className='form-control' /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Integrated query id</label><input ref={integratedQueryClientIdRef} className='form-control' /></div>
        <div className='col-md-4 mb-3'><label className='form-label'>Integrated query secret</label><input ref={integratedQueryClientSecretRef} className='form-control' /></div>
        <div className='col-md-4 mb-3'></div>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Logo fiscal</label>
          <input ref={logoFileRef} type='file' className='form-control' accept='.png,.jpg,.jpeg,.gif,.svg' onChange={onLogoFileChange} />
          <small className='text-muted d-block mt-1'>Actual: {selectedFiscalBusiness?.fiscal_logo_path ?? 'sin archivo'}</small>
          <div className='border rounded mt-2 p-2 bg-light d-flex align-items-center justify-content-center' style={{ minHeight: 130 }}>
            {logoPreviewUrl
              ? <img
                src={logoPreviewUrl}
                alt='Logo fiscal'
                className='img-fluid'
                style={{ maxHeight: 110, objectFit: 'contain' }}
                onLoad={() => setLogoPreviewError('')}
                onError={() => setLogoPreviewError('No se pudo cargar la imagen del logo.')}
              />
              : <span className='text-muted'>Sin logo cargado</span>}
          </div>
          <div className='d-flex flex-wrap align-items-center gap-2 mt-2'>
            {logoPreviewLabel && <span className='badge bg-soft-primary text-primary border border-primary'>{logoPreviewLabel}</span>}
            {logoPreviewUrl && <a href={logoPreviewUrl} target='_blank' rel='noreferrer' className='btn btn-xs btn-soft-primary'>Abrir imagen</a>}
            {selectedFiscalBusiness?.fiscal_logo_path && <button type='button' className='btn btn-xs btn-soft-danger' onClick={() => onDeleteFiscalAsset('logo')}>Eliminar logo</button>}
          </div>
          {logoPreviewError && <small className='text-danger d-block mt-1'>{logoPreviewError}</small>}
        </div>
        <div className='col-md-6 mb-3'>
          <label className='form-label'>Certificado fiscal</label>
          <input ref={certificateFileRef} type='file' className='form-control' accept='.pfx,.p12' />
          <small className='text-muted d-block mt-1'>Actual: {selectedFiscalBusiness?.fiscal_certificate_path ?? 'sin archivo'}</small>
          {selectedFiscalBusiness?.fiscal_certificate_path && <button type='button' className='btn btn-xs btn-soft-danger mt-2' onClick={() => onDeleteFiscalAsset('certificate')}>Eliminar certificado</button>}
        </div>
        <div className='col-md-6 mb-1'><label className='form-label'>Clave del certificado</label><input ref={certificatePasswordRef} type='password' className='form-control' autoComplete='new-password' /></div>
      </div>
    </Modal>

    <Modal
      modalRef={branchesModalRef}
      title={`Sucursales y series${selectedBusiness ? ` - ${selectedBusiness.name}` : ''}`}
      size='xl'
      hideButtonSubmit
    >
      <div className='d-flex justify-content-end mb-2'>
        <button type='button' className='btn btn-sm btn-primary' onClick={() => onBranchModalOpen()}>
          <i className='mdi mdi-plus me-1'></i> Agregar sucursal
        </button>
      </div>

      <div className='table-responsive border rounded'>
        <table className='table table-sm table-striped mb-0 align-middle'>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Código</th>
              <th>ID remoto</th>
              <th>Sync</th>
              <th>Ubigeo</th>
              <th>Direccion</th>
              <th>F001</th>
              <th>B001</th>
              <th>NC</th>
              <th>GRE</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 && (
              <tr>
                <td colSpan={12} className='text-center text-muted'>Sin sucursales registradas</td>
              </tr>
            )}
            {branches.map(branch => (
              <tr key={`branch-setting-${branch.id}`}>
                <td>{branch.name}</td>
                <td>{branch.establishment_code ?? '-'}</td>
                <td>{branch.facturador_establishment_id ?? '-'}</td>
                <td>
                  {(() => {
                    const meta = getFacturadorSyncMeta(branch.facturador_sync_status)
                    return branch.facturador_sync_status
                      ? <span className={`badge bg-${meta.color}-subtle text-${meta.color}`}>{meta.label}</span>
                      : <span className='text-muted'>{meta.label}</span>
                  })()}
                </td>
                <td>{branch.ubigeo ?? '-'}</td>
                <td>{branch.address ?? '-'}</td>
                <td>{branch.series_factura ?? '-'}</td>
                <td>{branch.series_boleta ?? '-'}</td>
                <td>{branch.series_nota_credito ?? '-'}</td>
                <td>{branch.series_guia ?? '-'}</td>
                <td>
                  {branch.status === null ? <span className='text-muted'>-</span> : (
                    <SwitchFormGroup checked={branch.status == 1} onChange={() => onBranchBooleanChange({
                      branchId: branch.id,
                      value: !branch.status
                    })} />
                  )}
                </td>
                <td>
                  <div className='d-flex gap-1'>
                    <button type='button' className='btn btn-xs btn-soft-primary' onClick={() => onBranchModalOpen(branch)}>
                      <i className='mdi mdi-pencil'></i>
                    </button>
                    <button type='button' className='btn btn-xs btn-soft-danger' onClick={() => onDeleteBranchClicked(branch.id)}>
                      <i className='mdi mdi-delete'></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>

    <Modal
      modalRef={branchModalRef}
      title={isBranchEditing ? 'Editar sucursal fiscal' : 'Agregar sucursal fiscal'}
      onSubmit={onBranchSubmit}
      size='lg'
    >
      <input ref={branchModeRef} type='hidden' defaultValue='create' />
      <input ref={branchIdRef} type='hidden' />
      <div className='row'>
        <InputFormGroup eRef={branchNameRef} label='Nombre de la sucursal' col='col-md-6' required />
        <InputFormGroup eRef={branchCodeRef} label='Código fiscal de sede' col='col-md-3' />
        <div className='col-12'>
          <UbigeoCascade
            value={branchUbigeoSelection}
            onChange={setBranchUbigeoSelection}
            required
            showUbigeo={false}
            departmentCol='col-md-4'
            provinceCol='col-md-4'
            districtCol='col-md-4'
            rowClassName='row'
          />
        </div>
        <InputFormGroup eRef={branchAddressRef} label='Dirección fiscal' col='col-md-12' />
        <InputFormGroup eRef={branchEmailRef} label='Correo sede' col='col-md-6' type='email' />
        <InputFormGroup eRef={branchTelephoneRef} label='Teléfono sede' col='col-md-6' />
        <InputFormGroup eRef={branchSeriesFacturaRef} label='Serie factura' col='col-md-4' />
        <InputFormGroup eRef={branchSeriesBoletaRef} label='Serie boleta' col='col-md-4' />
        <InputFormGroup eRef={branchSeriesNotaCreditoRef} label='Serie nota crédito' col='col-md-4' />
        <InputFormGroup eRef={branchSeriesGuiaRef} label='Serie guia remision' col='col-md-4' />
      </div>
    </Modal>
  </>
}

CreateReactScript((el, properties) => {
  const hasAccess = properties.hasRole('Admin')
    || (isMagistralesPath() ? properties.can('magistrales-billing') : (properties.can('businesses') || properties.can('services-billing')))
  if (!hasAccess) location.href = '/admin/'
  createRoot(el).render(<BaseAdminto {...properties} title='Configuración de facturación'>
    <BillingSettings {...properties} />
  </BaseAdminto>)
})
