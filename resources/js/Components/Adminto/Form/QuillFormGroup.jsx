import React, { useEffect, useRef } from "react"

const QuillFormGroup = ({ col, label, eRef, value, required = false, rows = 3, theme = 'snow', height = '100px', onChange = () => {} }) => {
  const quillRef = useRef()
  if (!eRef) eRef = useRef()

  useEffect(() => {
    const quill = new Quill(quillRef.current, { theme, modules: { toolbar: [[{ font: [] }, { size: [] }], ["bold", "italic", "underline", "strike"], [{ color: [] }, { background: [] }], [{ script: "super" }, { script: "sub" }], [{ header: [!1, 1, 2, 3, 4, 5, 6] }, "blockquote", "code-block"], [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }], ["direction", { align: [] }], ["link", "image", "video"], ["clean"]] } })

    quill.on('text-change', () => {
      const html = quill.root.innerHTML
      eRef.current.value = html
      onChange(html)
    });

    eRef.editor = quill
    quill.root.innerHTML = value ?? ''
  }, [null])

  return <div className={`form-group ${col} mb-2`} style={{ height: 'max-content' }}>
    <label htmlFor='' className="mb-1">
      {label} {required && <b className="text-danger">*</b>}
    </label>
    <div ref={quillRef} style={{ minHeight: height, fieldSizing: 'content', maxHeight: `calc(${height}*3)`, overflowY: 'auto' }}></div>
    <input ref={eRef} type="hidden" required={required} rows={rows} />
  </div>
}

export default QuillFormGroup