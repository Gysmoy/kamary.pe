const emptyLabel = '-'

const renderGridEditLink = (container, label, onClick, title = 'Editar') => {
  const text = label === null || label === undefined || label === '' ? emptyLabel : `${label}`
  const wrapper = $(container)

  wrapper.empty()
  wrapper.css('text-overflow', 'unset')

  $('<button type="button" class="btn btn-link admin-grid-edit-link p-0 text-start fw-semibold"></button>')
    .text(text)
    .attr('title', title)
    .on('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      onClick?.()
    })
    .appendTo(wrapper)
}

export default renderGridEditLink
