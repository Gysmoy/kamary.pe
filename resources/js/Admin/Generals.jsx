import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

// Asume que tienes un servicio para guardar los datos
import BaseAdminto from '../Components/Adminto/Base';
import GeneralsRest from '../Actions/Admin/GeneralsRest';
import CreateReactScript from '../Utils/CreateReactScript';
import { createRoot } from 'react-dom/client';
import TextareaFormGroup from '../Components/Adminto/form/TextareaFormGroup';
import Global from '../Utils/Global';
import InputFormGroup from '../Components/Adminto/form/InputFormGroup';
import SelectFormGroup from '../Components/Adminto/form/SelectFormGroup';

const generalsRest = new GeneralsRest()

const Generals = ({ generals }) => {

  const location = generals.find(x => x.correlative == 'location')?.description ?? '0,0'

  const [formData, setFormData] = useState({
    phones: generals.find(x => x.correlative == 'phone_contact')?.description?.split(',')?.map(x => x.trim()) ?? [''],
    emails: generals.find(x => x.correlative == 'email_contact')?.description?.split(',')?.map(x => x.trim()) ?? [''],
    address: generals.find(x => x.correlative == 'address')?.description ?? '',
    openingHours: generals.find(x => x.correlative == 'opening_hours')?.description ?? '',
    supportPhone: generals.find(x => x.correlative == 'support_phone')?.description ?? '',
    supportEmail: generals.find(x => x.correlative == 'support_email')?.description ?? '',
    privacyPolicy: generals.find(x => x.correlative == 'privacy_policy')?.description ?? '',
    termsConditions: generals.find(x => x.correlative == 'terms_conditions')?.description ?? '',
    seoTitle: generals.find(x => x.correlative == 'seo_title')?.description ?? '',
    seoDescription: generals.find(x => x.correlative == 'seo_description')?.description ?? '',
    seoKeywords: generals.find(x => x.correlative == 'seo_keywords')?.description ?? '',
    location: {
      lat: Number(location.split(',').map(x => x.trim())[0]),
      lng: Number(location.split(',').map(x => x.trim())[1])
    },
    freeShipping: generals.find(x => x.correlative == 'free_shipping')?.description === 'true',
    freeShippingMinimumAmount: generals.find(x => x.correlative == 'free_shipping_minimum_amount')?.description ?? '100',
    freeShippingAmount: generals.find(x => x.correlative == 'free_shipping_amount')?.description ?? '10',
    freeShippingZones: (generals.find(x => x.correlative == 'free_shipping_zones')?.description ?? 'metropolitana').split(','),
    freeShippingBannerText: generals.find(x => x.correlative == 'free_shipping_banner')?.description ?? '',
    topbar: generals.find(x => x.correlative == 'topbar')?.description ?? null,
    googleMapsApiKey: generals.find(x => x.correlative == 'google_maps_api_key')?.description ?? '',
  });

  const [activeTab, setActiveTab] = useState('delivery');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleInputChange = (e, index, field) => {
    const { value } = e.target;
    const list = [...formData[field]];
    list[index] = value;
    setFormData(prevState => ({
      ...prevState,
      [field]: list
    }));
  };

  const handleAddField = (field) => {
    setFormData(prevState => ({
      ...prevState,
      [field]: [...prevState[field], '']
    }));
  };

  const handleRemoveField = (index, field) => {
    const list = [...formData[field]];
    list.splice(index, 1);
    setFormData(prevState => ({
      ...prevState,
      [field]: list
    }));
  };

  const handleMapClick = (event) => {
    setFormData(prevState => ({
      ...prevState,
      location: {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    try {
      const result = await generalsRest.save([
        { correlative: 'phone_contact', name: 'Teléfono de contacto', description: formData.phones.join(',') },
        { correlative: 'email_contact', name: 'Correo de contacto', description: formData.emails.join(',') },
        { correlative: 'address', name: 'Dirección', description: formData.address },
        { correlative: 'opening_hours', name: 'Horarios de atención', description: formData.openingHours },
        { correlative: 'support_phone', name: 'Número de soporte', description: formData.supportPhone },
        { correlative: 'support_email', name: 'Correo de soporte', description: formData.supportEmail },
        { correlative: 'privacy_policy', name: 'Política de privacidad', description: formData.privacyPolicy },
        { correlative: 'terms_conditions', name: 'Términos y condiciones', description: formData.termsConditions },
        { correlative: 'seo_title', name: 'Titulo - SEO', description: formData.seoTitle },
        { correlative: 'seo_description', name: 'Descripcion - SEO', description: formData.seoDescription },
        { correlative: 'seo_keywords', name: 'Palabras clave - SEO', description: formData.seoKeywords },
        { correlative: 'location', name: 'Ubicación', description: `${formData.location.lat},${formData.location.lng}` },
        { correlative: 'free_shipping', name: 'Envíos gratis', description: formData.freeShipping?.toString() ?? false },
        { correlative: 'free_shipping_minimum_amount', name: 'Monto mínimo para envío gratis', description: formData.freeShippingMinimumAmount.toString() },
        { correlative: 'free_shipping_amount', name: 'Monto mínimo para envío gratis', description: formData.freeShippingAmount.toString() },
        { correlative: 'free_shipping_zones', name: 'Zonas con envío gratis', description: formData.freeShippingZones.join(',') },
        { correlative: 'free_shipping_banner', name: 'Texto para banner', description: formData.freeShippingBannerText },
        { correlative: 'topbar', name: 'Cintillo', description: formData.topbar?.toString() ?? false },
        { correlative: 'google_maps_api_key', name: 'Google Maps API Key', description: formData.googleMapsApiKey?.toString() ?? '' },
      ]);
      if (result) {
        Global.set('GMAPS_API_KEY', formData.googleMapsApiKey?.toString() ?? '');
        setSaveMessage('Configuracion guardada correctamente.');
      }
    } catch (error) {
      console.error('Error al guardar los datos:', error);
      setSaveMessage('No se pudo guardar la configuracion.');
    } finally {
      setIsSaving(false);
    }
  };

  const seo_keywords = (generals.find(x => x.correlative == 'seo_keywords')?.description ?? '').split(',').map(x => x.trim()).filter(Boolean)

  useEffect(() => {
    $('#cbo-keywords option').prop('selected', true).trigger('change')
  }, [null])

  return (
    <div className="card">
      <form className='card-body' onSubmit={handleSubmit} noValidate>
        <ul className="nav nav-tabs" id="contactTabs" role="tablist">
          <li className="nav-item" role="presentation" hidden> {/* Quitar el hidden para que se muestren las opciones */}
            <button className={`nav-link ${activeTab === 'contact' ? 'active' : ''}`} onClick={() => setActiveTab('contact')} type="button" role="tab">
              Información de Contacto
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className={`nav-link ${activeTab === 'delivery' ? 'active' : ''}`} onClick={() => setActiveTab('delivery')} type="button" role="tab">
              Configuración de Envíos
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className={`nav-link ${activeTab === 'policies' ? 'active' : ''}`} onClick={() => setActiveTab('policies')} type="button" role="tab">
              Políticas y Términos
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className={`nav-link ${activeTab === 'web-details' ? 'active' : ''}`} onClick={() => setActiveTab('web-details')} type="button" role="tab">
              Detalles de la Web
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className={`nav-link ${activeTab === 'integrations' ? 'active' : ''}`} onClick={() => setActiveTab('integrations')} type="button" role="tab">
              Integraciones
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className={`nav-link ${activeTab === 'seo' ? 'active' : ''}`} onClick={() => setActiveTab('seo')} type="button" role="tab">
              SEO (Metatags)
            </button>
          </li>
          <li className="nav-item" role="presentation" hidden> {/* Quitar el hidden para que se muestren las opciones */}
            <button className={`nav-link ${activeTab === 'location' ? 'active' : ''}`} onClick={() => setActiveTab('location')} type="button" role="tab">
              Ubicación
            </button>
          </li>
        </ul>

        <div className="tab-content" id="contactTabsContent">
          <div className={`tab-pane fade ${activeTab === 'contact' ? 'show active' : ''}`} role="tabpanel">
            <div className="row">
              <div className="col-md-6">
                {formData.phones.map((phone, index) => (
                  <div key={`phone-${index}`} className="mb-3">
                    <label htmlFor={`phone-${index}`} className="form-label">Teléfono {index + 1}</label>
                    <div className="input-group">
                      <input
                        type="tel"
                        className="form-control"
                        id={`phone-${index}`}
                        value={phone}
                        onChange={(e) => handleInputChange(e, index, 'phones')}
                        required
                      />
                      <button type="button" className="btn btn-outline-danger" onClick={() => handleRemoveField(index, 'phones')}>
                        <i className='fa fa-trash'></i>
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-outline-primary" onClick={() => handleAddField('phones')}>Agregar teléfono</button>
              </div>
              <div className="col-md-6">
                {formData.emails.map((email, index) => (
                  <div key={`email-${index}`} className="mb-3">
                    <label htmlFor={`email-${index}`} className="form-label">Correo {index + 1}</label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        id={`email-${index}`}
                        value={email}
                        onChange={(e) => handleInputChange(e, index, 'emails')}
                        required
                      />
                      <button type="button" className="btn btn-outline-danger" onClick={() => handleRemoveField(index, 'emails')}>
                        <i className='fa fa-trash'></i>
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-outline-primary" onClick={() => handleAddField('emails')}>Agregar correo</button>
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="address" className="form-label">Dirección</label>
              <textarea
                className="form-control"
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              ></textarea>
            </div>
            <div className="mb-3">
              <TextareaFormGroup label='Horarios de atencion' onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })} value={formData.openingHours} required />
            </div>
            <div className="mb-3">
              <label htmlFor="supportPhone" className="form-label">Número de soporte</label>
              <input
                type="tel"
                className="form-control"
                id="supportPhone"
                value={formData.supportPhone}
                onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="supportEmail" className="form-label">Correo de soporte</label>
              <input
                type="email"
                className="form-control"
                id="supportEmail"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                required
              />
            </div>
          </div>

          <div className={`tab-pane fade ${activeTab === 'delivery' ? 'show active' : ''}`} role="tabpanel">
            <div className="row">
              <div className="col-xl-3 col-lg-4 col-md-6 col-sm-8 col-xs-12">
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="free-shipping"
                      checked={formData.freeShipping}
                      onChange={(e) => setFormData({ ...formData, freeShipping: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="free-shipping">
                      Habilitar envíos gratis
                      <small className="text-muted d-block">Al habilitar esta opción </small>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-xl-3 col-lg-4 col-md-6 col-sm-8 col-xs-12">
                <div className="mb-3">
                  <label className="form-label">Monto mínimo para envío gratis</label>
                  <div className="input-group mb-1">
                    <span className="input-group-text">S/</span>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.freeShippingMinimumAmount}
                      onChange={(e) => setFormData({ ...formData, freeShippingMinimumAmount: e.target.value })}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <small className="text-muted">Las ventas que superen este monto tendrán envío gratis en las zonas seleccionadas</small>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-xl-3 col-lg-4 col-md-6 col-sm-8 col-xs-12">
                <div className="mb-3">
                  <label className="form-label">Costo de envío</label>
                  <div className="input-group mb-1">
                    <span className="input-group-text">S/</span>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.freeShippingAmount}
                      onChange={(e) => setFormData({ ...formData, freeShippingAmount: e.target.value })}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <small className="text-muted">El costo de envío para las zonas seleccionadas</small>
                </div>
              </div>
            </div>
            <div className='row'>
              <div className="col-xl-3 col-lg-4 col-md-6 col-sm-8 col-xs-12">
                <div className="mb-3">
                  <label className="form-label">Zonas con envío gratis disponible</label>
                  <div className="form-check mb-2">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="metropolitana"
                      checked={formData.freeShippingZones?.includes('metropolitana')}
                      onChange={(e) => {
                        const zones = e.target.checked
                          ? [...formData.freeShippingZones, 'metropolitana']
                          : formData.freeShippingZones.filter(z => z !== 'metropolitana');
                        setFormData({ ...formData, freeShippingZones: zones });
                      }}
                    />
                    <label className="form-check-label" htmlFor="metropolitana">
                      Lima Metropolitana
                      <small className="text-muted d-block">Distritos principales de Lima</small>
                    </label>
                  </div>

                  <div className="form-check mb-2">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="alrededores"
                      checked={formData.freeShippingZones?.includes('alrededores')}
                      onChange={(e) => {
                        const zones = e.target.checked
                          ? [...formData.freeShippingZones, 'alrededores']
                          : formData.freeShippingZones.filter(z => z !== 'alrededores');
                        setFormData({ ...formData, freeShippingZones: zones });
                      }}
                    />
                    <label className="form-check-label" htmlFor="alrededores">
                      Lima Alrededores
                      <small className="text-muted d-block">Distritos periféricos de Lima</small>
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="provincias"
                      checked={formData.freeShippingZones?.includes('provincias')}
                      onChange={(e) => {
                        const zones = e.target.checked
                          ? [...formData.freeShippingZones, 'provincias']
                          : formData.freeShippingZones.filter(z => z !== 'provincias');
                        setFormData({ ...formData, freeShippingZones: zones });
                      }}
                    />
                    <label className="form-check-label" htmlFor="provincias">
                      Provincias
                      <small className="text-muted d-block">Envíos a nivel nacional</small>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-xl-3 col-lg-4 col-md-6 col-sm-8 col-xs-12">
                <div className="mb-3">
                  <label className="form-label">Texto para banner</label>
                  <textarea
                    className="form-control"
                    value={formData.freeShippingBannerText}
                    onChange={(e) => setFormData({ ...formData, freeShippingBannerText: e.target.value })}
                    required
                    style={{ minHeight: (3 * 27), fieldSizing: 'content' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`tab-pane fade ${activeTab === 'policies' ? 'show active' : ''}`} role="tabpanel">
            <div className="mb-3" hidden>
              <TextareaFormGroup label='Política de privacidad' value={formData.privacyPolicy} onChange={(e) => setFormData({ ...formData, privacyPolicy: e.target.value })} />
            </div>
            <div className="mb-3">
              <TextareaFormGroup label='Términos y condiciones' value={formData.termsConditions} onChange={(e) => setFormData({ ...formData, termsConditions: e.target.value })} />
            </div>
          </div>

          <div className={`tab-pane fade ${activeTab === 'seo' ? 'show active' : ''}`} role="tabpanel">
            <InputFormGroup label='Titulo - SEO' value={formData.seoTitle ?? ''} onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })} />
            <TextareaFormGroup label='Descripcion - SEO' value={formData.seoDescription ?? ''} onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })} />
            <SelectFormGroup id='cbo-keywords' label='Palabras clave - SEO' tags multiple onChange={e => setFormData({ ...formData, seoKeywords: [...$(e.target).val()].join(', ') })} >
              {
                seo_keywords.map((keyword, index) => {
                  return <option key={index} value={keyword}>{keyword}</option>
                })
              }
            </SelectFormGroup>
          </div>

          <div className={`tab-pane fade ${activeTab === 'web-details' ? 'show active' : ''}`} role="tabpanel">
            <div className="row">
              <div className="col-xl-3 col-lg-4 col-md-6 col-sm-8 col-xs-12">
                <div className="mb-3">
                  <label className="form-label">Texto para el cintillo</label>
                  <textarea
                    className="form-control"
                    value={formData.topbar}
                    onChange={(e) => setFormData({ ...formData, topbar: e.target.value })}
                    required
                    style={{ minHeight: (3 * 27), fieldSizing: 'content' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`tab-pane fade ${activeTab === 'integrations' ? 'show active' : ''}`} role="tabpanel">
            <div className="row">
              <div className="col-xl-6 col-lg-7 col-md-9 col-sm-12">
                <div className="mb-3">
                  <label className="form-label">Google Maps API Key</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.googleMapsApiKey}
                    onChange={(e) => setFormData({ ...formData, googleMapsApiKey: e.target.value })}
                    placeholder="AIza..."
                    autoComplete="off"
                  />
                  <small className="text-muted d-block mt-1">
                    Se usa en pedidos comerciales para cargar el mapa de Google. Si queda vacio, el sistema usa GMAPS_API_KEY del .env o el mapa libre.
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className={`tab-pane fade ${activeTab === 'location' ? 'show active' : ''}`} role="tabpanel">
            {activeTab === 'location' && Global.GMAPS_API_KEY ? <>
              <LoadScript googleMapsApiKey={Global.GMAPS_API_KEY}>
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '400px' }}
                  center={formData.location}
                  zoom={10}
                  onClick={handleMapClick}
                >
                  <Marker position={formData.location} />
                </GoogleMap>
              </LoadScript>
              <small className="form-text text-muted">
                Haz clic en el mapa para seleccionar la ubicación.
              </small>
            </> : <small className="text-muted">Configura Google Maps API Key para habilitar el mapa.</small>}
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 mt-3">
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
          {saveMessage && <small className="text-muted">{saveMessage}</small>}
        </div>
      </form>
    </div>
  );
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<BaseAdminto {...properties} title="Datos Generales">
    <Generals {...properties} />
  </BaseAdminto>);
})
