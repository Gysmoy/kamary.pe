import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import InputFormGroup from '../Components/Adminto/Form/InputFormGroup';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import ExpansionsRest from '../Actions/Admin/expansions-rest';
import ReactAppend from '../Utils/ReactAppend';
import SwitchFormGroup from '../Components/Adminto/Form/SwitchFormGroup';
import SelectAPIFormGroup from '../Components/Adminto/Form/SelectAPIFormGroup';
import { renderToString } from 'react-dom/server';
import SetSelectValue from '../Utils/SetSelectValue';

const expansionsRest = new ExpansionsRest()

const Expansions = ({ }) => {

  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const serieRef = useRef()
  const nameRef = useRef()
  const codeRef = useRef()
  const releaseDateRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id ?? ''
    SetSelectValue(serieRef.current, data?.serie.id, `${data?.serie.name} - ${data?.serie.language.name}`)
    nameRef.current.value = data?.name ?? ''
    codeRef.current.value = data?.code ?? ''
    releaseDateRef.current.value = data?.release_date ?? ''

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      serie_id: serieRef.current.value,
      name: nameRef.current.value,
      code: codeRef.current.value,
      release_date: releaseDateRef.current.value
    }

    const result = await expansionsRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onAvailableChange = async ({ id, value }) => {
    const result = await expansionsRest.boolean({ id, field: 'available', value })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar registro',
      text: '¿Estas seguro de eliminar este registro?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await expansionsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const serieTemplate = (e) => {
    if (e.loading) return 'Cargando...'
    return $(renderToString(<span>
      {e.text.replace('fab fa-', '')}
      <small className='text-muted ms-1'>{e.data?.language.name ?? ''}</small>
    </span>))
  }

  return (<>
    <Table gridRef={gridRef} title='Expansions' rest={expansionsRest}
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
            text: 'Nuevo registro',
            hint: 'Nuevo registro',
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
          dataField: 'code',
          caption: '#',
          width: '80px',
          sortOrder: 'asc'
        },
        {
          dataField: 'serie.language.name',
          caption: 'Idioma',
        },
        {
          dataField: 'serie.name',
          caption: 'Serie',
        },
        {
          dataField: 'name',
          caption: 'Nombre',
        },
        {
          dataField: 'release_date',
          caption: 'Fecha de lanzamiento',
          dataType: 'date',
          format: 'yyyy-MM-dd'
        },
        {
          dataField: 'symbol',
          caption: 'Símbolo',
          width: '70px',
          cellTemplate: (container, { data }) => {
            container.css('padding', '0')
            ReactAppend(container, <img src={`//assets.tcgdex.net/univ/${data.serie.code}/${data.code}/symbol.webp`} alt={data.serie.name} className='img-fluid d-block mx-auto' style={{ height: '50px', width: '60px', objectFit: 'contain' }} onError={e => { e.target.src = '/images/logo.png'; e.target.onerror = null; }} />)
          }
        },
        {
          dataField: 'logo',
          caption: 'Logo',
          width: '110px',
          cellTemplate: (container, { data }) => {
            container.css('padding', '0')
            ReactAppend(container, <img src={`//assets.tcgdex.net/${data.serie.language.code}/${data.serie.code}/${data.code}/logo.webp`} alt={data.name} className="img-fluid d-block mx-auto" style={{ width: '100px', height: '50px', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />)
          }
        },
        {
          dataField: 'available',
          caption: 'Disponible',
          dataType: 'boolean',
          width: '120px',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <SwitchFormGroup checked={data.available} onChange={(e) => onAvailableChange({ id: data.id, value: e.target.checked })} />)
          }
        },
        {
          caption: 'Acciones',
          cellTemplate: (container, { data }) => {
            container.append(DxButton({
              className: 'btn btn-sm btn-soft-primary',
              title: 'Editar',
              icon: 'mdi mdi-pen',
              onClick: () => onModalOpen(data)
            }))
            // container.append(DxButton({
            //   className: 'btn btn-sm btn-soft-danger',
            //   title: 'Eliminar',
            //   icon: 'mdi mdi-delete',
            //   onClick: () => onDeleteClicked(data.id)
            // }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar expansión' : 'Agregar expansión'} onSubmit={onModalSubmit} size='md'>
      <div className='row' id='expansions-container'>
        <input ref={idRef} type='hidden' />
        <SelectAPIFormGroup eRef={serieRef} label='Serie' searchAPI='/api/admin/series/paginate' searchBy='name' templateResult={serieTemplate} templateSelection={serieTemplate} />
        <InputFormGroup eRef={codeRef} label='Código' required />
        <InputFormGroup eRef={nameRef} label='Nombre' required />
        <InputFormGroup eRef={releaseDateRef} label='Fecha de lanzamiento' type='date' />
      </div>
    </Modal>
  </>
  )
}

CreateReactScript((el, properties) => {

  createRoot(el).render(<BaseAdminto {...properties} title='Expansions'>
    <Expansions {...properties} />
  </BaseAdminto>);
})