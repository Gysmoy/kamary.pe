import { createRoot } from 'react-dom/client';
import Base from './Components/Tailwind/Base';
import CreateReactScript from './Utils/CreateReactScript';
import { useBase } from './Components/Tailwind/BaseContext';
import { useEffect, useRef, useState } from 'react';
import ProfileRest from './Actions/profile-rest';
import buildSchedule from './Utils/buildSchedule';

const profileRest = new ProfileRest()

const Profile = ({ deliveryPoints, hasRole }) => {

  const { session, setSession } = useBase()
  const [newSession, setNewSession] = useState(session)
  const [points, setPoints] = useState(session.points.map(({ id }) => id))
  const [saving, setSaving] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDeliveryPoint = (pointId) => {
    setPoints(prev => {
      const exists = prev.includes(pointId);
      if (exists) {
        return prev.filter(id => id !== pointId);
      } else {
        return [...prev, pointId];
      }
    });
  }

  const handleSelectDocumentType = (value) => {
    setDocumentType(value);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    const result = await profileRest.save({
      type: 'profile',
      name: newSession.name,
      lastname: newSession.lastname,
      phone: newSession.phone
    })
    setSaving(false)
    if (!result) return
    setNewSession(result.data)
    setSession(result.data)
  }

  const handleNotifyChange = async (field, value) => {
    if (saving) return
    setSaving(true)
    const result = await profileRest.boolean({ field, value })
    setSaving(false)
    if (!result) return
    setNewSession(old => ({ ...old, [field]: value }))
  }

  const getLabelAndPlaceholder = () => {
    if (newSession.account_type === "cci") {
      return {
        label: "Número de cuenta",
        placeholder: "Ingresa tu número de cuenta"
      };
    } else {
      return {
        label: "Número de celular del Yape / Plin",
        placeholder: "Ingresa tu número de celular"
      };
    }
  };

  const { label, placeholder } = getLabelAndPlaceholder();

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const result = await profileRest.save({
      type: 'payment',
      account_type: newSession.account_type,
      account_number: newSession.account_number,
      account_cci: newSession.account_cci,
      holder_name: newSession.holder_name
    })
    setSaving(false);
    if (!result) return
    setNewSession(result.data)
    setSession(result.data)
  };

  const handlePointsSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const result = await profileRest.save({
      type: 'points',
      points
    })
    setSaving(false);
    if (!result) return
    setNewSession(result.data)
    setSession(result.data)
    setPoints(result.data.points.map(({ id }) => id))
  };

  return <section className="w-full bg-[#EFF3F5] py-12 sm:py-16">
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6`}>
      <div>
        <h4 className='text-lg font-bold mb-1'>Mi perfil</h4>
        <p className=''>Configura la información de tu cuenta y preferencias.</p>
      </div>
      <div className='rounded-xl bg-white p-6 border border-[#D1D5DC] flex gap-4 items-center w-full'>
        <img
          className='w-20 h-20 object-cover object-centerd rounded-full'
          src={`/storage/images/user/${session.image}`}
          alt={session.fullname}
          onError={e => e.target.src = `https://ui-avatars.com/api/?name=${session.name}+${session.lastname}&color=FFFFFF&background=306EFF`} />
        <div className='flex-1 flex flex-col gap-2 min-w-0'>
          <h4 className='font-bold w-full break-words'>
            {session.fullname}
            {session.verified && <i className='mdi mdi-check-decagram ms-1 text-primary' />}
          </h4>
          <p className='text-[#4B5563] break-words'>{session.email}</p>
          <span className='block break-words w-max max-w-full py-2 px-4 bg-[#F5F5F7] text-[#86868B] rounded-full text-sm'>
            Miembro desde {new Date(session.created_at).toLocaleDateString('es-ES', { day: 'numeric', year: 'numeric', month: 'long' }).replace(/^\w/, c => c.toUpperCase()).replace(' de ', ' ')}
          </span>
        </div>
      </div>
      <form className='rounded-xl bg-white px-6 py-8 border border-[#D1D5DC]' onSubmit={handleProfileSubmit}>
        <h1 className='text-3xl font-bold mb-8'>Información personal</h1>
        <div className='grid md:grid-cols-2 gap-6 mb-6'>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="name">Nombres <span className="text-[#FB2C36]">*</span></label>
            <div className='relative'>
              <input
                type="name"
                id="name"
                name="name"
                value={newSession.name}
                onChange={e => setNewSession(old => ({ ...old, name: e.target.value }))}
                disabled={saving}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-gray-100"
                placeholder="Tus nombres" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="lastname">Apellidos <span className="text-[#FB2C36]">*</span></label>
            <div className='relative'>
              <input
                type="lastname"
                id="lastname"
                name="lastname"
                value={newSession.lastname}
                onChange={e => setNewSession(old => ({ ...old, lastname: e.target.value }))}
                disabled={saving}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-gray-100"
                placeholder="Tus apellidos" />
            </div>
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" htmlFor="document">Documento de identidad <span className="text-[#FB2C36]">*</span></label>
          <div className='relative flex items-center mb-1'>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="h-full px-4 py-3 text-sm border border-gray-300 rounded-l-lg focus:outline-none focus:border-primary bg-white flex items-center justify-between disabled:cursor-not-allowed"
                disabled
              >
                {newSession.document_type}
                <i className={`ti ti-chevron-down ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <ul className="absolute top-full left-0 mt-1 w-20 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                  <li
                    onClick={() => handleSelectDocumentType('dni')}
                    className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                  >
                    DNI
                  </li>
                  <li
                    onClick={() => handleSelectDocumentType('ce')}
                    className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                  >
                    CE
                  </li>
                </ul>
              )}
            </div>
            <input
              type="text"
              id="document"
              name="document"
              value={newSession.document_number}
              onChange={e => setNewSession(old => ({ ...old, document_number: e.target.value }))}
              disabled
              className="w-full px-4 py-3 text-sm border border-l-0 border-gray-300 rounded-r-lg focus:outline-none focus:border-primary disabled:cursor-not-allowed"
              placeholder="Ingresa tu número de documento" />
          </div>
          <small className="text-xs text-[#4B5563]">Nos ayuda a evitar fraudes. Necesario para recoger pedidos.</small>
        </div>
        <div className='mb-6'>
          <label className="block text-sm font-medium mb-2" htmlFor="name">Correo electrónico <span className="text-[#FB2C36]">*</span></label>
          <div className='relative'>
            <input
              type="name"
              id="name"
              name="name"
              value={newSession.email}
              onChange={e => setNewSession(old => ({ ...old, email: e.target.value }))}
              disabled
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary disabled:cursor-not-allowed"
              placeholder="Tus nombres" />
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" htmlFor="phone">Teléfono <span className="text-[#FB2C36]">*</span></label>
          <div className='relative mb-1'>
            <input
              type="phone"
              id="phone"
              name="phone"
              value={newSession.phone}
              onChange={e => setNewSession(old => ({ ...old, phone: e.target.value }))}
              disabled={saving}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-gray-100"
              placeholder="999 999 999" />
          </div>
          <small className="text-xs text-[#4B5563]">Usaremos este número solo para contacto de seguridad.</small>
        </div>
        <button className="block py-3 px-4 text-sm bg-primary text-white rounded-md hover:bg-opacity-80 outline-none disabled:bg-black disabled:bg-opacity-5 disabled:text-black disabled:text-opacity-55" type="submit" disabled={saving}>
          Guardar cambios
        </button>
      </form>

      {/* Payment method section for sellers */}
      {hasRole('Seller') && (
        <form className='rounded-xl bg-white px-6 py-8 border border-[#D1D5DC]' onSubmit={handlePaymentSubmit}>
          <div className='mb-8'>
            <h4 className="text-3xl font-bold mb-2 text-start">Configura cómo quieres cobrar</h4>
            <p className='text-start w-full text-gray-600'>Usamos estos datos solo para depositarte. No se comparten con compradores.</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Tipo de cuenta <span className="text-[#FB2C36]">*</span></label>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="group flex gap-4 items-start p-4 border border-gray-300 rounded-xl cursor-pointer hover:border-primary transition has-[:checked]:border-primary">
                <input
                  type="radio"
                  name="accountType"
                  className="peer mt-1 w-4 h-4"
                  value="cci"
                  checked={newSession.account_type === "cci"}
                  onChange={() => setNewSession(old => ({ ...old, account_type: 'cci', account_number: '' }))}
                  required
                />
                <div className="flex flex-col">
                  <span className="group-has-[:checked]:text-primary">Cuenta bancaria (CCI)</span>
                  <small className="text-sm text-silver">Recibe transferencias interbancarias</small>
                </div>
              </label>
              <label className="group flex gap-4 items-start p-4 border border-gray-300 rounded-xl cursor-pointer hover:border-primary transition has-[:checked]:border-primary">
                <input
                  type="radio"
                  name="accountType"
                  className="peer mt-1 w-4 h-4"
                  value="wallet"
                  checked={newSession.account_type === "wallet"}
                  onChange={() => setNewSession(old => ({ ...old, account_type: 'wallet', account_number: '', account_cci: '' }))}
                  required
                />
                <div className="flex flex-col">
                  <span className="group-has-[:checked]:text-primary">Yape / Plin</span>
                  <small className="text-sm text-silver">Recibe pagos en tu billetera digital</small>
                </div>
              </label>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" htmlFor="accountNumber">
              {label} <span className="text-[#FB2C36]">*</span>
            </label>
            <input
              type="number"
              id="accountNumber"
              name="accountNumber"
              value={newSession.account_number}
              onChange={e => setNewSession(old => ({ ...old, account_number: e.target.value }))}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder={placeholder}
              required
            />
          </div>
          {
            newSession.account_type == 'cci' &&
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" htmlFor="accountCci">
                Número de cuenta CCI (20 dígitos) <span className="text-[#FB2C36]">*</span>
              </label>
              <input
                type="number"
                id="accountCci"
                name="accountCci"
                value={newSession.account_cci}
                onChange={e => setNewSession(old => ({ ...old, account_cci: e.target.value }))}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder='Ingresa tu número CCI'
                required
              />
            </div>
          }
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" htmlFor="holderName">Nombre del titular <span className="text-[#FB2C36]">*</span></label>
            <input
              type="text"
              id="holderName"
              name="holderName"
              value={newSession.holder_name.toUpperCase()}
              onChange={e => setNewSession(old => ({ ...old, holder_name: e.target.value.toUpperCase() }))}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              placeholder="Ingresa nombres y apellidos del titular"
              required
            />
          </div>
          <div className='bg-[#E8F5FF] text-xs p-2 rounded mb-8 flex gap-2'>
            <i className="mdi mdi-information-outline text-primary"></i>
            Depositamos el monto de cada venta luego de que el comprador confirma el recojo exitoso o luego de 72 horas si no hay reclamos.
          </div>
          <button className="block py-3 px-4 text-sm bg-primary text-white rounded-md hover:bg-opacity-80 outline-none disabled:bg-black disabled:bg-opacity-5 disabled:text-black disabled:text-opacity-55" type="submit" disabled={saving}>
            Guardar cambios
          </button>
        </form>
      )}

      {/* Delivery points section for sellers */}
      {hasRole('Seller') && (
        <form className='rounded-xl bg-white px-6 py-8 border border-[#D1D5DC]' onSubmit={handlePointsSubmit}>
          <div className='mb-8'>
            <h4 className="text-3xl font-bold mb-2 text-start">Modificar puntos de entrega</h4>
            <p className='text-start w-full text-gray-600'>Define los lugares donde los compradores pueden recoger sus cartas.</p>
          </div>
          <div className='grid md:grid-cols-2 gap-4 mb-8'>
            {
              deliveryPoints.map(point => {
                const isSelected = points.includes(point.id);
                return (
                  <div
                    key={point.id}
                    onClick={() => toggleDeliveryPoint(point.id)}
                    className={`relative border p-4 rounded-xl  cursor-pointer ${isSelected ? 'border-primary' : 'border-gray-300'}`}
                  >
                    <div className="w-full flex items-center justify-between gap-4 mb-2">
                      <span className='w-10 h-10 bg-[#F3F4F6] rounded-xl flex items-center justify-center'>
                        <i className='mdi mdi-store text-silver'></i>
                      </span>
                      <div className='flex-1'>
                        <h4 className='mb-0'>{point.name}</h4>
                        <span className='block text-silver text-sm'>{point.district}, {point.department}</span>
                      </div>
                    </div>
                    <ul className='text-silver text-sm grid gap-1'>
                      <li>
                        <i className='mdi mdi-map-marker-outline me-1' />
                        <span>{point.address} {point.number} {point.reference && `(${point.reference})`}</span>
                      </li>
                      <li>
                        <i className='mdi mdi-clock-outline me-1' />
                        <span>{buildSchedule(point.opening_hours)}</span>
                      </li>
                    </ul>
                    {
                      isSelected &&
                      <i
                        className={`mdi mdi-checkbox-marked-outline text-2xl text-primary absolute top-6 right-6 cursor-pointer`}
                      />
                    }
                  </div>
                );
              })
            }
          </div>
          <button className="block py-3 px-4 text-sm bg-primary text-white rounded-md hover:bg-opacity-80 outline-none disabled:bg-black disabled:bg-opacity-5 disabled:text-black disabled:text-opacity-55" type="submit" disabled={saving || points.length == 0}>
            Guardar cambios
          </button>
        </form>
      )}

      <section className='rounded-xl bg-white px-6 py-8 border border-[#D1D5DC]' onSubmit={() => { }}>
        <div className='flex gap-4 mb-8 items-center'>
          <i className='mdi mdi-bell-outline bg-[#E8F5FF] w-14 h-14 rounded-full flex items-center justify-center text-3xl text-primary' />
          <h1 className='text-3xl font-bold flex-1'>Notificaciones</h1>
        </div>
        <div className='space-y-6'>
          <div className='flex gap-4 border border-[#D2D2D7] p-4 rounded-xl items-center'>
            <div className='text-sm flex-1'>
              <span className='block mb-2'>Notificaciones de compras</span>
              <span className='block text-[#86868B]'>Recibe confirmaciones de pedidos y actualizaciones de recojo</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer"
                checked={newSession.notify_purchases}
                onChange={e => !saving && handleNotifyChange('notify_purchases', e.target.checked)}
                disabled={saving} />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/20 transition-colors"></div>
              <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transform peer-checked:translate-x-5 transition-transform"></div>
            </label>
          </div>
          <div className='flex gap-4 border border-[#D2D2D7] p-4 rounded-xl items-center'>
            <div className='text-sm flex-1'>
              <span className='block mb-2'>Notificaciones de ventas</span>
              <span className='block text-[#86868B]'>Recibe notificaciones cuando vendas una carta</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer"
                checked={newSession.notify_sales}
                onChange={e => !saving && handleNotifyChange('notify_sales', e.target.checked)}
                disabled={saving} />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/20 transition-colors"></div>
              <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transform peer-checked:translate-x-5 transition-transform"></div>
            </label>
          </div>
          <div className='flex gap-4 border border-[#D2D2D7] p-4 rounded-xl items-center'>
            <div className='text-sm flex-1'>
              <span className='block mb-2'>Alertas de precio</span>
              <span className='block text-[#86868B]'>Recibe notificaciones cuando las cartas de tu lista bajen de precio</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer"
                checked={newSession.notify_prices}
                onChange={e => !saving && handleNotifyChange('notify_prices', e.target.checked)}
                disabled={saving} />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/20 transition-colors"></div>
              <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transform peer-checked:translate-x-5 transition-transform"></div>
            </label>
          </div>
        </div>
      </section>
    </div>
  </section>
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Base {...properties}>
      <Profile {...properties} />
    </Base>
  );
});
