import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import InputFormGroup from '../Components/Adminto/form/InputFormGroup';
import ReactAppend from '../Utils/ReactAppend';
import DxButton from '../Components/dx/DxButton';
import SwitchFormGroup from '@Adminto/form/SwitchFormGroup';
import ImageFormGroup from '../Components/Adminto/form/ImageFormGroup';
import Swal from 'sweetalert2';
import AdsRest from '../Actions/Admin/AdsRest';
import { renderToString } from 'react-dom/server';
import TextareaFormGroup from '../Components/Adminto/form/TextareaFormGroup';

const adsRest = new AdsRest();

const Ads = ({ }) => {
  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()
  const imageRef = useRef()
  const dateBeginRef = useRef()
  const dateEndRef = useRef()
  const secondsRef = useRef()
  const linkRef = useRef()
  const invasivoRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id ?? ''
    nameRef.current.value = data?.name ?? ''
    descriptionRef.current.value = data?.description ?? ''
    imageRef.image.src = `/api/ads/media/${data?.image}`
    imageRef.current.value = null
    dateBeginRef.current.value = data?.date_begin ?? ''
    dateEndRef.current.value = data?.date_end ?? ''
    secondsRef.current.value = data?.seconds ?? 0
    linkRef.current.value = data?.link ?? ''
    if (data?.invasivo) {
      $(invasivoRef.current).prop('checked', false).trigger('click')
    } else {
      $(invasivoRef.current).prop('checked', true).trigger('click')
    }
    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value,
      description: descriptionRef.current.value,
      date_begin: dateBeginRef.current.value,
      date_end: dateEndRef.current.value,
      seconds: secondsRef.current.value || 0,
      link: linkRef.current.value,
      invasivo: invasivoRef.current.checked ? 1 : 0
    }

    const formData = new FormData()
    for (const key in request) {
      formData.append(key, request[key])
    }
    const file = imageRef.current.files[0]
    if (file) {
      formData.append('image', file)
    }

    const result = await adsRest.save(formData)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onVisibleChange = async ({ id, value }) => {
    const result = await adsRest.boolean({ id, field: 'visible', value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar anuncio',
      text: '¿Estás seguro de eliminar este anuncio?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await adsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table gridRef={gridRef} title='Anuncios' rest={adsRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
          }
        });
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'plus',
            text: 'Nuevo anuncio',
            hint: 'Nuevo anuncio',
            onClick: () => onModalOpen()
          }
        });
      }}
      columns={[
        {
          dataField: 'id',
          caption: 'ID',
          visible: false
        },
        {
          dataField: 'image',
          caption: 'Imagen',
          width: '60px',
          allowFiltering: false,
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <img src={`/api/ads/media/${data.image}`} style={{ width: '50px', aspectRatio: 1, objectFit: 'contain', objectPosition: 'center', borderRadius: '4px' }} />)
          }
        },
        {
          dataField: 'name',
          caption: 'Contenido',
          width: '50%',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, (data.name || data.description)
              ? <p className='mb-0' style={{ width: '100%' }}>
                <b className='d-block'>{data.name}</b>
                <small className='text-wrap text-muted' style={{
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                }}>{data.description}</small>
              </p>
              : <i className='text-muted'>- Sin contenido textual -</i>
            )
          }
        },
        {
          dataField: 'date_begin',
          caption: 'Mostrar',
          cellTemplate: (container, { data }) => {
            container.html(renderToString(<>
              {
                (data.date_begin && data.date_end)
                  ? <>
                    <p className='mb-0'><b>Desde:</b> {moment(data.date_begin).format('DD [de] MMMM')}</p>
                    <p className='mb-0'><b>Hasta:</b> {moment(data.date_end).format('DD [de] MMMM')}</p>
                  </>
                  : <p className='mb-0'><b>Visible:</b> Siempre</p>
              }
              <p className='mb-0'>
                <b>Se muestra:</b> {
                  data.seconds > 0
                    ? <>Después de {data.seconds}s</>
                    : <>Al cargar la página</>
                }
              </p>
              <p className='mb-0'>
                <b>Invasivo:</b> {data.invasivo ? 'Si' : 'No'}
              </p>
            </>))
          }
        },
        {
          dataField: 'link',
          caption: 'Link',
          cellTemplate: (container, { data }) => {
            if (data.link) {
              container.html(renderToString(<a href={data.link}>{data.link}</a>))
            } else {
              container.html(renderToString(<i className='text-muted'>- Sin link -</i>))
            }
          }
        },
        {
          dataField: 'visible',
          caption: 'Visible',
          dataType: 'boolean',
          width: '120px',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <SwitchFormGroup checked={data.visible} onChange={(e) => onVisibleChange({ id: data.id, value: e.target.checked })} />)
          }
        },
        {
          caption: 'Acciones',
          cellTemplate: (container, { data }) => {
            container.css('text-overflow', 'unset')
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-primary',
              title: 'Editar',
              icon: 'fa fa-pen',
              onClick: () => onModalOpen(data)
            }))
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger',
              title: 'Eliminar',
              icon: 'fa fa-trash',
              onClick: () => onDeleteClicked(data.id)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar anuncio' : 'Agregar anuncio'} onSubmit={onModalSubmit} size='md'>
      <div className='row' id='principal-container'>
        <input ref={idRef} type='hidden' />
        <ImageFormGroup eRef={imageRef} label='Imagen' col='col-md-4' aspect={1} fit='contain' required />
        <div className="col-md-8">
          <SwitchFormGroup eRef={invasivoRef} label='¿El anuncio es invasivo?' specification='Solo se mostrará este anuncio y no los demás' />
          <TextareaFormGroup eRef={nameRef} label='Título' rows={1} />
          <TextareaFormGroup eRef={descriptionRef} label='Descripción' rows={2} />
        </div>
        <label>Mostrar</label>
        <InputFormGroup eRef={dateBeginRef} label='Desde' type='date' col='col-md-6' />
        <InputFormGroup eRef={dateEndRef} label='Hasta' type='date' col='col-md-6' />
        <InputFormGroup eRef={secondsRef} label='Mostrar despues de (segundos)' type='number' />
        <InputFormGroup eRef={linkRef} label='Link' />
      </div>
    </Modal>
  </>
  )
}

CreateReactScript((el, properties) => {
  createRoot(el).render(<BaseAdminto {...properties} title='Pop-ups'>
    <Ads {...properties} />
  </BaseAdminto>);
})