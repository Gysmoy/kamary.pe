import React, { useEffect, useRef, useState } from "react";

const EditorFormGroup = ({
  col,
  label,
  eRef,
  editorRef: codeEditorRef,
  placeholder,
  required = false,
  rows = 6,
  value = '',
  onChange = () => { },
  height = 600,
}) => {
  const [editorValue, setEditorValue] = useState(value);
  const localRef = useRef();
  const editorInstance = codeEditorRef || useRef();

  const editorRef = eRef || localRef;

  useEffect(() => {
    if (editorInstance.current) {
      editorInstance.current.toTextArea();
      editorInstance.current = null;
    }

    editorInstance.current = CodeMirror.fromTextArea(editorRef.current, {
      mode: "htmlmixed",
      theme: "sode",
      indentUnit: 2,
      tabSize: 2,
      lineNumbers: true,
    });

    editorInstance.current.setSize(null, height);

    editorInstance.current.setValue(value);

    setTimeout(() => {
      editorInstance.current.refresh()
    }, 125);

    editorInstance.current.on("change", (editor) => {
      const newValue = editor.getValue();
      setEditorValue(newValue); 
      onChange({
        target: {
          value: newValue
        }
      });
    });

    return () => {
      if (editorInstance.current) {
        editorInstance.current.toTextArea();
        editorInstance.current = null;
      }
    };
  }, [editorRef]);

  useEffect(() => {
    if (editorValue !== value) {
      setEditorValue(value);
      if (editorInstance.current) {
        editorInstance.current.setValue(value);
        setTimeout(() => {
          editorInstance.current.refresh()
        }, 125);
      }
    }
  }, [value]);

  return (
    <div className={`form-group ${col} mb-2`}>
      {
        label && <label htmlFor="" className="mb-1">
          {label} {required && <b className="text-danger">*</b>}
        </label>
      }
      <textarea
        ref={editorRef}
        className="form-control"
        placeholder={placeholder}
        required={required}
        rows={rows}
        defaultValue={value}
        onChange={(e) => setEditorValue(e.target.value)}
      />
    </div>
  );
}

export default EditorFormGroup