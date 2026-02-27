import React, { useEffect, useRef, useState } from "react"

const SelectFormGroup = ({ id, col, className, label, specification, eRef, value, required = false, children, dropdownParent, noMargin = false, multiple = false, disabled = false, onChange = () => { }, style,
  templateResult,
  templateSelection,
  minimumInputLength = 0,
  minimumResultsForSearch,
  effectWith = [],
  tags
}) => {

  if (!eRef) eRef = useRef()
  if (!id) id = `select-${crypto.randomUUID()}`
  const containerId = `container-${id}`

  const [localValue, setLocalValue] = useState(value ?? null)

  useEffect(() => {
    $(eRef.current).select2({
      dropdownParent: `#${containerId}`,
      templateResult,
      templateSelection,
      minimumInputLength,
      minimumResultsForSearch,
      tags
    })
    $(eRef.current).off('change').on('change', (e) => {
      setLocalValue(e.target.value)
      onChange(e)
    })
  }, [dropdownParent, value, localValue, ...effectWith])

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  return <div id={containerId} className={`form-group ${col} ${!noMargin && 'mb-2'}`} style={style}>
    <label htmlFor={id} className="form-label mb-1">
      {
        label &&
        <>
          {label} {required && <b className="text-danger">*</b>}
          {specification && <Tippy content={specification}>
            <small className="ms-1 fa fa-question-circle text-muted"></small>
          </Tippy>
          }
        </>
      }
    </label>
    <select ref={eRef} id={id} required={required} className={`form-control ${className}`} style={{ width: '100%' }} disabled={disabled} multiple={multiple} value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}>
      {children}
    </select>
  </div>
}

export default SelectFormGroup