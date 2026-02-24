import Tippy from "@tippyjs/react";
import Global from "../../../Utils/Global";
import Number2Currency from "../../../Utils/Number2Currency";
import Modal from "../Modal"
import UserFormulaInfo from "../UserFormulas/UserFormulaInfo";
import SalesRest from "../../../Actions/Admin/SalesRest";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import SelectFormGroup from "../form/SelectFormGroup";
import InputFormGroup from "../form/InputFormGroup";
import RadioFormGroup from "../form/RadioFormGroup";
import RadioMultipleFormGroup from "../form/RadioMultipleFormGroup";
import UserFormulasRest from "../../../Actions/UserFormulasRest";

const salesRest = new SalesRest()
const userFormulasRest = new UserFormulasRest()

const SaleDetailModal = ({ modalRef, dataLoaded, gridRef, setDataLoaded, statuses, saleStatuses, items = [], origins = [], hasTreatment, scalpType, hairType, hairThickness, hairGoals, fragrances, onRefresh }) => {
    const upsellModalRef = useRef()
    const formulaModalRef = useRef()

    const [cart, setCart] = useState([])
    const [selectedFormula, setSelectedFormula] = useState(null)
    const [editingDiscount, setEditingDiscount] = useState(false)
    const [discountAmount, setDiscountAmount] = useState(0)

    const onStatusChange = async (e) => {
        const status_id = e.target.value
        const option = $(e.target).find(`option[value="${status_id}"]`)
        const confirm = option.data('confirm')

        if (confirm) {
            const { isConfirmed } = await Swal.fire({
                title: 'Actualizar estado',
                text: `¿Estás seguro de actualizar la venta al estado "${option.text()}"?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Si, actualizar',
                cancelButtonText: 'Cancelar'
            })
            if (!isConfirmed) return
        }

        const result = await salesRest.save({
            id: dataLoaded.id,
            status_id
        })
        if (!result) return
        setDataLoaded(result.data)
        $(gridRef.current).dxDataGrid('instance').refresh()
    }

    const onOriginChange = async (e) => {
        const status_id = e.target.value
        const option = $(e.target).find(`option[value="${status_id}"]`)

        const result = await salesRest.save({
            id: dataLoaded.id,
            origin_id: option.val(),
            origin: option.text()
        })
        if (!result) return
        setDataLoaded(result.data)
        $(gridRef.current).dxDataGrid('instance').refresh()
    }

    const onSaleDateChange = async (e) => {
        const sale_date = e.target.value

        const result = await salesRest.save({
            id: dataLoaded.id,
            sale_date
        })
        if (!result) return
        setDataLoaded(result.data)
        $(gridRef.current).dxDataGrid('instance').refresh()
    }

    const onCourierChange = async (e) => {
        const courier = e.target.value
        const result = await salesRest.save({
            id: dataLoaded.id,
            courier
        })
        if (!result) return
        setDataLoaded(result.data)
        $(gridRef.current).dxDataGrid('instance').refresh()
    }

    const onPickupChange = async (e) => {
        const pickup = e.target.value
        const result = await salesRest.save({
            id: dataLoaded.id,
            pickup
        })
        if (!result) return
        setDataLoaded(result.data)
        $(gridRef.current).dxDataGrid('instance').refresh()
    }

    const onDeliveryChange = async () => {
        const courier_amount = $('#courierAmountInput').val()
        const pickup_amount = $('#pickupAmountInput').val()

        const result = await salesRest.save({
            id: dataLoaded.id,
            courier_amount,
            pickup_amount
        })

        if (!result) return
        setDataLoaded(result.data)
        $(gridRef.current).dxDataGrid('instance').refresh()
    }

    const handleApplyDiscount = async () => {
        const result = await salesRest.save({
            id: dataLoaded.id,
            amount_discount: discountAmount
        })
        if (!result) return
        setDataLoaded(result.data)
        $(gridRef.current).dxDataGrid('instance').refresh()
        setEditingDiscount(false)
    }

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

    const loadedPhone = dataLoaded?.phone.clean('0-9').startsWith('51')
        ? dataLoaded?.phone.clean('0-9')
        : `51${dataLoaded?.phone.clean('0-9')}`

    const finalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const onUpsellSubmit = async (e) => {
        e.preventDefault()
        const cleanCart = cart.filter(item => item.quantity > 0)
        if (cleanCart.length == 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No hay productos en el upsell',
                text: 'Debe agregar al menos un producto al upsell'
            })
            return
        }
        const { isConfirmed } = await Swal.fire({
            title: '¿Confirmar Upsell?',
            text: 'Por favor asegúrate que el cliente haya realizado el pago correspondiente antes de guardar este upsell. Esta acción no se puede revertir.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Si, he confirmado el pago',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33'
        })

        if (!isConfirmed) return

        const result = await salesRest.upsell({
            id: dataLoaded.id,
            items: cleanCart.map(item => ({
                id: item.id,
                quantity: item.quantity,
                name: item.name,
                price: item.price,
                colors: item.colors
            }))
        })

        if (!result) return

        setDataLoaded(result.data)
        $(gridRef.current).dxDataGrid('instance').refresh()
        $(upsellModalRef.current).modal('hide')
    }

    const onFormulaSubmit = async (e) => {
        e.preventDefault()
        const result = await userFormulasRest.save({ ...selectedFormula, email: dataLoaded?.email })
        if (!result?.data) return
        setSelectedFormula(null)
        onRefresh(dataLoaded.id)
    }

    useEffect(() => {
        if (!selectedFormula) $(formulaModalRef.current).modal('hide')
        else $(formulaModalRef.current).modal('show')
    }, [selectedFormula])

    useEffect(() => {
        setDiscountAmount(dataLoaded?.amount_discount)
    }, [dataLoaded?.amount_discount])

    useEffect(() => {
        $(upsellModalRef.current).on('shown.bs.modal', () => {
            setCart(items.filter(({ is_default }) => is_default).map(item => {
                return {
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    colors: [],
                    quantity: 0
                }
            }))
        })

        return () => {
            $(upsellModalRef.current).off('shown.bs.modal')
        }
    }, [])

    return <>
        <Modal modalRef={modalRef} title={`Pedido #${Global.APP_CORRELATIVE}-${dataLoaded?.code}`} size='xl' bodyStyle={{
            backgroundColor: '#ebeff2'
        }} hideButtonSubmit onClose={() => { setEditingDiscount(false) }}>
            <div className="row">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header p-2">
                            <h5 className="card-title mb-0">Detalles de Venta</h5>
                        </div>
                        <div className="card-body p-2">
                            <table id='table-info' className="table table-borderless table-sm">
                                <tbody>
                                    <tr>
                                        <th>Nombres:</th>
                                        <td>{dataLoaded?.name} {dataLoaded?.lastname}</td>
                                    </tr>
                                    <tr>
                                        <th>Email:</th>
                                        <td>{dataLoaded?.email}</td>
                                    </tr>
                                    <tr>
                                        <th>Teléfono:</th>
                                        <td>
                                            <div className="d-flex gap-1 align-items-center">
                                                <img className='avatar-sm rounded-circle'
                                                    src={`${Global.WA_URL}/api/profile/${Global.APP_CORRELATIVE}/${loadedPhone}`}
                                                    onError={(e) => {
                                                        e.target.onerror = null
                                                        e.target.src = `/api/admin/profile/thumbnail/undefined`;
                                                    }}
                                                    alt={dataLoaded?.name + ' ' + dataLoaded?.lastname} />
                                                <div>
                                                    <span className='d-block'>{dataLoaded?.phone}</span>
                                                    <a href={`//wa.me/${loadedPhone}`} target='_blank'>
                                                        <small>Abrir WhatsApp <i className='mdi mdi-arrow-top-right'></i></small>
                                                    </a>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>Dirección:</th>
                                        <td>{dataLoaded?.address} {dataLoaded?.number}
                                            <small className='text-muted d-block'>{dataLoaded?.province ?? dataLoaded?.district}, {dataLoaded?.department}, {dataLoaded?.country} {dataLoaded?.zip_code && <>- {dataLoaded?.zip_code}</>}</small>
                                        </td>
                                    </tr>
                                    {
                                        dataLoaded?.reference &&
                                        <tr>
                                            <th>Referencia:</th>
                                            <td>{dataLoaded?.reference}</td>
                                        </tr>
                                    }
                                    {
                                        dataLoaded?.comment &&
                                        <tr>
                                            <th>Comentario:</th>
                                            <td>{dataLoaded?.comment}</td>
                                        </tr>
                                    }
                                    {
                                        (dataLoaded?.billing_type && dataLoaded?.billing_number) &&
                                        <tr>
                                            <th>Comprobante:</th>
                                            <td>
                                                <b className='d-block'>{dataLoaded.billing_type.toTitleCase()}</b>
                                                <small>
                                                    <code className='me-1'>{dataLoaded.billing_type == 'boleta' ? 'DNI' : 'RUC'}</code>
                                                    <span>{dataLoaded?.billing_number}</span>
                                                </small>
                                            </td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                            <button className='btn btn-xs btn-dark' type='button' copy={`Nombres: ${dataLoaded?.fullname}\nEmail: ${dataLoaded?.email}\nTeléfono: ${dataLoaded?.phone}\nDirección: ${dataLoaded?.address} ${dataLoaded?.number}${dataLoaded?.zip_code ? `\nCódigo Postal: ${dataLoaded?.zip_code}` : ''}\nUbicación: ${dataLoaded?.province ?? dataLoaded?.district}, ${dataLoaded?.department}, ${dataLoaded?.country}${dataLoaded?.reference ? `\nReferencia: ${dataLoaded?.reference}` : ''}${dataLoaded?.comment ? `\nComentario: ${dataLoaded?.comment}` : ''}${(dataLoaded?.billing_type && dataLoaded?.billing_number) ? `\nComprobante: ${dataLoaded.billing_type.toTitleCase()}\n${dataLoaded.billing_type == 'boleta' ? 'DNI' : 'RUC'}: ${dataLoaded?.billing_number}` : ''}`}>
                                <i className='mdi mdi-content-copy me-1'></i>
                                Copiar
                            </button>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header p-2">
                            <h5 className="card-title mb-0">Artículos</h5>
                        </div>
                        <div className="card-body p-2 table-responsive">
                            <table className="table table-striped table-bordered table-sm table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Colores</th>
                                        <th>Precio</th>
                                        <th>Cantidad</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        dataLoaded?.details?.map((detail, index) => {
                                            const quantity = (detail.quantity * 100) / 100
                                            const totalPrice = detail.price * detail.quantity
                                            return <tr key={index}>
                                                <td>
                                                    <span className='d-block'>{detail.name}</span>
                                                    {
                                                        (detail.user_formula_id && detail.user_formula_id != dataLoaded.user_formula_id) &&
                                                        <Tippy content={<UserFormulaInfo name={dataLoaded?.name} details={dataLoaded?.details} formula={detail.user_formula} setSelectedFormula={setSelectedFormula} />} allowHTML interactive>
                                                            <small className='text-muted'>
                                                                <i className='mdi mdi-flask me-1'></i>
                                                                Fórmula secundaria
                                                            </small>
                                                        </Tippy>
                                                    }
                                                </td>
                                                <td>
                                                    {
                                                        detail?.colors?.map((color, index) => {
                                                            return <Tippy key={index} content={color.name}>
                                                                <i className='mdi mdi-circle' style={{
                                                                    color: color.hex,
                                                                    WebkitTextStroke: '1px #808080'
                                                                }}></i>
                                                            </Tippy>
                                                        })
                                                    }
                                                </td>
                                                <td align='right'>S/ {Number2Currency(detail.price)}</td>
                                                <td align='center'>{quantity}</td>
                                                <td align='right'>S/ {Number2Currency(totalPrice)}</td>
                                            </tr>
                                        })
                                    }
                                </tbody>
                            </table>
                            {
                                (dataLoaded?.upsells?.length || 0) == 0 &&
                                <Tippy content="Agregar items">
                                    <button type="button" className="btn btn-xs btn-primary mt-2" onClick={() => $(upsellModalRef.current).modal('show')}>
                                        <i className="mdi mdi-plus-circle me-1"></i>
                                        Upsell
                                    </button>
                                </Tippy>
                            }
                        </div>
                    </div>

                    {
                        dataLoaded?.upsells?.length > 0 &&
                        <div className="card">
                            <div className="card-header p-2">
                                <h5 className="card-title mb-0">Upsells</h5>
                            </div>
                            <div className="card-body p-2 table-responsive">
                                <table className="table table-striped table-bordered table-sm table-hover mb-0">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Colores</th>
                                            <th>Precio</th>
                                            <th>Cantidad</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            dataLoaded?.upsells?.map((upsell, index) => {
                                                const quantity = (upsell.quantity * 100) / 100
                                                const totalPrice = upsell.price * upsell.quantity
                                                return <tr key={index}>
                                                    <td>{upsell.name}</td>
                                                    <td>
                                                        {
                                                            upsell?.colors?.map((color, index) => {
                                                                return <Tippy key={index} content={color.name}>
                                                                    <i className='mdi mdi-circle' style={{
                                                                        color: color.hex,
                                                                        WebkitTextStroke: '1px #808080'
                                                                    }}></i>
                                                                </Tippy>
                                                            })
                                                        }
                                                    </td>
                                                    <td align='right'>S/ {Number2Currency(upsell.price)}</td>
                                                    <td align='center'>{quantity}</td>
                                                    <td align='right'>S/ {Number2Currency(totalPrice)}</td>
                                                </tr>
                                            })
                                        }
                                    </tbody>
                                </table>
                                {
                                    (dataLoaded?.upsells?.length || 0) == 0 &&
                                    <Tippy content="Agregar items">
                                        <button type="button" className="btn btn-xs btn-primary mt-2" onClick={() => $(upsellModalRef.current).modal('show')}>
                                            <i className="mdi mdi-plus-circle me-1"></i>
                                            Upsell
                                        </button>
                                    </Tippy>
                                }
                            </div>
                        </div>
                    }

                    <div className="card">
                        <div className="card-header p-2">
                            <h5 className="card-title mb-0">Resumen</h5>
                        </div>
                        <div className="card-body p-2">
                            <div className="d-flex justify-content-between">
                                <b>Subtotal:</b>
                                <span>S/ {Number2Currency(dataLoaded?.amount)}</span>
                            </div>
                            {/* {
                                dataLoaded?.amount_discount > 0 && */}
                            <div className="d-flex justify-content-between">
                                <b>Descuento interno:</b>
                                {
                                    editingDiscount
                                        ? <div className="input-group input-group-sm" style={{ width: '180px' }}>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                value={discountAmount}
                                                step={0.01}
                                                onChange={(e) => setDiscountAmount(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.stopPropagation();
                                                        handleApplyDiscount();
                                                    }
                                                }}
                                            />
                                            <button
                                                className="btn btn-sm btn-danger"
                                                type="button"
                                                onClick={() => {
                                                    setEditingDiscount(false)
                                                    setDiscountAmount(dataLoaded?.amount_discount ?? 0)
                                                }}
                                            >
                                                <i className="mdi mdi-close" />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                type="button"
                                                onClick={() => handleApplyDiscount()}
                                            >
                                                <i className="mdi mdi-check" />
                                            </button>
                                        </div>
                                        : <div>
                                            {
                                                !dataLoaded?.checkout_charge_id &&
                                                <a href="#" className="me-1" onClick={(e) => {
                                                    e.preventDefault(); setEditingDiscount(true)
                                                }}>Modificar</a>
                                            }
                                            <span>S/ {Number2Currency(dataLoaded?.amount_discount)}</span>
                                        </div>
                                }
                            </div>
                            {/* } */}
                            <div className="d-flex justify-content-between">
                                <b>Envío:</b>
                                <span>{
                                    dataLoaded?.delivery === null ?
                                        'Pago en destino' :
                                        <>S/ {Number2Currency(dataLoaded?.delivery)}</>
                                }
                                </span>
                            </div>
                            {
                                dataLoaded?.bundle_discount > 0 &&
                                <div className="d-flex justify-content-between">
                                    <b>
                                        Descuento x paquete:
                                        {dataLoaded?.bundle && (
                                            <small className="d-block text-muted" style={{ fontWeight: "lighter" }}>
                                                Elegiste {dataLoaded?.bundle?.name} (-{(dataLoaded?.bundle?.percentage * 10000) / 100}%)
                                            </small>
                                        )}
                                    </b>
                                    <span>S/ -{Number2Currency(Math.round(dataLoaded?.bundle_discount * 10) / 10, 2)}</span>
                                </div>
                            }
                            {dataLoaded?.renewal && (
                                <div className="d-flex justify-content-between">
                                    <b>
                                        Subscripción:
                                        <small className="d-block text-muted" style={{ fontWeight: "lighter" }}>
                                            {dataLoaded?.renewal?.name} (-{(dataLoaded?.renewal?.percentage * 10000) / 100}%)
                                        </small>
                                    </b>
                                    <span>S/ -{Number2Currency(dataLoaded?.renewal_discount)}</span>
                                </div>
                            )}
                            {dataLoaded?.coupon && (
                                <div className="d-flex justify-content-between">
                                    <b>
                                        Cupón aplicado:
                                        <small className="d-block text-muted" style={{ fontWeight: "lighter" }}>
                                            {dataLoaded?.coupon?.name} (-{(dataLoaded?.coupon?.amount * 100) / 100}%)
                                        </small>
                                    </b>
                                    <span>S/ -{Number2Currency(dataLoaded?.coupon_discount)}</span>
                                </div>
                            )}
                            <hr className='my-2' />
                            <div className="d-flex justify-content-between">
                                <b>Total:</b>
                                <span>
                                    <strong>S/ {Number2Currency(dataLoaded?.total_amount)}</strong>
                                </span>
                            </div>
                            {
                                dataLoaded?.upsell_amount > 0 &&
                                <div className="d-flex justify-content-between">
                                    <b>Upsells:</b>
                                    <strong>S/ {Number2Currency(dataLoaded?.upsell_amount)}</strong>
                                </div>
                            }
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card">
                        <div className="card-header p-2">
                            <h5 className="card-title mb-0">Formula principal</h5>
                        </div>
                        <div className="card-body p-2">
                            <UserFormulaInfo name={dataLoaded?.name} details={dataLoaded?.details} formula={dataLoaded?.formula} setSelectedFormula={setSelectedFormula} />
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header p-2">
                            <h5 className="card-title mb-0">Fecha y Origen</h5>
                        </div>
                        <div className="card-body p-2">
                            <div className="row">
                                <InputFormGroup label='Fecha de venta' type="date" value={dataLoaded?.sale_date} onChange={onSaleDateChange} col='col-md-6' />
                                <SelectFormGroup label='Origen de venta' value={dataLoaded?.origin_id} col='col-md-6' onChange={onOriginChange} minimumResultsForSearch={-1}>
                                    {
                                        origins.map((origin, index) => {
                                            return <option key={index} value={origin.id}>{origin.name}</option>
                                        })
                                    }
                                </SelectFormGroup>
                                {/* <div className="form-group">
                                    <label htmlFor="originSelect" className="form-label">Orígen de venta</label>
                                    <select className="form-select" id="originSelect" value={dataLoaded?.origin_id} onChange={onStatusChange}>
                                        {
                                            origins.map((origin, index) => {
                                                return <option key={index} value={origin.id}>{origin.name}</option>
                                            })
                                        }
                                    </select>
                                </div> */}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header p-2">
                            <h5 className="card-title mb-0">Estado</h5>
                        </div>
                        <div className="card-body p-2">
                            <div className="">
                                <label htmlFor="statusSelect" className="form-label">Estado Actual</label>
                                <select className="form-select" id="statusSelect" value={dataLoaded?.status_id} onChange={onStatusChange} disabled={!dataLoaded?.status?.reversible}>
                                    {
                                        statuses.map((status, index) => {
                                            return <option key={index} value={status.id} data-confirm={!!status.confirm}>{status.name}</option>
                                        })
                                    }
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header p-2 d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0">Enviado por</h5>
                            <button className='btn btn-success btn-xs pull-rigth' disabled={!dataLoaded?.status?.reversible} type='button' onClick={() => onDeliveryChange()}>Guardar</button>
                        </div>
                        <div className="card-body p-2">
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group mb-2">
                                        <label htmlFor="pickupSelect" className="form-label">Agencia de recojo</label>
                                        <select className="form-select" id="pickupSelect" value={dataLoaded?.pickup ?? ''} onChange={onPickupChange} disabled={!dataLoaded?.status?.reversible}>
                                            <option value="">- Selecciona -</option>
                                            <option value="Kamary">Kamary</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="pickupAmountInput" className='form-label'>Costo de recojo</label>
                                        <div className='input-group'>
                                            <span className='input-group-text'>S/</span>
                                            <input type="number" className="form-control" id="pickupAmountInput" disabled={!dataLoaded?.status?.reversible} />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group mb-2">
                                        <label htmlFor="courierSelect" className="form-label">Agencia de envío</label>
                                        <select className="form-select" id="courierSelect" value={dataLoaded?.courier ?? ''} onChange={onCourierChange} disabled={!dataLoaded?.status?.reversible}>
                                            <option value="">- Selecciona -</option>
                                            <option value="Kamary">Kamary</option>
                                            <option value="Olva">Olva</option>
                                            <option value="Shalom">Shalom</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="courierAmountInput" className='form-label'>Costo de envío</label>
                                        <div className='input-group'>
                                            <span className='input-group-text'>S/</span>
                                            <input type="number" className="form-control" id="courierAmountInput" step={0.01} disabled={!dataLoaded?.status?.reversible} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header p-2">
                            <h5 className="card-title mb-0">Cambios de Estado</h5>
                        </div>
                        <div className="card-body p-2 d-flex flex-column gap-1" style={{
                            maxHeight: '300px',
                            overflowY: 'auto'
                        }}>
                            {
                                saleStatuses?.map((ss, index) => {
                                    const fullname = (`${ss.user?.name || ''} ${ss.user?.lastname || ''}`).trim() || 'Automático'
                                    return <article key={index} className="border py-1 px-2 ms-3" style={{
                                        position: 'relative',
                                        borderRadius: '16px 4px 4px 16px',
                                        backgroundColor: ss.status.color ? `${ss.status.color}2e` : '#3333332e',
                                    }}>
                                        <i className='mdi mdi-circle left-2' style={{
                                            color: ss.status.color || '#333',
                                            position: 'absolute',
                                            left: '-25px',
                                            top: '50%',
                                            transform: 'translateY(-50%)'
                                        }}></i>
                                        <b style={{ color: ss.status.color || '#333' }}>{ss?.status?.name}</b>
                                        <small className='d-block text-truncate'>{fullname}</small>
                                        <small className='d-block text-muted'>{moment(ss.created_at).format('YYYY-MM-DD HH:mm')}</small>
                                    </article>
                                })
                            }
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
        <Modal modalRef={upsellModalRef} title="Agrega items a la venta" size="lg" zIndex={1060} onSubmit={onUpsellSubmit}>
            <div className="product-selection mb-1">
                <div className="row">
                    {items?.map((product) => {
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
                                <td className="text-end">
                                    <input
                                        type="number"
                                        className="form-control form-control-sm text-end"
                                        value={detail.price}
                                        onChange={(e) => {
                                            const newCart = [...cart];
                                            const item = newCart[index];
                                            item.price = parseFloat(e.target.value) || 0;
                                            setCart(newCart);
                                        }}
                                        step={0.01}
                                        style={{ width: "100px", display: "inline" }}
                                    />
                                </td>
                                <td className="text-end">S/ {(detail.price * detail.quantity).toFixed(2)}</td>
                            </tr>
                        })}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={4} className="text-end">Total:</td>
                            <td className="text-end">S/ {Number2Currency(Math.round(finalPrice * 10) / 10)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </Modal>
        <Modal modalRef={formulaModalRef} title="Editar fórmula" zIndex={1060} onClose={() => setSelectedFormula(null)} onSubmit={onFormulaSubmit}>
            <RadioFormGroup
                label="1. ¿Tu cabello ha recibido algún tipo de tratamiento?"
                name='has_treatment'
                value={selectedFormula?.has_treatment}
                options={hasTreatment.map(({ id, description }) => ({ value: id, label: description }))}
                onChange={(value) => setSelectedFormula(old => ({ ...old, has_treatment: value }))}
                uppercase
            />
            <RadioFormGroup
                label="2. Tu cuero cabelludo es:"
                name='scalp_type'
                value={selectedFormula?.scalp_type}
                options={scalpType.map(({ id, description }) => ({ value: id, label: description }))}
                onChange={(value) => setSelectedFormula(old => ({ ...old, scalp_type: value }))}
                uppercase
            />
            <RadioFormGroup
                label="3. Naturalmente ¿Cuál es tu tipo de cabello?"
                name='hair_type'
                value={selectedFormula?.hair_type}
                options={hairType.map(({ id, description }) => ({ value: id, label: description }))}
                onChange={(value) => setSelectedFormula(old => ({ ...old, hair_type: value }))}
                uppercase
            />
            <RadioFormGroup
                label="4. ¿Cuál crees que es el grosor de tu cabello?"
                name='hair_thickness'
                value={selectedFormula?.hair_thickness}
                options={hairThickness.map(({ id, description }) => ({ value: id, label: description }))}
                onChange={(value) => setSelectedFormula(old => ({ ...old, hair_thickness: value }))}
                uppercase
            />
            <RadioMultipleFormGroup
                label="5. ¿Qué quieres lograr con tu cabello?"
                name='hair_goals'
                value={selectedFormula?.hair_goals}
                options={hairGoals.map(({ id, description }) => ({ value: id, label: description }))}
                onChange={(value) => setSelectedFormula(old => ({ ...old, hair_goals: value }))}
                maxSelected={3}
                uppercase
            />
            <RadioFormGroup
                className='mb-0'
                label="6. Elige la fragancia de tu rutina"
                name='fragrance'
                value={selectedFormula?.fragrance}
                options={fragrances.map(({ id, name }) => ({ value: id, label: name }))}
                onChange={(value) => setSelectedFormula(old => ({ ...old, fragrance: value }))}
                uppercase
            />
        </Modal>
    </>
}

export default SaleDetailModal