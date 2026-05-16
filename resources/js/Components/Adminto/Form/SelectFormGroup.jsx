import Tippy from "@tippyjs/react"
import React, { useEffect, useRef, useState } from "react"
import select2SpanishLanguage from "../../../Utils/select2SpanishLanguage"
import { select2DropdownParentFor } from "../../../Utils/select2DropdownParent"

const SelectFormGroup = ({ id, col, className, label, specification, eRef, value, required = false, children, dropdownParent, noMargin = false, multiple = false, disabled = false, onChange = () => { }, style,
  templateResult,
  templateSelection,
  minimumInputLength = 0,
  minimumResultsForSearch,
  effectWith = [],
  tags
}) => {

  if (!eRef) eRef = useRef()
  const generatedIdRef = useRef(id || `select-${crypto.randomUUID()}`)
  const selectId = id || generatedIdRef.current
  const containerId = `container-${selectId}`
  const onChangeRef = useRef(onChange)

  const [localValue, setLocalValue] = useState(value ?? null)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const $select = $(eRef.current)
    if ($select.data('select2')) $select.select2('destroy')

    $select.select2({
      dropdownParent: select2DropdownParentFor(eRef.current, dropdownParent, `#${containerId}`),
      templateResult,
      templateSelection,
      minimumInputLength,
      minimumResultsForSearch: minimumResultsForSearch ?? 0,
      language: select2SpanishLanguage,
      tags
    })

    $select.off('change.selectFormGroup').on('change.selectFormGroup', (e) => {
      setLocalValue(multiple ? $select.val() : e.target.value)
      onChangeRef.current(e)
    })

    return () => {
      $select.off('change.selectFormGroup')
      if ($select.data('select2')) $select.select2('destroy')
    }
  }, [dropdownParent, minimumInputLength, minimumResultsForSearch, tags, multiple, disabled, ...effectWith])

  useEffect(() => {
    setLocalValue(value)
    if (eRef.current && $(eRef.current).data('select2')) {
      $(eRef.current).val(value ?? (multiple ? [] : '')).trigger('change.select2')
    }
  }, [value])

  return <div id={containerId} className={`form-group ${col} ${!noMargin && 'mb-2'}`} style={style}>
    <label htmlFor={selectId} className="form-label mb-1">
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
    <select ref={eRef} id={selectId} data-select2-managed="component" required={required} className={`form-control ${className}`} style={{ width: '100%' }} disabled={disabled} multiple={multiple} value={localValue ?? (multiple ? [] : '')}
      onChange={(e) => setLocalValue(multiple ? Array.from(e.target.selectedOptions).map(option => option.value) : e.target.value)}>
      {children}
    </select>
  </div>
}

export default SelectFormGroup
