import React, { useEffect } from 'react';

const Modal = ({ id, modalRef, title = 'Modal', isStatic = false, size = 'md', children, bodyClass = '', btnCancelText, btnSubmitText, hideFooter = false, bodyStyle, zIndex, hideButtonSubmit, onSubmit = (e) => { e.preventDefault(); $(modalRef.current).modal('hide') }, onClose = () => { } }) => {
  const staticProp = isStatic ? { 'data-bs-backdrop': 'static' } : {}

  if (!id) id = `modal-${crypto.randomUUID()}`;

  useEffect(() => {
    $(modalRef.current).on('hidden.bs.modal', function (e) {
      onClose(this);
    })
    return () => $(modalRef.current).off('hidden.bs.modal')
  }, [])

  return (<form id={id} className='modal fade' ref={modalRef} tabIndex='-1' aria-hidden='true' {...staticProp} onSubmit={onSubmit} autoComplete='off' style={{ zIndex }}>
    <div className={`modal-dialog modal-dialog-centered modal-${size ?? 'md'}`}>
      <div className='modal-content ' style={{ boxShadow: '0 0 10px rgba(0,0,0,0.25)' }}>
        <div className='modal-header'>
          {
            typeof title == 'object'
              ? title
              : <h4 className='modal-title'>{title}</h4>
          }
          <button type='button' className='btn-close' data-bs-dismiss='modal' aria-label='Close'></button>
        </div>
        <div className={`modal-body ${bodyClass ?? ''}`} style={bodyStyle}>
          {children}
        </div>
        {
          !hideFooter && <>
            <div className="modal-footer">
              <button type="button" className="btn BTN-SM btn-light" data-bs-dismiss="modal">{btnCancelText ?? 'Cerrar'}</button>
              {!hideButtonSubmit && <button type="submit" className="btn BTN-SM btn-primary">{btnSubmitText ?? 'Aceptar'}</button>}
            </div>
          </>
        }
      </div>
    </div>
  </form >
  )
}

export default Modal