export const EMPTY_UBIGEO_SELECTION = {
  ubigeo: '',
  department: '',
  province: '',
  district: '',
}

const emptyCatalog = {
  departments: [],
  provincesByDepartment: new Map(),
  districtsByDepartmentProvince: new Map(),
  recordByCode: new Map(),
}

const toText = (value) => `${value ?? ''}`.trim()

const sortByName = (values) => [...values].sort((a, b) => a.localeCompare(b, 'es'))

const buildCatalog = (rows = []) => {
  const catalog = {
    departments: [],
    provincesByDepartment: new Map(),
    districtsByDepartmentProvince: new Map(),
    recordByCode: new Map(),
  }

  for (const row of rows) {
    const item = {
      code: toText(row.code),
      department: toText(row.department),
      province: toText(row.province),
      district: toText(row.district),
    }

    if (!item.code || !item.department || !item.province || !item.district) continue

    catalog.recordByCode.set(item.code, item)

    const provinces = catalog.provincesByDepartment.get(item.department) ?? new Set()
    provinces.add(item.province)
    catalog.provincesByDepartment.set(item.department, provinces)

    const districtKey = `${item.department}|${item.province}`
    const districts = catalog.districtsByDepartmentProvince.get(districtKey) ?? []
    districts.push({ code: item.code, district: item.district })
    catalog.districtsByDepartmentProvince.set(districtKey, districts)
  }

  catalog.departments = sortByName(catalog.provincesByDepartment.keys())

  return catalog
}

let ubigeoCatalogCache = null
let ubigeoCatalogPromise = null

export const getUbigeoCatalog = async () => {
  if (ubigeoCatalogCache) return ubigeoCatalogCache
  if (ubigeoCatalogPromise) return ubigeoCatalogPromise

  ubigeoCatalogPromise = fetch('/api/admin/ubigeo/inei', {
    headers: {
      Accept: 'application/json',
    },
  })
    .then(async (response) => {
      if (!response.ok) throw new Error('No se pudo cargar el ubigeo.')
      const rows = await response.json()
      ubigeoCatalogCache = buildCatalog(rows)
      return ubigeoCatalogCache
    })
    .catch((error) => {
      ubigeoCatalogPromise = null
      throw error
    })

  return ubigeoCatalogPromise
}

export const getUbigeoProvinces = (catalog = emptyCatalog, department) => {
  const provinces = catalog.provincesByDepartment.get(toText(department))
  return provinces ? sortByName(provinces) : []
}

export const getUbigeoDistricts = (catalog = emptyCatalog, department, province) => {
  const districts = catalog.districtsByDepartmentProvince.get(`${toText(department)}|${toText(province)}`) ?? []
  return [...districts].sort((a, b) => a.district.localeCompare(b.district, 'es'))
}

export const normalizeUbigeoSelection = (selection = EMPTY_UBIGEO_SELECTION, catalog = emptyCatalog) => {
  const ubigeo = toText(selection.ubigeo)
  const department = toText(selection.department)
  const province = toText(selection.province)
  const district = toText(selection.district)

  if (!catalog) {
    return { ubigeo, department, province, district }
  }

  if (ubigeo && catalog.recordByCode.has(ubigeo)) {
    const match = catalog.recordByCode.get(ubigeo)

    return {
      ubigeo: match.code,
      department: match.department,
      province: match.province,
      district: match.district,
    }
  }

  if (!department || !catalog.provincesByDepartment.has(department)) {
    return { ...EMPTY_UBIGEO_SELECTION }
  }

  const provinceOptions = getUbigeoProvinces(catalog, department)
  if (!province || !provinceOptions.includes(province)) {
    return {
      ubigeo: '',
      department,
      province: '',
      district: '',
    }
  }

  const districtOptions = getUbigeoDistricts(catalog, department, province)
  const districtMatch = districtOptions.find((item) => item.district === district)
  if (!districtMatch) {
    return {
      ubigeo: '',
      department,
      province,
      district: '',
    }
  }

  return {
    ubigeo: districtMatch.code,
    department,
    province,
    district,
  }
}

export const isSameUbigeoSelection = (left = EMPTY_UBIGEO_SELECTION, right = EMPTY_UBIGEO_SELECTION) => (
  toText(left.ubigeo) === toText(right.ubigeo)
  && toText(left.department) === toText(right.department)
  && toText(left.province) === toText(right.province)
  && toText(left.district) === toText(right.district)
)
