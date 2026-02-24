import Tippy from "@tippyjs/react"
import React, { useEffect, useRef } from "react"

const SwitchFormGroup = ({ id, col, eRef, label, specification, required = false, onChange, disabled = false, checked, refreshable = null, noMargin }) => {
  if (!id) id = `ck-${crypto.randomUUID()}`
  if (!eRef) eRef = useRef()

  useEffect(() => {
    new Switchery(eRef.current, {
      size: 'small',
      color: '#64b0f2',
    })
    $(eRef.current).on('change', onChange);

    return () => {
      $(eRef.current).parents('.form-group').find('.switchery').remove()
      $(eRef.current).off('change') // algo por aqui
    }
  }, [refreshable])

  return <>
    <div className={`form-group ${col} ${noMargin ? 'mb-0' : 'mb-2'}`}>
      {
        label &&
        <>
          <label htmlFor='' className="form-label mb-1 d-block">
            {label} {required && <b className="text-danger">*</b>}
            {specification && <Tippy content={specification}>
              <small className="ms-1 fa fa-question-circle text-muted"></small>
            </Tippy>
            }
          </label>
        </>
      }
      <input ref={eRef} id={id} type="checkbox" data-plugin="switchery" required={required} disabled={disabled} defaultChecked={checked} />
    </div>
  </>
}

export default SwitchFormGroup