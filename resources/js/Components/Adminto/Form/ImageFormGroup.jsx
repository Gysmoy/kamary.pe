import React, { useEffect, useRef } from "react"

const ImageFormGroup = ({ id, col, label, eRef, required = false, onChange = () => { }, aspect = '21/9', fit = 'cover', onError = '/api/cover/thumbnail/null'}) => {

  if (!id) id = `ck-${crypto.randomUUID()}`
  if (!eRef) eRef = useRef()

  const imageRef = useRef()

  const onImageChange = async (e) => {
    const file = e.target.files[0]
    const url = await File.toURL(file)
    imageRef.current.src = url
    onChange(e)
  }

  useEffect(() => {
    eRef.image = imageRef.current
  }, [null])

  return <div className={`form-group ${col} mb-1`}>
    <label htmlFor={id} className="mb-1">
      {label} {required && <b className="text-danger">*</b>}
    </label>
    <label htmlFor={id} style={{width: '100%'}}>
      <img ref={imageRef} className="d-block" src="" alt="aspect-video" onError={e => e.target.src = onError} style={{
        width: '100%',
        borderRadius: '4px',
        cursor: 'pointer',
        aspectRatio: aspect,
        objectFit: fit,
        objectPosition: 'center'
      }} />
    </label>
    <input ref={eRef} id={id} type="file" src="" alt="" hidden accept="image/*" onChange={onImageChange} />
  </div>
}

export default ImageFormGroup