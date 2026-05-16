const pluralize = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`

const select2SpanishLanguage = {
  errorLoading: () => 'No se pudieron cargar los resultados',
  inputTooLong: ({ input = '', maximum = 0 }) => `Elimine ${pluralize(Math.max(input.length - maximum, 0), 'carácter', 'caracteres')}`,
  inputTooShort: ({ input = '', minimum = 0 }) => `Ingrese ${pluralize(Math.max(minimum - input.length, 0), 'carácter', 'caracteres')} más`,
  loadingMore: () => 'Cargando más resultados...',
  maximumSelected: ({ maximum = 0 }) => `Solo puede seleccionar ${pluralize(maximum, 'elemento')}`,
  noResults: () => 'Sin resultados',
  removeAllItems: () => 'Eliminar todos los elementos',
  searching: () => 'Buscando...',
}

export default select2SpanishLanguage
