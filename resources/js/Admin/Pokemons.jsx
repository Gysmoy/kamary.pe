import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import InputFormGroup from '../Components/Adminto/Form/InputFormGroup';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import PokemonsRest from '../Actions/Admin/pokemons-rest';
import ReactAppend from '../Utils/ReactAppend';

const pokemonsRest = new PokemonsRest()

const Pokemons = ({ }) => {

  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const numberRef = useRef()
  const regionRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id ?? ''
    nameRef.current.value = data?.name ?? ''
    numberRef.current.value = data?.number ?? ''
    regionRef.current.value = data?.region?.name ?? ''

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value,
      number: numberRef.current.value,
      region: regionRef.current.value
    }

    const result = await pokemonsRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onVisibleChange = async ({ id, value }) => {
    const result = await pokemonsRest.boolean({ id, field: 'visible', value })
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
    const result = await pokemonsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table gridRef={gridRef} title='Pokemons' rest={pokemonsRest}
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
          dataField: 'number',
          caption: '#',
          dataType: 'number',
          sortOrder: 'asc',
          width: '54px',
          cellTemplate: (container, { data }) => {
            container.text(`#${data.number}`)
          }
        },
        {
          dataField: 'name',
          caption: 'Nombre',
        },
        {
          dataField: 'region.name',
          caption: 'Región',
        },
        {
          dataField: 'image',
          caption: 'Imagen',
          width: '80px',
          cellTemplate: (container, { data }) => {
            container.css('padding', '0 auto')
            ReactAppend(container, <img src={`//static.dextcg.com/resources/pokemons/${data.number}.png`} style={{ display: 'block', width: '48px', height: '48px', objectFit: 'contain', objectPosition: 'center', margin: 'auto' }} onError={e => e.target.src = '/api/cover/thumbnail/null'} />)
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
            container.append(DxButton({
              className: 'btn btn-sm btn-soft-danger',
              title: 'Eliminar',
              icon: 'mdi mdi-delete',
              onClick: () => onDeleteClicked(data.id)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar pokémon' : 'Agregar pokémon'} onSubmit={onModalSubmit} size='md'>
      <div className='row' id='pokemons-container'>
        <input ref={idRef} type='hidden' />
        <InputFormGroup eRef={numberRef} label='Número' required />
        <InputFormGroup eRef={nameRef} label='Nombre' required />
        <InputFormGroup eRef={regionRef} label='Región' required />
      </div>
    </Modal>
  </>
  )
}

CreateReactScript((el, properties) => {

  createRoot(el).render(<BaseAdminto {...properties} title='Pokemons'>
    <Pokemons {...properties} />
  </BaseAdminto>);
})