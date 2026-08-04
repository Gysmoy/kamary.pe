// Parches globales para select2 dentro de modales de Bootstrap 5.
//
// 1) Cierre al hacer scroll/arrastre sobre las opciones.
//    Al hacer mousedown en cualquier zona del dropdown que no sea el buscador (la barra de
//    scroll, el borde, un hueco entre opciones) el campo `.select2-search__field` pierde el
//    foco. El focus trap del modal se lo lleva de inmediato al propio modal y select2, al
//    detectar que ya no tiene el foco, cierra el desplegable. Secuencia observada:
//      mousedown -> focusout .select2-search__field -> focusin .modal -> select2:closing
//    Con preventDefault en ese mousedown el navegador no mueve el foco, el buscador lo
//    conserva y el trap del modal nunca se activa. select2 elige la opcion en `mouseup`,
//    asi que seleccionar y escribir siguen funcionando igual.
//
// 2) Escape cerraba el formulario entero.
//    El handler de Escape del modal esta enganchado al modal, que en burbujeo recibe la tecla
//    antes que document. Si hay un select2 abierto, el Escape debe consumirlo solo el
//    desplegable. Mismo criterio que en VdSelect.

let installed = false

export const installSelect2ModalFixes = () => {
  if (installed) return
  const $ = window.jQuery || window.$
  if (!$ || !$.fn?.select2) return
  installed = true

  // En FASE DE CAPTURA a proposito: select2 corta la propagacion del mousedown dentro de los
  // resultados, asi que un handler delegado en document (burbujeo) nunca llegaria a ejecutarse.
  document.addEventListener('mousedown', (event) => {
    const target = event.target
    if (!target?.closest) return
    if (!target.closest('.select2-dropdown')) return
    if (target.closest('.select2-search__field')) return
    event.preventDefault()
  }, true)

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return
    if (!document.querySelector('.select2-container--open')) return
    event.stopPropagation()
  }, true)
}

export default installSelect2ModalFixes
