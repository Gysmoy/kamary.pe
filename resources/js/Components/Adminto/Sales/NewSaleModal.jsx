import { useEffect, useRef, useState } from "react";
import Modal from "../Modal"
import SelectFormGroup from "../form/SelectFormGroup";
import { renderToString } from "react-dom/server";
import InputFormGroup from "../form/InputFormGroup";
import places from '../../../Components/Product/components/places.json';
import TextareaFormGroup from "../form/TextareaFormGroup";
import Tippy from "@tippyjs/react";
import CouponsRest from "../../../Actions/CouponsRest";
import Number2Currency from "../../../Utils/Number2Currency";
import SalesRest from "../../../Actions/Admin/SalesRest";
import Swal from "sweetalert2";
import RadioMultipleFormGroup from "../form/RadioMultipleFormGroup";
import RadioFormGroup from "../form/RadioFormGroup";
import UserFormulasRest from "../../../Actions/UserFormulasRest";
import { toast } from "sonner";

const couponsRest = new CouponsRest()
const salesRest = new SalesRest()
const userFormulasRest = new UserFormulasRest()

const NewSaleModal = ({
  modalRef, gridRef, items,
  phone_prefixes = [], bundles,
  free_shipping,
  free_shipping_minimum_amount,
  free_shipping_amount,
  free_shipping_zones,
  origins,
  hasTreatment,
  scalpType,
  hairType,
  hairThickness,
  hairGoals,
  fragrances
}) => {

  if (!modalRef) modalRef = useRef()
  const newFormulaModalRef = useRef()

  const [sale, setSale] = useState({
    "billing_type": 'boleta',
    "phone_prefix": '51',
    "billing_number": '',
    "email": '',
    "phone": '',
    "origin": '',
    "origin_comment": '',
    "department": '',
    "province": '',
    "zip_code": '',
    "address": '',
    "number": '',
    "reference": '',
    "comment": '',
    "name": '',
    "lastname": '',
    "country": '',
    "department_code": '',
    "district": '',
    "coupon": '',
    "amount_discount": 0,
    "user_formula_id": null
  });
  const [cart, setCart] = useState([]);
  const [formulas, setFormulas] = useState([]);
  const [newFormula, setNewFormula] = useState(null)

  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);

  const calculateBundle = (cart) => {
    const totalQuantity = cart.reduce((sum, item) => sum + Number(item.quantity), 0);
    const bundle = bundles.find(bundle => {
      switch (bundle.comparator) {
        case '<':
          return totalQuantity < bundle.items_quantity
        case '>':
          return totalQuantity > bundle.items_quantity
        default:
          return totalQuantity == bundle.items_quantity
      }
    });
    return bundle;
  }
  const calculateCouponDiscount = (coupon, totalPrice) => {
    if (!coupon) return 0
    const amount = Number(coupon.amount) || 0
    if (coupon.type == 'fixed_amount') {
      return amount
    } else if (coupon.type == 'percentage') {
      return (totalPrice - bundleDiscount) * amount / 100
    } else {
      return 0
    }
  }

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const bundle = calculateBundle(cart); // Implementar esta función según la lógica de bundles
  const bundleDiscount = totalPrice * (bundle?.percentage || 0);
  const couponDiscount = calculateCouponDiscount(coupon, totalPrice); // Implementar esta función

  let delivery = 0
  if (free_shipping == 'true') {
    for (const zone of free_shipping_zones.split(',')) {
      if ((totalPrice - bundleDiscount) >= free_shipping_minimum_amount) {
        places[zone].delivery = 'Gratis'
        delivery = 0
      } else {
        places[zone].delivery = `S/ ${Number2Currency(free_shipping_amount)}`
        delivery = Number(free_shipping_amount)
      }
    }
  }

  const amountDiscount = Number(sale.amount_discount) || 0

  const finalPrice = totalPrice - bundleDiscount - couponDiscount - amountDiscount + delivery;

  const onColorClick = (index, color) => {
    const newCart = [...cart];
    const item = newCart[index];
    item.colors.push(color)
    item.quantity = item.colors.length
    setCart(newCart);
  };

  const onColorBadgeClick = (index, colorId) => {
    const newCart = [...cart];
    const item = newCart[index];
    item.colors = item.colors.filter(x => x.id !== colorId);
    item.quantity = item.colors.length
    setCart(newCart);
  };

  const onQuantityChange = (index, quantity) => {
    const newCart = [...cart];
    const item = newCart[index];
    item.quantity = quantity
    setCart(newCart);
  };

  const onApplyCoupon = async () => {
    const result = await couponsRest.save({
      coupon: couponCode,
      amount: totalPrice,
      email: sale.email
    })
    if (result) setCoupon(result.data)
    else setCoupon(null)
  };

  const getSale = () => {
    let department = 'Lima';
    let province = 'Lima'
    let district = null

    if (Array.isArray(places[sale.department].items)) {
      department = places[sale.department].name
      province = sale.province
      district = null
    } else {
      department = sale.province
      province = null
      district = sale.district
    }

    return {
      ...sale,
      country: 'Perú',
      department_code: sale.department,
      department, province, district
    }
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const cleanCart = cart.filter(item => item.quantity > 0)
    if (cleanCart.length == 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay productos en la venta',
        text: 'Debe agregar al menos un producto a la venta'
      })
      return
    }

    const request = {
      sale: {
        ...getSale(),
        coupon: coupon?.name || null,
      },
      details: cart
    }

    const result = await salesRest.pos(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const prefixTemplate = (data) => {
    if (!data.id) {
      return data.text;
    }
    const prefix = data.element.dataset.code
    const flag = data.element.dataset.flag
    const country = data.element.dataset.country
    const container = renderToString(<>
      <span className="font-emoji text-center">{flag}</span>
      <b className="ms-1">{prefix}</b>
      <small className="d-block text-truncate">{country}</small>
    </>)
    return $(container)
  }

  const resetSale = () => {
    setSale({
      "sale_date": moment().subtract(5, 'hours').format('YYYY-MM-DD'),
      "billing_type": 'boleta',
      "phone_prefix": '51',
      "billing_number": '',
      "email": '',
      "phone": '',
      "origin_id": '',
      "origin": '',
      "origin_comment": '',
      "department": '',
      "province": '',
      "zip_code": '',
      "address": '',
      "number": '',
      "reference": '',
      "comment": '',
      "name": '',
      "lastname": '',
      "country": '',
      "department_code": '',
      "district": '',
      "coupon": '',
      "amount_discount": 0,
      "user_formula_id": null
    })
    setCart(items.filter(({ is_default }) => is_default).map(item => {
      return {
        id: item.id,
        name: item.name,
        price: item.price,
        colors: [],
        quantity: 0
      }
    }))
    setCouponCode('')
    setCoupon(null)
    setFormulas([])
  }

  const handleSearch = async () => {
    const search = sale.billing_number
    if (search.length < 8) {
      toast.success("Documento muy corto", {
        description: `El número de documento debe tener al menos 8 dígitos`,
        duration: 3000,
        position: "top-right",
        richColors: true,
      });
      return
    }
    const result = await salesRest.getLast(search)
    if (!result) return
    let department = 'provincias'
    if (result.department == 'Lima Metropolitana')
      department = 'metropolitana'
    else if (result.department == 'Lima Alrededores')
      department = 'alrededores'
    else
      result.province = result.department
    setSale({
      "sale_date": moment().subtract(5, 'hours').format('YYYY-MM-DD'),
      "billing_type": result.billing_type,
      "phone_prefix": result.phone_prefix,
      "billing_number": result.billing_number,
      "email": result.email,
      "phone": result.phone,
      "origin_id": result.origin_id,
      "origin": result.origin,
      "origin_comment": result.origin_comment,
      "department": department,
      "province": result.province,
      "zip_code": result.zip_code,
      "address": result.address,
      "number": result.number,
      "reference": result.reference || '',
      "comment": result.comment || '',
      "name": result.name,
      "lastname": result.lastname || '',
      "country": 'Perú',
      "department_code": result.department,
      "district": result.district || '',
      "coupon": '',
      "amount_discount": 0,
      "user_formula_id": result.formulas[0]?.id || null
    })
    setFormulas(result.formulas)
  }

  const onFormulaSubmit = async (e) => {
    e.preventDefault()
    const result = await userFormulasRest.save({ ...newFormula, email: sale?.email })
    if (!result?.data) return
    setFormulas(old => {
      const existingIndex = old.findIndex(f => f.id === result.data.id);
      if (existingIndex !== -1) {
        const updated = [...old];
        updated[existingIndex] = result.data;
        return updated;
      }
      return [...old, result.data];
    });
    setSale(old => ({ ...old, user_formula_id: result.data.id }))
    $(newFormulaModalRef.current).modal('hide')
  }

  useEffect(() => {
    $(modalRef.current).on('shown.bs.modal', () => {
      resetSale()
    })

    return () => {
      $(modalRef.current).off('shown.bs.modal')
    }
  }, [])

  const selectedFormula = formulas.find(x => x.id == sale.user_formula_id)

  return <>
    <Modal id="new-sale-modal" modalRef={modalRef} title={<div className="d-flex align-items-center gap-2">
      <h4 className="modal-title text-nowrap my-0">Nueva venta</h4>
      <input type="date" className="form-control form-control-sm" value={sale.sale_date} onChange={(e) => setSale(old => ({ ...old, sale_date: e.target.value }))} />
    </div>} size='lg' isStatic hideFooter onSubmit={onModalSubmit} onClose={resetSale}>
      <div className="row">
        <div className="col-md-6">
          <h4 className='mt-0'>Información del cliente</h4>
          <div className="mb-2">
            <label className="form-label">
              Tipo de comprobante <span className="text-danger">*</span>
            </label>
            <div className="row g-2">
              <div className="col-6">
                <label htmlFor="billing_type_boleta" className="card border mb-0">
                  <div className="card-body p-1 px-2 d-flex align-items-center  gap-1">
                    <input
                      type="radio"
                      className="form-check-input"
                      name="billing_type"
                      id="billing_type_boleta"
                      value="boleta"
                      style={{ marginTop: '-2px' }}
                      checked={sale.billing_type === 'boleta'}
                      onChange={(e) => setSale(old => ({ ...old, billing_type: e.target.value }))}
                      required
                    />
                    <span className="d-flex align-items-center justify-content-center gap-1" htmlFor="billing_type_boleta">
                      <i className="mdi mdi-account font-18"></i>
                      <span>Boleta</span>
                    </span>
                  </div>
                </label>
              </div>
              <div className="col-6">
                <label htmlFor="billing_type_factura" className="card border mb-0">
                  <div className="card-body p-1 px-2 d-flex align-items-center gap-1">
                    <input
                      type="radio"
                      className="form-check-input"
                      name="billing_type"
                      id="billing_type_factura"
                      value="factura"
                      style={{ marginTop: '-2px' }}
                      checked={sale.billing_type === 'factura'}
                      onChange={(e) => setSale(old => ({ ...old, billing_type: e.target.value }))}
                      required
                    />
                    <span className="d-flex align-items-center justify-content-center gap-1" htmlFor="billing_type_factura">
                      <i className="mdi mdi-office-building font-18"></i>
                      <span>Factura</span>
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Número de documento */}
          <div className="mb-2">
            <label className="form-label" htmlFor="billing_number">
              Documento <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <input
                type="text"
                id="billing_number"
                className="form-control"
                value={sale.billing_number || ''}
                maxLength={sale.billing_type === 'boleta' ? 8 : 11}
                minLength={sale.billing_type === 'boleta' ? 8 : 11}
                required
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setSale(old => ({ ...old, billing_number: value }));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleSearch}
              >
                <i className="mdi mdi-magnify"></i>
              </button>
            </div>
          </div>
          <div className="row">
            <InputFormGroup label='Nombres'
              col='col-md-6'
              value={sale.name}
              onChange={(e) => setSale(old => ({ ...old, name: e.target.value }))}
              required />
            <InputFormGroup label='Apellidos'
              col='col-md-6'
              value={sale.lastname}
              onChange={(e) => setSale(old => ({ ...old, lastname: e.target.value }))}
              required />
          </div>
          <InputFormGroup label='Email'
            type="email"
            value={sale.email}
            onChange={(e) => setSale(old => ({ ...old, email: e.target.value }))} // Implementar lógica para cambiar email
            required />
          <label htmlFor="" className='form-label'>
            Celular
          </label>
          <div className="row">
            <SelectFormGroup
              col='col-md-4'
              dropdownParent='#new-sale-modal'
              minimumInputLength={-1}
              templateResult={prefixTemplate}
              templateSelection={prefixTemplate}
              value={sale.phone_prefix}
              onChange={e => setSale(old => ({ ...old, phone_prefix: e.target.value }))}>
              {
                phone_prefixes
                  .sort((a, b) => a.country.localeCompare(b.country))
                  .map((prefix, index) => (
                    <option
                      key={index}
                      value={prefix.realCode}
                      data-code={prefix.beautyCode}
                      data-flag={prefix.flag}
                      data-country={prefix.country}
                    >
                      {prefix.beautyCode} {prefix.country}
                    </option>
                  ))
              }
            </SelectFormGroup>
            <InputFormGroup
              col='col-md-8'
              type="tel"
              value={sale.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setSale(old => ({ ...old, phone: value }));
              }} />
          </div>

          <div className="mb-2">
            <SelectFormGroup
              label='Origen de venta'
              minimumResultsForSearch={-1}
              dropdownParent='#new-sale-modal'
              value={sale.origin_id}
              onChange={(e) => {
                const selected = $(e.target).find(`option[value="${e.target.value}"]`)
                setSale(old => ({ ...old, origin_id: selected.val(), origin: selected.text() }))
              }}
              required
            >
              <option value="">Elige una opción</option>
              {
                origins.filter(({ editable }) => editable).map((origin, index) => <option key={index} value={origin.id}>{origin.name}</option>)
              }
            </SelectFormGroup>
          </div>
          <TextareaFormGroup label='Comentario interno'
            value={sale.origin_comment}
            onChange={(e) => setSale(old => ({ ...old, origin_comment: e.target.value }))}
            placeholder="Ingresa un comentario sobre por qué se está creando esta venta..."
          />
        </div>
        <div className="col-md-6">
          <h4 className='mt-0'>Dirección del cliente</h4>
          {/* <InputFormGroup label='Pais' value='Perú' disabled required /> */}
          <SelectFormGroup label='Región / Provincia'
            value={sale.department || ''}
            onChange={(e) => setSale(old => ({ ...old, department: e.target.value }))}
            minimumResultsForSearch={-1}
            dropdownParent='#new-sale-modal'
            required
          >
            <option value=''>Elige una opción</option>
            {
              Object.keys(places).map((key, index) => {
                return <option key={index} value={key}>{places[key].name}</option>
              })
            }
          </SelectFormGroup>
          {
            places[sale.department] &&
            <div className="row">
              {
                Array.isArray(places[sale.department].items)
                  ? <SelectFormGroup
                    label='Provincia'
                    col='col-md-8'
                    dropdownParent='#new-sale-modal'
                    value={sale.province}
                    effectWith={[sale.department]}
                    onChange={(e) => setSale(old => ({ ...old, province: e.target.value }))}
                    required>
                    <option value=''>Elige una opción</option>
                    {
                      places[sale.department].items.map((province, index) => {
                        return <option key={index} value={province}>{province}</option>
                      })
                    }
                  </SelectFormGroup>
                  : <>
                    <InputFormGroup label='Departamento'
                      col='col-md-4'
                      value={sale.province}
                      onChange={(e) => setSale(old => ({ ...old, province: e.target.value }))}
                      required />
                    <InputFormGroup label='Distrito'
                      col='col-md-4'
                      value={sale.district}
                      onChange={(e) => setSale(old => ({ ...old, district: e.target.value }))}
                      required />
                  </>
              }
              <InputFormGroup label='Cód. Postal'
                col='col-md-4'
                value={sale.zip_code}
                onChange={(e) => setSale(old => ({ ...old, zip_code: e.target.value }))}
              />
            </div>
          }
          <div className="row">
            <InputFormGroup label='Dirección'
              col={'col-md-8'}
              value={sale.address}
              onChange={(e) => setSale(old => ({ ...old, address: e.target.value }))}
              required />
            <InputFormGroup label='Número'
              col={'col-md-4'}
              type="number"
              value={sale.number}
              onChange={(e) => setSale(old => ({ ...old, number: e.target.value }))}
              required />
          </div>
          <InputFormGroup label='Apartamento, habitación, piso, etc.'
            value={sale.reference}
            onChange={(e) => setSale(old => ({ ...old, reference: e.target.value }))}
          />
          <TextareaFormGroup label='Notas del pedido'
            value={sale.comment}
            placeholder='Notas sobre el pedido, por ejemplo, notas especiales para la entrega.'
            onChange={(e) => setSale(old => ({ ...old, comment: e.target.value }))}
            rows={2}
          />
          <div className="form-group">
            <label className="form-label d-block mb-1">Fórmula</label>
            {
              formulas.length > 0 ? (
                <div className="dropdown">
                  <div
                    className="btn btn-sm btn-white text-start cursor-pointer dropdown-toggle w-100"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{ whiteSpace: 'normal' }}
                  >
                    {
                      selectedFormula
                        ? <>
                          <div><b>🧐 Tratamiento:</b> {hasTreatment.find(({ id }) => selectedFormula.has_treatment === id)?.description}</div>
                          <div><b>👀 Cuero cabelludo:</b> {scalpType.find(({ id }) => selectedFormula.scalp_type === id)?.description}</div>
                          <div><b>✅ Tipo de cabello:</b> {hairType.find(({ id }) => selectedFormula.hair_type === id)?.description}</div>
                          <div><b>💪 Grosor del cabello:</b> {hairThickness.find(({ id }) => selectedFormula.hair_thickness === id)?.description}</div>
                          <div><b>💡 Objetivos:</b> {selectedFormula.hair_goals?.map((goal, i) => <span key={i}>
                            {hairGoals.find(({ id }) => goal === id)?.description}{i < selectedFormula.hair_goals.length - 1 ? ', ' : ''}
                          </span>)}</div>
                          <div><b>🫙 Fragancia:</b> {fragrances.find(({ id }) => selectedFormula.fragrance_id === id)?.name}</div>
                        </>
                        : `Selecciona una fórmula`
                    }
                  </div>
                  <ul className="dropdown-menu shadow">
                    {formulas.map((formula, idx) => (
                      <li key={idx}>
                        <div className="dropdown-item cursor-pointer" style={{ maxWidth: '300px', whiteSpace: 'normal' }} onClick={() => setSale(old => ({ ...old, user_formula_id: formula.id }))}>
                          <div><b>🧐 Tratamiento:</b> {hasTreatment.find(({ id }) => formula.has_treatment === id)?.description}</div>
                          <div><b>👀 Cuero cabelludo:</b> {scalpType.find(({ id }) => formula.scalp_type === id)?.description}</div>
                          <div><b>✅ Tipo de cabello:</b> {hairType.find(({ id }) => formula.hair_type === id)?.description}</div>
                          <div><b>💪 Grosor del cabello:</b> {hairThickness.find(({ id }) => formula.hair_thickness === id)?.description}</div>
                          <div className="w-100">
                            <b>💡 Objetivos:</b>{' '}
                            {formula.hair_goals?.map((goal, i) => <span key={i}>
                              {hairGoals.find(({ id }) => goal === id)?.description}{i < formula.hair_goals.length - 1 ? ', ' : ''}
                            </span>)}
                          </div>
                          <span><b>🫙 Fragancia:</b> {fragrances.find(({ id }) => formula.fragrance_id === id)?.name}</span>
                        </div>
                      </li>
                    ))}
                    <li>
                      <button className="dropdown-item" type="button" onClick={() => $(newFormulaModalRef.current).modal('show')}>
                        <i className="mdi mdi-plus me-1"></i>
                        Agregar fórmula
                      </button>
                    </li>
                  </ul>
                </div>
              )
                : <button className="btn btn-sm btn-white" type="button" onClick={() => $(newFormulaModalRef.current).modal('show')}>
                  <i className="mdi mdi-plus me-1"></i>
                  Agregar fórmula
                </button>
            }
          </div>
        </div>

        <div className="col-12">
          <div className="mb-2">
            <h4 className="mb-0">Productos</h4>
            <small className="text-muted">Selecciona los productos que deseas agregar a la compra</small>
          </div>

          {/* Nuevo componente de selección de productos tipo checkout */}
          <div className="product-selection mb-1">
            <div className="row">
              {items.map((product) => {
                const isSelected = cart.some(item => item.id === product.id);
                return <div className="col-sm-6 col-md-3 mb-2" key={product.id}>
                  <div
                    className={`card mb-0 h-100 cursor-pointer shadow-lg ${isSelected ? 'border border-primary' : ''}`}
                    onClick={() => {
                      if (!isSelected) {
                        setCart([...cart, {
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          colors: [],
                          quantity: 0
                        }]);
                      } else {
                        const newCart = [...cart];
                        newCart.splice(newCart.findIndex(item => item.id === product.id), 1);
                        setCart(newCart);
                      }
                    }}
                  >
                    <div className="card-body p-2">
                      <h5 className={`card-title mt-0 mb-0 ${isSelected ? 'text-primary' : ''}`}>{product.name}</h5>
                      <small className="card-text text-muted">S/ {product.price || 79.90}</small>
                    </div>
                  </div>
                </div>
              })}
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-centered table-nowrap table-bordered table-sm">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Color</th>
                  <th style={{ width: '92px' }}>Cant.</th>
                  <th style={{ width: '88px' }}>Precio</th>
                  <th style={{ width: '88px' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((detail, index) => {
                  const product = items.find(item => item.id === detail.id);
                  const colors = product?.colors || [];
                  return <tr key={index}>
                    <td>
                      {product?.name || 'Producto no encontrado'}
                    </td>
                    <td style={{ width: '240px' }}>
                      <div className="d-flex flex-wrap gap-1">
                        {colors.map(color => {
                          const selecteds = detail.colors.filter(x => x.id === color.id).length;
                          return (
                            <Tippy key={color.id} content={color.name}>
                              <div
                                onClick={() => onColorClick(index, color)}
                                className="position-relative cursor-pointer"
                              >
                                <div
                                  className={`rounded-circle position-relative p-2 border ${selecteds > 0 ? 'border-primary' : ''}`}
                                  style={{ backgroundColor: color.hex }}
                                ></div>
                                {selecteds > 0 && (
                                  <small
                                    className="position-absolute translate-middle badge rounded-pill bg-primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onColorBadgeClick(index, color.id);
                                    }}
                                    style={{
                                      padding: '2px 4px',
                                      top: '4px',
                                      fontSize: '10px',
                                      right: '-12px',
                                    }}
                                  >
                                    {selecteds}
                                  </small>
                                )}
                              </div>
                            </Tippy>
                          );
                        })}
                      </div>
                    </td>
                    <td>{
                      colors.length == 0
                        ? <input
                          className="form-control form-control-sm"
                          type="number"
                          style={{ width: '75px' }}
                          value={detail.quantity}
                          onChange={e => onQuantityChange(index, e.target.value)} />
                        : detail.quantity
                    }</td>
                    <td className="text-end">S/ {detail.price}</td>
                    <td className="text-end">S/ {(detail.price * detail.quantity).toFixed(2)}</td>
                  </tr>
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="text-end">Subtotal:</td>
                  <td className="text-end">S/ {totalPrice.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="text-end">Descuento interno:</td>
                  <td className="text-end p-0">
                    <div className="input-group input-group-sm flex-nowrap">
                      <span className="input-group-text">S/ </span>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        style={{ width: '100px' }}
                        value={sale.amount_discount}
                        onChange={e => setSale({
                          ...sale,
                          amount_discount: e.target.value
                        })}
                      />
                    </div>
                  </td>
                </tr>
                {bundle && (
                  <tr>
                    <td colSpan={4} className="text-end">
                      <span className="d-block">Descuento por paquete</span>
                      <small className="text-muted -mt-1">
                        Escogiste un {bundle.name} ({(bundle.percentage * 100).toFixed(2)}%)
                      </small>
                    </td>
                    <td className="text-end">S/ -{Number2Currency(Math.round(bundleDiscount * 10) / 10)}</td>
                  </tr>
                )}
                {coupon && (
                  <tr>
                    <td colSpan={4} className="text-end">
                      <span className="d-block">
                        Cupón aplicado
                        <Tippy content='Eliminar'>
                          <i className="text-danger mdi mdi-close cursor-pointer ms-1" onClick={() => setCoupon(null)} />
                        </Tippy>
                      </span>
                      <small className="text-muted">{coupon.name} ({coupon.type == 'fixed_amount' ? `S/ -${Number2Currency(coupon.amount)}` : `-${Math.round(coupon.amount * 100) / 100}%`})</small>
                    </td>
                    <td className="text-end">S/ -{Number2Currency(Math.round(couponDiscount * 10) / 10)}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={4} className="text-end">Envío:</td>
                  <td className="text-end">
                    {
                      typeof places?.[sale.department]?.delivery == 'number'
                        ? `S/ ${Number2Currency(places?.[sale.department]?.delivery)}`
                        : places?.[sale.department]?.delivery
                    }
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="text-end">Total:</td>
                  <td className="text-end">S/ {Number2Currency(Math.round(finalPrice * 10) / 10)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">{
          !coupon &&
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Código de cupón"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onApplyCoupon}
            >
              Aplicar cupón
            </button>
          </div>
        }
        </div>
        <div className="col-md-6 text-end">
          {/* <button type="button" className="btn btn-light me-2" onClick={() => $(modalRef.current).modal('hide')}>
          Cancelar
        </button> */}
          <button type="submit" className="btn btn-primary">
            Guardar venta
          </button>
        </div>
      </div>
    </Modal>
    <Modal modalRef={newFormulaModalRef} title="Agregar fórmula" zIndex={1060} onClose={() => setNewFormula(null)} onSubmit={onFormulaSubmit}>
      <RadioFormGroup
        label="1. ¿Tu cabello ha recibido algún tipo de tratamiento?"
        name='has_treatment_new'
        value={newFormula?.has_treatment}
        options={hasTreatment.map(({ id, description }) => ({ value: id, label: description }))}
        onChange={(value) => setNewFormula(old => ({ ...old, has_treatment: value }))}
        uppercase
      />
      <RadioFormGroup
        label="2. Tu cuero cabelludo es:"
        name='scalp_type_new'
        value={newFormula?.scalp_type}
        options={scalpType.map(({ id, description }) => ({ value: id, label: description }))}
        onChange={(value) => setNewFormula(old => ({ ...old, scalp_type: value }))}
        uppercase
      />
      <RadioFormGroup
        label="3. Naturalmente ¿Cuál es tu tipo de cabello?"
        name='hair_type_new'
        value={newFormula?.hair_type}
        options={hairType.map(({ id, description }) => ({ value: id, label: description }))}
        onChange={(value) => setNewFormula(old => ({ ...old, hair_type: value }))}
        uppercase
      />
      <RadioFormGroup
        label="4. ¿Cuál crees que es el grosor de tu cabello?"
        name='hair_thickness_new'
        value={newFormula?.hair_thickness}
        options={hairThickness.map(({ id, description }) => ({ value: id, label: description }))}
        onChange={(value) => setNewFormula(old => ({ ...old, hair_thickness: value }))}
        uppercase
      />
      <RadioMultipleFormGroup
        label="5. ¿Qué quieres lograr con tu cabello?"
        name='hair_goals_new'
        value={newFormula?.hair_goals}
        options={hairGoals.map(({ id, description }) => ({ value: id, label: description }))}
        onChange={(value) => setNewFormula(old => ({ ...old, hair_goals: value }))}
        maxSelected={3}
        uppercase
      />
      <RadioFormGroup
        className='mb-0'
        label="6. Elige la fragancia de tu rutina"
        name='fragrance_new'
        value={newFormula?.fragrance}
        options={fragrances.map(({ id, name }) => ({ value: id, label: name }))}
        onChange={(value) => setNewFormula(old => ({ ...old, fragrance: value }))}
        uppercase
      />
    </Modal>
  </>
}

export default NewSaleModal