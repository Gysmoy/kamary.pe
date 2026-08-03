import React, { useEffect } from 'react';

const Modal = ({ id, modalRef, title = 'Modal', isStatic = false, size = 'md', children, bodyClass = '', dialogClass = '', contentClass = '', headerClass = '', closeButtonClass = '', btnCancelText, btnSubmitText, hideFooter = false, footerActions = null, footerClass = '', bodyStyle, zIndex, hideButtonSubmit, asForm = true, centered = true, preventEnterSubmit = false, onSubmit = (e) => { e.preventDefault(); $(modalRef.current).modal('hide') }, onClose = () => { } }) => {
  const staticProp = isStatic ? { 'data-bs-backdrop': 'static' } : {}
  const contentStyle = {
    boxShadow: '0 0 10px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 3.5rem)',
    overflow: 'hidden',
  }
  const modalBodyStyle = {
    flex: '1 1 auto',
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    ...bodyStyle,
  }

  if (!id) id = `modal-${crypto.randomUUID()}`;

  useEffect(() => {
    $(modalRef.current).on('hidden.bs.modal', function (e) {
      onClose(this);
    })
    return () => $(modalRef.current).off('hidden.bs.modal')
  }, [])

  // En formularios largos (varias secciones + tabla de detalle) un Enter accidental en cualquier
  // input envia el modal completo y lo cierra. Con preventEnterSubmit el envio queda reservado al
  // boton de guardar; se sigue permitiendo Enter en textareas y sobre botones (accesibilidad).
  const onWrapperKeyDown = (e) => {
    if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return
    const target = e.target
    const tag = `${target?.tagName ?? ''}`.toLowerCase()
    if (tag === 'textarea' || tag === 'button' || tag === 'a') return
    if (target?.isContentEditable) return
    e.preventDefault()
  }

  const Wrapper = asForm ? 'form' : 'div'
  const wrapperProps = asForm
    ? { onSubmit, autoComplete: 'off', ...(preventEnterSubmit ? { onKeyDown: onWrapperKeyDown } : {}) }
    : {}

  return (<Wrapper id={id} className='modal fade' ref={modalRef} tabIndex='-1' aria-hidden='true' {...staticProp} {...wrapperProps} style={{ zIndex }}>
    <div className={`modal-dialog ${centered ? 'modal-dialog-centered' : ''} modal-${size ?? 'md'} ${dialogClass ?? ''}`}>
      <div className={`modal-content ${contentClass ?? ''}`} style={contentStyle}>
        <div className={`modal-header ${headerClass ?? ''}`}>
          {
            typeof title == 'object'
              ? title
              : <h4 className='modal-title'>{title}</h4>
          }
          <button type='button' className={`btn-close ${closeButtonClass ?? ''}`} data-bs-dismiss='modal' aria-label='Close'></button>
        </div>
        <div className={`modal-body ${bodyClass ?? ''}`} style={modalBodyStyle}>
          {children}
        </div>
        {
          !hideFooter && <>
            <div className={`modal-footer ${footerClass ?? ''}`}>
              {footerActions}
              <button type="button" className="btn BTN-SM btn-light" data-bs-dismiss="modal">{btnCancelText ?? 'Cerrar'}</button>
              {!hideButtonSubmit && <button type="submit" className="btn BTN-SM btn-primary">{btnSubmitText ?? 'Aceptar'}</button>}
            </div>
          </>
        }
      </div>
    </div>
  </Wrapper>
  )
}

export default Modal
