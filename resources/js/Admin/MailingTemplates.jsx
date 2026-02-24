
import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from '../Utils/CreateReactScript.jsx'
import ReactAppend from '../Utils/ReactAppend.jsx'
import Modal from '../Components/Adminto/Modal.jsx'
import TextareaFormGroup from '../Components/Adminto/form/TextareaFormGroup.jsx'
import TippyButton from '../Components/Adminto/form/TippyButton.jsx'
import Swal from 'sweetalert2'
import SelectFormGroup from '../Components/Adminto/form/SelectFormGroup.jsx'
import { Editor } from '@tinymce/tinymce-react'
import MailingTemplatesRest from '../Actions/Admin/MailingTemplatesRest.js'
import DxPanelButton from '../Components/Adminto/Dx/DxPanelButton.jsx'
import EditorFormGroup from '../Components/Adminto/form/EditorFormGroup.jsx'
import { Clipboard } from 'sode-extend-react'
import SwitchFormGroup from '../Components/Adminto/form/SwitchFormGroup.jsx'
import Table from '../Components/Adminto/Table.jsx'
import SendingModal from '../Reutilizables/Templates/SendingModal.jsx'
import RepositoryRest from '../actions/Admin/RepositoryRest.js'
import Global from '../Utils/Global.js'
import SendingHistoryRest from '../actions/Admin/SendingHistoryRest.js'
import InputFormGroup from '../Components/Adminto/form/InputFormGroup.jsx'
import Base from '../Components/Adminto/Base.jsx'
import Tippy from '@tippyjs/react'

const mailingTemplatesRest = new MailingTemplatesRest()
const repositoryRest = new RepositoryRest()
const sendingHistoryRest = new SendingHistoryRest();

const MailingTemplates = ({ TINYMCE_KEY }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const designModalRef = useRef()
  const ddRef = useRef()
  const sendingModalRef = useRef()

  const codeEditorRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const typeRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()
  const captionRef = useRef()
  const modelRef = useRef()

  const [dataLoaded, setDataLoaded] = useState(null)

  const [isEditing, setIsEditing] = useState(false)
  const [templateActive, setTemplateActive] = useState({})
  const [typeEdition, setTypeEdition] = useState('wysiwyg')

  // Content Statuses
  const [wysiwygContent, setWysiwygContent] = useState('')
  const [codeContent, setCodeContent] = useState('')
  const [dropzoneContent, setDropzoneContent] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [isDesigning, setIsDesigning] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id || null
    $(typeRef.current).val(data?.type || null).trigger('change')
    nameRef.current.value = data?.name || null
    descriptionRef.current.value = data?.description || null
    captionRef.current.value = data?.caption || null
    $(modelRef.current).val(data?.model || null).trigger('change')
    $(`[name="auto_send"][value="${data?.auto_send || 0}"]`).prop('checked', true)

    $(modalRef.current).modal('show')
  }

  const onEditorModalOpen = async (data) => {
    setIsLoading(true)
    const result = await mailingTemplatesRest.get(data.id)
    setIsLoading(false)
    if (!result) return
    setIsDesigning(true)
    setTemplateActive(result);
    setTypeEdition('wysiwyg')
    setWysiwygContent(result?.content ?? '<i>- Agrega tu contenido aqui -</i>');
    $(designModalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      type: typeRef.current.value,
      name: nameRef.current.value,
      description: descriptionRef.current.value,
      caption: captionRef.current.value,
      model: modelRef.current.value,
      auto_send: $(`[name="auto_send"]:checked`).val(),
    }

    const result = await mailingTemplatesRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onStatusChange = async ({ id, value }) => {
    const result = await mailingTemplatesRest.boolean({ id, field: 'status', value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDesignModalSubmit = async (e) => {
    e.preventDefault()

    const content = typeEdition == 'wysiwyg' ? wysiwygContent : typeEdition == 'code' ? codeContent : dropzoneContent

    const request = {
      id: templateActive.id,
      content,
      vars: content.match(/{{([^}]+)}}/g)?.map(match => match.slice(2, -2)) || [],
    }

    const result = await mailingTemplatesRest.save(request)
    if (!result) return

    $(designModalRef.current).modal('hide')
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar registro',
      text: '¿Está seguro de eliminar este registro?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await mailingTemplatesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onTypeEditionClicked = (newType) => {
    setTypeEdition(old => {
      if (old == 'wysiwyg' && newType == 'code') {
        codeEditorRef.current.setValue(html_beautify(wysiwygContent, {
          indent_empty_lines: true,
          preserve_newlines: true,
          max_preserve_newlines: 1,
          indent_size: 2
        }))
        setTimeout(() => {
          codeEditorRef.current.refresh()
        }, 125);
      } else if (old == 'wysiwyg' && newType == 'dropzone') {
        setDropzoneContent(wysiwygContent)
      } else if (old == 'code' && newType == 'wysiwyg') {
        setWysiwygContent(codeContent)
      } else if (old == 'code' && newType == 'dropzone') {
        setDropzoneContent(codeContent)
      } else if (old == 'dropzone' && newType == 'wysiwyg') {
        setWysiwygContent(dropzoneContent)
      } else if (old == 'dropzone' && newType == 'code') {
        codeEditorRef.current.setValue(html_beautify(dropzoneContent, {
          indent_empty_lines: true,
          preserve_newlines: true,
          max_preserve_newlines: 1,
          indent_size: 2
        }))
        setTimeout(() => {
          codeEditorRef.current.refresh()
        }, 125);
      }
      return newType
    })
  }

  const onDropzoneChange = (file) => {
    file.text().then(content => {
      const container = $(`<body>`).html(content)

      container.find('style').remove()
      container.find('script').remove()
      container.find('meta').remove()
      container.find('title').remove()
      container.find('link').remove()

      setDropzoneContent(container.html().trim())
    })
  }

  const onSendingModalClicked = async (data) => {
    if (data.auto_send) {
      const { isConfirmed } = await Swal.fire({
        title: 'Enviar mensajes masivos',
        text: `¿Estás seguro de enviar los mensajes masivos`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Si, enviar',
        cancelButtonText: 'Cancelar'
      })
      if (!isConfirmed) return
      const formData = new FormData()
      formData.append('template_id', data.id)
      const result = await sendingHistoryRest.save(formData)
    } else {
      const result = await mailingTemplatesRest.get(data.id)
      setDataLoaded(result)
    }
  }

  useEffect(() => {
    Clipboard.paste(ddRef.current, (files) => {
      if (!files || files?.length == 0) return
      const file = files[0]
      if (!file.type.startsWith('text/')) return
      onDropzoneChange(files[0])
    })
  }, [null])

  const processWywiwygContent = async (newContent) => {
    const body = $(`<div>${newContent}</div>`)
    const imgs = body.find('img[src^="data:"]')

    if (imgs.length > 0) {
      for (const img of imgs) {
        const src = img.getAttribute('src');

        img.setAttribute('src', null)

        const base64Data = src.split(',')[1];
        const mimeType = src.split(',')[0].split(':')[1].split(';')[0];

        const byteCharacters = atob(base64Data);
        const byteArrays = [];

        for (let i = 0; i < byteCharacters.length; i++) {
          byteArrays.push(byteCharacters.charCodeAt(i));
        }

        const byteArray = new Uint8Array(byteArrays);
        const file = new File([byteArray], `${crypto.randomUUID()}.${mimeType.split('/')[1]}`, { type: mimeType });

        const formData = new FormData()
        formData.append('file', file)
        const { data } = await repositoryRest.save(formData);
        const newSrc = data.url
        img.setAttribute('src', `${Global.APP_URL}/${newSrc}`)
      }
      setWysiwygContent(body.html())
    } else {
      setWysiwygContent(newContent)
    }
  }

  return (<>
    <Table
      hidden={isDesigning}
      gridRef={gridRef}
      title='Plantillas'
      rest={mailingTemplatesRest}
      toolBar={(container) => {
        container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-dark',
          text: 'Actualizar',
          title: 'Refrescar tabla',
          icon: 'fas fa-undo-alt',
          onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
        }))
        container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-primary',
          text: 'Nuevo',
          title: 'Agregar registro',
          icon: 'fa fa-plus',
          onClick: () => onModalOpen()
        }))
      }}
      isLoading={isLoading}
      columns={[
        {
          dataField: 'type',
          caption: 'Medio',
          width: '100px',
          cellTemplate: (container, { data }) => {
            let icons = [], text;
            switch(data.type) {
              case 'WhatsApp':
                icons = [{icon: 'mdi mdi-whatsapp', color: '#25D366'}];
                text = 'WhatsApp';
                break;
              case 'Email':
                icons = [{icon: 'mdi mdi-email-outline', color: '#0d6efd'}];
                text = 'Email';
                break;
            }
            ReactAppend(container, 
              <div className="d-flex align-items-center">
                <span className='me-1'>{text}</span>
                {icons.map((item, index) => (
                  <i key={index} 
                     className={item.icon} 
                     style={{
                       color: item.color
                     }}
                  />
                ))}
              </div>
            )
          }
        },
        {
          dataField: 'name',
          caption: 'Nombre',
          width: '300px',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <b>{data.name}</b>)
          }
        },
        {
          dataField: 'description',
          caption: 'Descripcion'
        },
        {
          dataField: 'model',
          caption: 'Tabla',
          // cellTemplate: (container, { data }) => {
          //   container.text(data.model || 'Externo')
          // },
          lookup: {
            dataSource: [
              { value: '', text: 'Externo' },
              { value: 'User', text: 'Usuarios' },
              { value: 'Sale', text: 'Ventas' },
              { value: 'Subscription', text: 'Subscripciones' }
            ],
            valueExpr: 'value',
            displayExpr: 'text'
          }
        },
        {
          dataField: 'auto_send',
          caption: 'Tipo de envio',
          dataType: 'boolean',
          cellTemplate: (container, { data }) => {
            container.text(data.auto_send ? 'Automatico' : 'Manual')
          },
          lookup: {
            dataSource: [
              { value: 0, text: 'Manual' },
              { value: 1, text: 'Automatico' }
            ],
            valueExpr: 'value',
            displayExpr: 'text'
          }
        },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          width: '120px',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <SwitchFormGroup checked={data.status} onChange={(e) => onStatusChange({ id: data.id, value: e.target.checked })} />)
          }
        },
        {
          caption: 'Acciones',
          width: '160px',
          cellTemplate: (container, { data }) => {
            container.attr('style', 'display: flex; gap: 4px; overflow: unset')

            ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-primary' title='Editar' onClick={() => onModalOpen(data)}>
              <i className='mdi mdi-pencil'></i>
            </TippyButton>)

            ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-dark' title='Diseñar plantilla' onClick={() => onEditorModalOpen(data)} data-loading-text='<i className="fa fa-spinner fa-spin"></i>'>
              <i className='mdi mdi-circle-edit-outline'></i>
            </TippyButton>)

            ReactAppend(container, <TippyButton className='btn btn-xs btn-white' title={data.auto_send ? 'Enviar ahora' : 'Enviar mensajes masivos'} onClick={() => onSendingModalClicked(data)}>
              <i className='mdi mdi-email-send'></i>
            </TippyButton>)

            ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-danger' title='Eliminar' onClick={() => onDeleteClicked(data.id)}>
              <i className='mdi mdi-delete'></i>
            </TippyButton>)
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
    <div className="row" hidden={!isDesigning}>
      <div className="col-12">
        <div className="card">
          <div className='card-header d-flex justify-content-between align-items-center'>
            <h4 className="header-title my-0">
              <Tippy content='Cancelar'>
                <i className='mdi mdi-chevron-left me-1' style={{ cursor: 'pointer' }} onClick={() => setIsDesigning(false)}></i>
              </Tippy>
              Diseñador: {templateActive?.name}
            </h4>
            <div className='d-flex gap-1'>
              <TippyButton className='btn btn-xs btn-white' title={templateActive?.auto_send ? 'Enviar ahora' : 'Enviar mensajes masivos'} onClick={() => onSendingModalClicked(templateActive)}>
                <i className='mdi mdi-email-send'></i>
              </TippyButton>
              <TippyButton className='btn btn-xs btn-soft-primary' title='Guardar' onClick={onDesignModalSubmit}>
                <i className='mdi mdi-content-save'></i>
              </TippyButton>
              <TippyButton className='btn btn-xs btn-soft-danger' title='Cancelar' onClick={() => setIsDesigning(false)}>
                <i className='mdi mdi-close'></i>
              </TippyButton>
            </div>
          </div>
          <div className="card-body">
            <ul className="nav nav-pills navtab-bg justify-content-center flex-wrap gap-1">
              <li className="nav-item">
                <a href="#wysiwyg-editor" className={`nav-link text-center ${typeEdition == 'wysiwyg' ? 'active' : ''}`} style={{
                  width: '200px'
                }} onClick={() => onTypeEditionClicked('wysiwyg')}>
                  <i className='mdi mdi-page-layout-header-footer me-1'></i>
                  Editor WYSIWYG
                </a>
              </li>
              <li className="nav-item">
                <a href="#code-editor" className={`nav-link text-center ${typeEdition == 'code' ? 'active' : ''}`} style={{
                  width: '200px'
                }} onClick={() => onTypeEditionClicked('code')}>
                  <i className='mdi mdi-code-tags me-1'></i>
                  Editor de codigo
                </a>
              </li>
              <li className="nav-item">
                <a href="#dropzone" className={`nav-link text-center ${typeEdition == 'dropzone' ? 'active' : ''}`} style={{
                  width: '200px'
                }} onClick={() => onTypeEditionClicked('dropzone')}>
                  <i className='mdi mdi-cloud-upload me-1'></i>
                  Carga tu archivo
                </a>
              </li>
            </ul>
            <div className="tab-content">
              <div className={`tab-pane ${typeEdition == 'wysiwyg' ? 'active' : ''}`} id="wysiwyg-editor">
                <Editor
                  apiKey={TINYMCE_KEY}
                  init={{
                    plugins: [
                      'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'image', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
                    ],
                    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
                    tinycomments_mode: 'embedded',
                    tinycomments_author: 'Author name',
                    mergetags_list: [
                      { value: 'First.Name', title: 'First Name' },
                      { value: 'Email', title: 'Email' },
                    ],
                    ai_request: (request, respondWith) => respondWith.string(() => Promise.reject('See docs to implement AI Assistant')),
                    height: '720px',
                    relative_urls: false,
                    remove_script_host: false,
                    convert_urls: false,
                    document_base_url: Global.APP_URL,
                  }}

                  value={wysiwygContent}
                  onEditorChange={(newValue) => processWywiwygContent(newValue)}
                />
                <div className='mb-2'></div>
              </div>
              <div className={`tab-pane ${typeEdition == 'code' ? 'active' : ''}`} id="code-editor">
                <EditorFormGroup editorRef={codeEditorRef} onChange={e => setCodeContent(e.target.value)} height={720} />
              </div>
              <div className={`tab-pane ${typeEdition == 'dropzone' ? 'active' : ''}`} id="dropzone">
                <div ref={ddRef} className='d-flex align-items-center justify-content-center mb-2 border' style={{
                  height: '720px',
                  borderRadius: '10px'
                }}>
                  <div>

                    <input className='d-none' id='dropzone-file' type="file" accept='text/html,text/plain' onChange={(e) => {
                      e.preventDefault()
                      const files = [...e.target.files]
                      e.target.value = null
                      if (files.length == 0) return
                      onDropzoneChange(files[0])
                    }} />
                    <label htmlFor="dropzone-file" className='d-block mx-auto mb-2 btn btn-sm btn-white rounded-pill waves-effect' style={{
                      width: 'max-content'
                    }}>
                      <i className='mdi mdi-paperclip me-1'></i>
                      Seleccionar archivo
                    </label>
                    <label htmlFor="dropzone-file" className='d-block' style={{ cursor: 'pointer' }}>
                      Arrastra y suelta tu plantilla aquí, o haz clic para seleccionar tu archivo HTML.
                    </label>
                    {
                      dropzoneContent?.trim() &&
                      <button
                        className='d-block mx-auto mt-2 btn btn-sm btn-primary rounded-pill waves-effect'
                        onClick={() => {
                          const blob = new Blob([dropzoneContent], { type: 'text/html' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'template.html';
                          a.click();
                          window.URL.revokeObjectURL(url);
                        }}
                        type='button'
                      >
                        <i className='mdi mdi-download me-1'></i>
                        Descargar HTML
                      </button>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Modal modalRef={modalRef} title={isEditing ? 'Editar plantilla' : 'Agregar plantilla'} onSubmit={onModalSubmit}>
      <div className='row' id='template-container'>
        <input ref={idRef} type='hidden' />
        <SelectFormGroup eRef={typeRef} label='Tipo' dropdownParent='#template-container' required>
          <option value="">- Seleccione una opcion -</option>
          <option value="Email">Email</option>
          <option value="WhatsApp">WhatsApp</option>
        </SelectFormGroup>
        <InputFormGroup eRef={nameRef} label='Nombre' required />
        <TextareaFormGroup eRef={descriptionRef} label='Descripcion' />
        <TextareaFormGroup eRef={captionRef} label='Asunto/Mensaje' />
        <SelectFormGroup eRef={modelRef} label='Origen de datos' dropdownParent='#template-container'>
          <option value="">Externo</option>
          <option value="User">Usuarios</option>
          <option value="Sale">Ventas</option>
          <option value="Subscription">Subscripciones</option>
        </SelectFormGroup>
        <div className='form-group'>
          <label className='form-label'>Tipo de envio</label>
          <div className='row col-12'>
            <div className="col-sm-6">
              <div className="form-check">
                <input type="radio" id="auto_send_false" name="auto_send" className="form-check-input" value={0} defaultChecked />
                <label className="form-check-label" htmlFor="auto_send_false"  >Manual</label>
              </div>
            </div>
            <div className="col-sm-6">
              <div className="form-check">
                <input type="radio" id="auto_send_true" name="auto_send" className="form-check-input" value={1} />
                <label className="form-check-label" htmlFor="auto_send_true" >Automatico</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
    <SendingModal modalRef={sendingModalRef} dataLoaded={dataLoaded} setDataLoaded={setDataLoaded} />
  </>
  )
}

CreateReactScript((el, properties) => {
  createRoot(el).render(<Base {...properties} title='Plantillas de Mensajes'>
    <MailingTemplates {...properties} />
  </Base>);
})