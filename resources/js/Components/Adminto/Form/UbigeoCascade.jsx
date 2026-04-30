import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  EMPTY_UBIGEO_SELECTION,
  getUbigeoCatalog,
  getUbigeoDistricts,
  getUbigeoProvinces,
  isSameUbigeoSelection,
  normalizeUbigeoSelection
} from '../../../Utils/ubigeoInei'
import SelectFormGroup from './SelectFormGroup'

const EMPTY_UBIGEO_CATALOG = {
  departments: [],
  provincesByDepartment: new Map(),
  districtsByDepartmentProvince: new Map(),
  recordByCode: new Map(),
}

const UbigeoCascade = ({
  value = EMPTY_UBIGEO_SELECTION,
  onChange = () => {},
  required = false,
  disabled = false,
  showUbigeo = true,
  ubigeoLabel = 'Ubigeo',
  departmentLabel = 'Departamento',
  provinceLabel = 'Provincia',
  districtLabel = 'Distrito',
  ubigeoCol = 'col-md-3',
  departmentCol = 'col-md-3',
  provinceCol = 'col-md-3',
  districtCol = 'col-md-3',
  rowClassName = 'row',
}) => {
  const [catalog, setCatalog] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const fieldKeyRef = useRef(`ubigeo-cascade-${crypto.randomUUID()}`)
  const departmentRef = useRef()
  const provinceRef = useRef()
  const districtRef = useRef()

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
        setCatalog(EMPTY_UBIGEO_CATALOG)
        setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const current = useMemo(() => normalizeUbigeoSelection(value, catalog), [catalog, value?.ubigeo, value?.department, value?.province, value?.district])
  const provinces = useMemo(() => getUbigeoProvinces(catalog, current.department), [catalog, current.department])
  const districts = useMemo(() => getUbigeoDistricts(catalog, current.department, current.province), [catalog, current.department, current.province])

  useEffect(() => {
    if (!catalog) return
    if (isSameUbigeoSelection(value, current)) return
    onChange(current)
  }, [catalog, current, onChange, value])

  const handleDepartmentChange = (event) => {
    onChange({
      ubigeo: '',
      department: event.target.value,
      province: '',
      district: '',
    })
  }

  const handleProvinceChange = (event) => {
    onChange({
      ubigeo: '',
      department: current.department,
      province: event.target.value,
      district: '',
    })
  }

  const handleDistrictChange = (event) => {
    const district = event.target.value
    const match = districts.find((item) => item.district === district)

    onChange({
      ubigeo: match?.code ?? '',
      department: current.department,
      province: current.province,
      district,
    })
  }

  const selectPlaceholder = isLoading ? 'Cargando...' : 'Seleccionar'
  const isSelectDisabled = disabled || isLoading || !catalog

  return (
    <div className={rowClassName}>
      {showUbigeo && (
        <div className={`form-group ${ubigeoCol} mb-2`}>
          <label className='form-label mb-1'>{ubigeoLabel}</label>
          <input
            className='form-control'
            value={current.ubigeo}
            readOnly
            disabled={disabled}
          />
        </div>
      )}

      <SelectFormGroup
        id={`${fieldKeyRef.current}-department`}
        eRef={departmentRef}
        col={departmentCol}
        label={departmentLabel}
        value={current.department}
        onChange={handleDepartmentChange}
        disabled={isSelectDisabled}
        required={required}
        minimumResultsForSearch={0}
        effectWith={[isLoading, catalog?.departments?.length ?? 0]}
      >
          <option value=''>{selectPlaceholder}</option>
          {(catalog?.departments ?? []).map((item) => (
            <option key={`ubigeo-department-${item}`} value={item}>{item}</option>
          ))}
      </SelectFormGroup>

      <SelectFormGroup
        id={`${fieldKeyRef.current}-province`}
        eRef={provinceRef}
        col={provinceCol}
        label={provinceLabel}
        value={current.province}
        onChange={handleProvinceChange}
        disabled={isSelectDisabled || !current.department}
        required={required}
        minimumResultsForSearch={0}
        effectWith={[isLoading, current.department, provinces.length]}
      >
          <option value=''>{selectPlaceholder}</option>
          {provinces.map((item) => (
            <option key={`ubigeo-province-${current.department}-${item}`} value={item}>{item}</option>
          ))}
      </SelectFormGroup>

      <SelectFormGroup
        id={`${fieldKeyRef.current}-district`}
        eRef={districtRef}
        col={districtCol}
        label={districtLabel}
        value={current.district}
        onChange={handleDistrictChange}
        disabled={isSelectDisabled || !current.province}
        required={required}
        minimumResultsForSearch={0}
        effectWith={[isLoading, current.department, current.province, districts.length]}
      >
          <option value=''>{selectPlaceholder}</option>
          {districts.map((item) => (
            <option key={`ubigeo-district-${item.code}`} value={item.district}>{item.district}</option>
          ))}
      </SelectFormGroup>
    </div>
  )
}

export default UbigeoCascade
