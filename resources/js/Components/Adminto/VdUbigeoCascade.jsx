import React, { useEffect, useMemo, useState } from 'react'
import VdSelect from './VdSelect'
import {
  EMPTY_UBIGEO_SELECTION,
  getUbigeoCatalog,
  getUbigeoDistricts,
  getUbigeoProvinces,
  isSameUbigeoSelection,
  normalizeUbigeoSelection,
} from '../../Utils/ubigeoInei'

// Equivalente a UbigeoCascade pero armado con VdSelect en lugar de select2, para pantallas ya
// migradas. Comparte el mismo catalogo INEI cacheado (Utils/ubigeoInei) y el mismo contrato:
// value/onChange manejan { ubigeo, department, province, district } y el codigo de ubigeo se
// deduce del distrito elegido.
const VdUbigeoCascade = ({
  value = EMPTY_UBIGEO_SELECTION,
  onChange = () => { },
  disabled = false,
  required = false,
  showUbigeo = true,
  ubigeoLabel = 'Ubigeo',
  departmentLabel = 'Departamento',
  provinceLabel = 'Provincia',
  districtLabel = 'Distrito',
  ubigeoCol = 'col-12 col-md-6 col-xl-3',
  departmentCol = 'col-12 col-md-6 col-xl-3',
  provinceCol = 'col-12 col-md-6 col-xl-3',
  districtCol = 'col-12 col-md-6 col-xl-3',
}) => {
  const [catalog, setCatalog] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    getUbigeoCatalog()
      .then((result) => {
        if (!active) return
        setCatalog(result)
        setIsLoading(false)
      })
      .catch(() => {
        if (!active) return
        setIsLoading(false)
      })

    return () => { active = false }
  }, [])

  const current = useMemo(
    () => normalizeUbigeoSelection(value, catalog),
    [catalog, value?.ubigeo, value?.department, value?.province, value?.district]
  )
  const provinces = useMemo(() => getUbigeoProvinces(catalog, current.department), [catalog, current.department])
  const districts = useMemo(() => getUbigeoDistricts(catalog, current.department, current.province), [catalog, current.department, current.province])

  // Al terminar de cargar el catalogo se avisa al padre del valor ya normalizado (p. ej. cuando se
  // abrio el formulario con un ubigeo guardado y hay que derivar departamento/provincia/distrito).
  useEffect(() => {
    if (!catalog) return
    if (isSameUbigeoSelection(value, current)) return
    onChange(current)
  }, [catalog, current])

  const isSelectDisabled = disabled || isLoading || !catalog
  const placeholder = isLoading ? 'Cargando...' : 'Seleccionar'

  return (<>
    <VdSelect
      col={departmentCol}
      label={departmentLabel}
      required={required}
      disabled={isSelectDisabled}
      value={current.department}
      onChange={(department) => onChange({ ubigeo: '', department, province: '', district: '' })}
      options={(catalog?.departments ?? []).map((item) => ({ value: item, label: item }))}
      placeholder={placeholder}
    />

    <VdSelect
      col={provinceCol}
      label={provinceLabel}
      required={required}
      disabled={isSelectDisabled || !current.department}
      value={current.province}
      onChange={(province) => onChange({ ubigeo: '', department: current.department, province, district: '' })}
      options={provinces.map((item) => ({ value: item, label: item }))}
      placeholder={current.department ? placeholder : 'Seleccione departamento'}
    />

    <VdSelect
      col={districtCol}
      label={districtLabel}
      required={required}
      disabled={isSelectDisabled || !current.province}
      value={current.district}
      onChange={(district) => onChange({
        ubigeo: districts.find((item) => item.district === district)?.code ?? '',
        department: current.department,
        province: current.province,
        district,
      })}
      options={districts.map((item) => ({ value: item.district, label: item.district }))}
      placeholder={current.province ? placeholder : 'Seleccione provincia'}
    />

    {showUbigeo && (
      <div className={`form-group ${ubigeoCol} mb-2`}>
        <label className='form-label mb-1'>{ubigeoLabel}</label>
        <input className='form-control bg-light' value={current.ubigeo} readOnly disabled={disabled} />
      </div>
    )}
  </>)
}

export default VdUbigeoCascade
