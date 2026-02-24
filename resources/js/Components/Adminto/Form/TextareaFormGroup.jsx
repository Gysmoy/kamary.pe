import React from "react"

const TextareaFormGroup = ({ col, label, eRef, placeholder, specification, required = false, rows = 3, value, onChange = () => {} }) => {
  return <div className={`form-group ${col} mb-2`}>
    <label htmlFor='' className="form-label mb-1">
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
    <textarea ref={eRef} className='form-control' placeholder={placeholder} required={required} rows={rows} defaultValue={value} value={value} style={{ minHeight: (rows * 27), fieldSizing: 'content' }} onChange={onChange} />
  </div>
}

export default TextareaFormGroup