import React, { useEffect, useRef, useState } from "react"
import * as XLSX from 'xlsx'
import Modal from "../../Components/Adminto/Modal"
import SendingHistoryRest from "../../actions/Admin/SendingHistoryRest"

const sendingHistoryRest = new SendingHistoryRest()

const SendingModal = ({ modalRef, dataLoaded, setDataLoaded }) => {
  const excelRef = useRef()
  const iFrameRef = useRef()
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0)
  const [excelData, setExcelData] = useState(null)
  const [columnHeaders, setColumnHeaders] = useState([])
  const [variableMappings, setVariableMappings] = useState({})

  const handleExcelUpload = (e) => {
    const file = e.target.files[0]
    const reader = new FileReader()

    e.target.value = null

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet)
      const headers = Object.keys(jsonData[0] || {})

      setExcelData(jsonData)
      setColumnHeaders(headers)

      const initialMappings = {}
      dataLoaded?.vars?.forEach(variable => {
        initialMappings[variable] = ''
      })
      setVariableMappings(initialMappings)
    }

    reader.readAsArrayBuffer(file)
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const excelBlob = new Blob([JSON.stringify(excelData)], { type: 'application/json' });

    const formData = new FormData()
    formData.append('template_id', dataLoaded.id)
    formData.append('data', excelBlob, 'data.json');
    formData.append('mapping', JSON.stringify(variableMappings))

    const result = await sendingHistoryRest.save(formData)
    if (!result) return

    setDataLoaded(null)
    setExcelData(null)

    $(modalRef.current).modal('hide')
  }

  const getFormData = () => {
    if (!excelData || !excelData[currentPreviewIndex]) return {}
    const data = {}
    Object.entries(variableMappings).forEach(([variable, column]) => {
      if (column) {
        data[variable] = excelData[currentPreviewIndex][column] || ''
      }
    })
    return data
  }

  useEffect(() => {
    if (!dataLoaded) return
    let content = dataLoaded.content
    const data = getFormData()
    for (const key in data) {
      content = content.replace(RegExp(`{{${key}}}`, 'g'), data[key])
    }
    const url = URL.createObjectURL(new Blob([content], { type: 'text/html' }))
    iFrameRef.current.src = url
    $(modalRef.current).modal('show')
  }, [dataLoaded, variableMappings, currentPreviewIndex])

  return <Modal modalRef={modalRef} title={`Enviar mensajes masivos - ${dataLoaded?.name}`} size="full-width" btnSubmitText='Enviar' isStatic onSubmit={onModalSubmit}
    onClose={() => setDataLoaded(null)}
  >
    <div className="row" style={{ height: 'calc(100vh - 220px)' }}>
      <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12">
        <div className="h-100 w-100">
          <input
            id="file-excel"
            ref={excelRef}
            type="file"
            className="d-none"
            onChange={handleExcelUpload}
            accept=".xlsx,.xls"
          />
          {!excelData ? (
            <div className="d-flex align-items-center justify-content-center h-100">
              <label htmlFor="file-excel" className="btn btn-xs btn-white">
                <i className="mdi mdi-upload me-1"></i>
                Cargar excel
              </label>
            </div>
          ) : (
            <div className="mb-3">
              <label htmlFor="file-excel" className="btn btn-xs btn-white d-block mb-2 mx-auto" style={{ width: 'max-content' }}>
                <i className="mdi mdi-upload me-1"></i>
                Reemplazar excel
              </label>
              <div className="card mb-3">
                <div className="card-body border p-2">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <button
                      className="btn btn-sm btn-light"
                      disabled={currentPreviewIndex === 0}
                      onClick={() => setCurrentPreviewIndex(prev => prev - 1)}
                      type="button"
                    >
                      <i className="mdi mdi-chevron-left"></i>
                    </button>
                    <span className="small">
                      Record {currentPreviewIndex + 1} of {excelData.length}
                    </span>
                    <button
                      className="btn btn-sm btn-light"
                      disabled={currentPreviewIndex === excelData.length - 1}
                      onClick={() => setCurrentPreviewIndex(prev => prev + 1)}
                      type="button"
                    >
                      <i className="mdi mdi-chevron-right"></i>
                    </button>
                  </div>
                  <div className="small" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    <table className="table table-sm w-100">
                      <tbody>
                        {columnHeaders.map((header, idx) => (
                          <tr key={idx}>
                            <th className="text-truncate" style={{ maxWidth: '100px' }}>{header}:</th>
                            <td className="text-muted">
                              <p className='mb-0' style={{
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}>
                                {excelData[currentPreviewIndex][header]}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="mb-0">
                <label className="form-label">Enviar correo a <b className="text-danger">*</b></label>
                <select
                  className="form-select form-select-sm"
                  value={variableMappings['waves_send_to']}
                  onChange={(e) => setVariableMappings(prev => ({
                    ...prev,
                    ['waves_send_to']: e.target.value
                  }))}
                  required
                >
                  <option value="">Select column</option>
                  {columnHeaders.map((header, idx) => (
                    <option key={idx} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              <hr className="my-2" />
              {dataLoaded?.vars?.map((variable, index) => (
                <div key={index} className="mb-2">
                  <label className="form-label">{variable} <b className="text-danger">*</b></label>
                  <select
                    className="form-select form-select-sm"
                    value={variableMappings[variable]}
                    onChange={(e) => setVariableMappings(prev => ({
                      ...prev,
                      [variable]: e.target.value
                    }))}
                    required
                  >
                    <option value="">Select column</option>
                    {columnHeaders.map((header, idx) => (
                      <option key={idx} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="col-lg-9 col-md-8 col-sm-6 col-xs-12">
        <iframe ref={iFrameRef} src="/" className="w-100 h-100 border"></iframe>
      </div>
    </div>
  </Modal>
}

export default SendingModal