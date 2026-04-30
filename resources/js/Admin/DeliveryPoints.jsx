import { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import InputFormGroup from '../Components/Adminto/Form/InputFormGroup';
import DxButton from '../Components/dx/DxButton';
import Swal from 'sweetalert2';
import DeliveryPointsRest from '../Actions/Admin/delivery-points-rest';
import buildSchedule from '../Utils/buildSchedule';
import SelectAPIFormGroup from '../Components/Adminto/Form/SelectAPIFormGroup';
import SetSelectValue from '../Utils/SetSelectValue';
import UbigeoCascade from '@Adminto/form/UbigeoCascade';
import { EMPTY_UBIGEO_SELECTION } from '../Utils/ubigeoInei';

const deliveryPointsRest = new DeliveryPointsRest()

const dayNames = {
  sunday: 'Domingo',
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
};

const DeliveryPoints = ({ }) => {

  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const addressRef = useRef()
  const numberRef = useRef()
  const referenceRef = useRef()
  const sellerRef = useRef()
  const openingHoursRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [location, setLocation] = useState(EMPTY_UBIGEO_SELECTION)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id ?? ''
    nameRef.current.value = data?.name ?? ''
    setLocation({
      ubigeo: '',
      department: data?.department ?? '',
      province: data?.province ?? '',
      district: data?.district ?? '',
    })
    addressRef.current.value = data?.address ?? ''
    numberRef.current.value = data?.number ?? ''
    referenceRef.current.value = data?.reference ?? ''
    SetSelectValue(sellerRef.current, data?.seller?.uuid, data?.seller?.fullname)
    openingHoursRef.current.value = data?.opening_hours ? JSON.stringify(data.opening_hours) : ''

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value,
      department: location.department,
      province: location.province,
      district: location.district,
      address: addressRef.current.value,
      number: numberRef.current.value,
      reference: referenceRef.current.value,
      seller: sellerRef.current.value,
      opening_hours: openingHoursRef.current.value ? JSON.parse(openingHoursRef.current.value) : null
    }

    const result = await deliveryPointsRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onVisibleChange = async ({ id, value }) => {
    const result = await deliveryPointsRest.boolean({ id, field: 'visible', value })
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
    const result = await deliveryPointsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table gridRef={gridRef} title='Puntos de Entrega' rest={deliveryPointsRest}
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
          dataField: 'name',
          caption: 'Nombre',
        },
        {
          dataField: 'department',
          caption: 'Departamento',
        },
        {
          dataField: 'province',
          caption: 'Provincia',
        },
        {
          dataField: 'district',
          caption: 'Distrito',
        },
        {
          dataField: 'address',
          caption: 'Dirección',
        },
        {
          dataField: 'number',
          caption: 'Número',
          dataType: 'number',
          width: '80px',
        },
        {
          dataField: 'reference',
          caption: 'Referencia',
        },
        {
          dataField: 'opening_hours',
          caption: 'Horario de atención',
          cellTemplate: (container, { data }) => {
            if (!data.opening_hours) {
              container.text('');
              return;
            }
            container.html(buildSchedule(data.opening_hours));
          }
        },
        {
          caption: 'Acciones',
          width: '150px',
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
    <Modal modalRef={modalRef} title={isEditing ? 'Editar punto de entrega' : 'Agregar punto de entrega'} onSubmit={onModalSubmit} size='lg'>
      <div className='row' id='delivery-points-container'>
        <input ref={idRef} type='hidden' />
        <InputFormGroup eRef={nameRef} label='Nombre' required />
        <UbigeoCascade
          value={location}
          onChange={setLocation}
          showUbigeo={false}
          departmentCol='col-md-4'
          provinceCol='col-md-4'
          districtCol='col-md-4'
          required
        />
        <InputFormGroup eRef={addressRef} label='Dirección' col='col-md-8' required />
        <InputFormGroup eRef={numberRef} label='Número' col='col-md-4' required />
        <InputFormGroup eRef={referenceRef} label='Referencia' />
        <SelectAPIFormGroup eRef={sellerRef} label='Usuario asociado' searchAPI={'/api/admin/users/paginate'} searchBy={'fullname'} selectBy='uuid' dropdownParent='#delivery-points-container' />
        <div className='col-12'>
          <label className='form-label'>Horario de atención</label>
          <OpeningHoursEditor ref={openingHoursRef} />
        </div>
      </div>
    </Modal>
  </>
  )
}

const OpeningHoursEditor = forwardRef((props, ref) => {
  const [hours, setHours] = useState({});
  const innerRef = useRef();

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // expose value getter to parent via ref
  useImperativeHandle(ref, () => ({
    get value() {
      return innerRef.current ? innerRef.current.value : JSON.stringify(hours);
    },
    set value(val) {
      if (innerRef.current) innerRef.current.value = val;
      try { setHours(JSON.parse(val)); } catch { }
    }
  }));

  const handleChange = (day, field, value) => {
    setHours(prev => {
      const updated = { ...prev };
      if (!updated[day]) updated[day] = { open: '', close: '' };
      updated[day][field] = value;
      if (innerRef.current) innerRef.current.value = JSON.stringify(updated);
      return updated;
    });
  };

  const toggleClosed = (day) => {
    setHours(prev => {
      const updated = { ...prev };
      if (updated[day]) {
        updated[day] = null;
      } else {
        updated[day] = { open: '', close: '' };
      }
      if (innerRef.current) innerRef.current.value = JSON.stringify(updated);
      return updated;
    });
  };

  return (
    <div className='table-responsive'>
      <table className='table table-sm table-bordered mb-0'>
        <thead className='table-light'>
          <tr>
            <th>Día</th>
            <th>Abierto</th>
            <th>Hora apertura</th>
            <th>Hora cierre</th>
          </tr>
        </thead>
        <tbody>
          {days.map(day => (
            <tr key={day}>
              <td className='align-middle'>{dayNames[day]}</td>
              <td className='text-center align-middle'>
                <div className='form-check d-flex justify-content-center'>
                  <input
                    className='form-check-input'
                    type='checkbox'
                    checked={!!hours[day]}
                    onChange={() => toggleClosed(day)}
                  />
                </div>
              </td>
              <td className='align-middle'>
                {hours[day] ? (
                  <input
                    type='time'
                    className='form-control form-control-sm'
                    value={hours[day].open || ''}
                    onChange={e => handleChange(day, 'open', e.target.value)}
                  />
                ) : (
                  <span className='text-muted'>Cerrado</span>
                )}
              </td>
              <td className='align-middle'>
                {hours[day] ? (
                  <input
                    type='time'
                    className='form-control form-control-sm'
                    value={hours[day].close || ''}
                    onChange={e => handleChange(day, 'close', e.target.value)}
                  />
                ) : (
                  <span className='text-muted'>Cerrado</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <input ref={innerRef} type='hidden' />
    </div>
  );
});

CreateReactScript((el, properties) => {

  createRoot(el).render(<BaseAdminto {...properties} title='Puntos de Entrega'>
    <DeliveryPoints {...properties} />
  </BaseAdminto>);
})
