import { createRoot } from 'react-dom/client';
import Base from './Components/Tailwind/Base';
import CreateReactScript from './Utils/CreateReactScript';
import { useEffect, useState, useRef } from 'react';
import SalesRest from './Actions/Seller/sales-rest';
import Number2Currency from './Utils/Number2Currency';
import ArrayJoin from './Utils/ArrayJoin';
import buildSchedule from './Utils/buildSchedule';
import Tippy from '@tippyjs/react';
import Swal from 'sweetalert2';

const salesRest = new SalesRest()

const CustomDropdown = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative text-sm w-full max-w-56" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 border rounded-lg bg-white text-left w-full max-w-56 flex justify-between items-center"
      >
        {options.find(opt => opt.value === value)?.label || placeholder}
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <ul className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg text-sm">
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="px-4 py-2.5 hover:bg-gray-100 cursor-pointer"
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const SkeletonRow = () => (
  <tr className="border-t">
    <td className="py-6 px-4">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
    </td>
    <td className="py-6 px-4">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
    </td>
    <td className="py-6 px-4">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-1"></div>
      <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
    </td>
    <td className="py-6 px-4">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
    </td>
    <td className="py-6 px-4">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
    </td>
    <td className="py-6 px-4">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
    </td>
  </tr>
);

// Modal component for sale details
const SaleDetailModal = ({ sale, onClose, onConfirmClicked, onRejectClicked, onMarkReadyClicked }) => {
  useEffect(() => {
    // Disable body scroll when modal opens
    document.body.style.overflow = 'hidden';
    // Re-enable on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!sale) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto p-6 space-y-6 relative" onClick={e => e.stopPropagation()}>
        {/* Close button */}

        <div className="flex items-center justify-between gap-4">
          <Tippy content='Cerrar modal'>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              aria-label="Cerrar"
            >
              <i className="mdi mdi-close text-lg"></i>
            </button>
          </Tippy>
          <div className='flex-1'>
            <h2 className="text-lg font-semibold">Pedido #MS{String(sale.id).padStart(8, '0')}</h2>
            <span className='block text-silver'>{new Date(sale.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')}</span>
          </div>
          <div className='flex flex-wrap gap-2 justify-end'>
            <div className="p-2 border bg-gray-50 text-xs rounded-full w-max text-center">
              {sale.status.name}
            </div>
            {
              (sale.status_id === 'f47ac10b-58cc-11ef-8f8e-0242ac120002' && sale.billing === 'seller') &&
              <>
                <Tippy content='Confirmar pedido'>
                  <button className='py-1 px-3 bg-[#10c469] bg-opacity-10 hover:bg-opacity-100 text-[#10c469] hover:text-white rounded-lg'
                    onClick={() => onConfirmClicked(sale.id)} >
                    <i className='mdi mdi-check' />
                  </button>
                </Tippy>
                <Tippy content='Rechazar pedido'>
                  <button className='py-1 px-3 bg-[#ff5b5b] bg-opacity-10 hover:bg-opacity-100 text-[#ff5b5b] hover:text-white rounded-lg'
                    onClick={() => onRejectClicked(sale.id)}>
                    <i className='mdi mdi-close' />
                  </button>
                </Tippy>
              </>
            }
          </div>
        </div>
        <div className='border rounded-xl p-6'>
          <h4 className='font-semibold mb-4'>Tienda de recojo</h4>
          <div>
            <div className="w-full flex items-center justify-between gap-4 mb-2">
              <span className='w-10 h-10 bg-[#F3F4F6] rounded-xl flex items-center justify-center'>
                <i className='mdi mdi-store text-silver'></i>
              </span>
              <div className='flex-1'>
                <h4 className='mb-0'>{sale.delivery_point_name}</h4>
                <span className='block text-silver text-sm'>{sale.delivery_point_district}, {sale.delivery_point_department}</span>
              </div>
            </div>
            <ul className='text-silver text-sm grid gap-1'>
              <li>
                <i className='mdi mdi-map-marker-outline me-1' />
                <span>{sale.delivery_point_address} {sale.delivery_point_number} {sale.delivery_point_reference && `(${sale.delivery_point_reference})`}</span>
              </li>
              <li>
                <i className='mdi mdi-clock-outline me-1' />
                <span>{buildSchedule(sale.delivery_point_opening_hours)}</span>
              </li>
            </ul>
          </div>
          <div className='mt-4 text-sm'>
            <span className='text-silver'>Lo recoge:</span> {sale.customer.fullname}
          </div>
          {
            sale.status_id == 'f47ac20c-58cc-11ef-8f8e-0242ac120002' &&
            <Tippy content='Marcar como listo para recojo'>
              <button
                className='py-2 px-4 mt-4 bg-blue-500 bg-opacity-10 hover:bg-opacity-100 text-blue-500 hover:text-white rounded-lg text-sm'
                onClick={() => onMarkReadyClicked(sale.id)}
              >
                <i className='mdi mdi-package-variant me-1'></i>
                Marcar como listo para recojo
              </button>
            </Tippy>
          }
          {
            sale.status_id == 'f47ac30d-58cc-11ef-8f8e-0242ac120002' &&
            sale.ready_for_pickup_at && (
              <div className="mt-3 inline-flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                <i className="mdi mdi-check-circle-outline" />
                <span>Dejado en punto de entrega el {new Date(sale.ready_for_pickup_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')} a las {new Date(sale.ready_for_pickup_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )
          }
        </div>

        <div className='border rounded-xl p-6'>
          <h4 className='font-semibold mb-4'>Cartas en este pedido</h4>
          <div className='space-y-4'>
            {
              sale.details.map((detail, index) => {
                return <>
                  {index > 0 && <hr />}
                  <div key={detail.id} className="flex gap-3">
                    <img
                      src={`//assets.tcgdex.net/${detail.item.card.language.code}/${detail.item.card.expansion.serie.code}/${detail.item.card.expansion.code}/${detail.item.card.code.split('-')[1]}/low.webp`}
                      alt={detail.item.card.fullname}
                      className="w-20 aspect-[3/4] object-cover rounded"
                      onError={(e) => { e.target.src = '/images/default/card.png'; }}
                    />
                    <div className="flex-1">
                      <p className="font-bold mb-1">{detail.item.card.fullname}</p>
                      <p className="text-silver text-sm mb-1">{detail.item.card.expansion.code.toUpperCase()}: {detail.item.card.expansion.name}</p>
                      <p className='block text-sm px-3 py-1 bg-gray-50 w-max rounded-full text-silver mb-2'>{detail.condition}</p>
                      <p className='block text-sm '>Variante: {detail.variant ?? 'Normal'}</p>
                    </div>
                    <div className="">
                      <div className="h-full flex flex-col items-end justify-between">
                        <p className="font-medium text-lg">S/ {Number2Currency(detail.price * detail.quantity)}</p>
                      </div>
                    </div>
                  </div>
                </>
              })
            }
          </div>
        </div>

        <div className='border rounded-xl p-6 space-y-6'>
          <h4 className='font-bold text-lg'>Resumen del pedido</h4>
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <span className='block text-sm'>Subtotal ({sale.details_count} cartas)</span>
              <span className='block'>S/ {Number2Currency(sale.total_amount)}</span>
            </div>
            <div className='flex justify-between'>
              <span className='block text-sm'>Protección y procesamiento</span>
              <span className='block'>S/ {Number2Currency(0)}</span>
            </div>
          </div>
          <hr />
          <div className='flex justify-between'>
            <span className='block font-medium'>Total pagado</span>
            <span className='block text-2xl font-semibold text-primary'>S/ {Number2Currency(sale.total_amount)}</span>
          </div>
          {sale.receipt && (
            <div className='flex justify-end'>
              <a
                href={`/storage/images/receipts/${sale.receipt}`}
                target='_blank'
                rel='noopener noreferrer'
                className='text-sm text-primary underline hover:text-primary-dark'
              >
                Ver comprobante
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Sales = ({ statuses }) => {

  const [sales, setSales] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [loadingSales, setLoadingSales] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [selectedSale, setSelectedSale] = useState(null)
  const searchTimeoutRef = useRef(null)

  // Fetch data immediately when currentPage or selectedStatus changes
  useEffect(() => {
    fetchSales(false);
  }, [currentPage, selectedStatus]);

  // Fetch data with delay only when searchTerm changes
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set a new timeout to delay the search by 1 second
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1); // Reset to page 1 when search changes
      fetchSales(true);
    }, 1000);

    // Cleanup timeout on unmount or when searchTerm changes
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Reset page to 1 when status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus]);

  const fetchSales = (isSearch = false) => {
    setLoadingSales(true);
    const pageSize = 10;
    const skip = (currentPage - 1) * pageSize;
    const filter = [];
    if (searchTerm) filter.push([
      ['card.fullname', 'contains', searchTerm], 'or',
      ['id', 'contains', searchTerm]
    ]);
    if (selectedStatus) filter.push(['status_id', '=', selectedStatus]);
    salesRest.paginate({
      filter: ArrayJoin(filter, 'and'),
      skip, take: pageSize,
      requireTotalCount: true
    }).then(data => {
      setSales(data.data || []);
      setTotalPages(Math.ceil((data.totalCount || 0) / pageSize));
      setLoadingSales(false);
    }).catch(() => setLoadingSales(false));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          disabled={i === currentPage}
          className={`text-sm w-10 h-10 rounded-lg shadow ${i === currentPage ? 'bg-primary text-white' : 'bg-white'}`}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  const openSaleDetail = (sale) => {
    setSelectedSale(sale);
  };

  const closeSaleDetail = () => {
    setSelectedSale(null);
  };

  const onConfirmClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Confirmar pedido?',
      text: 'Esta acción es irreversible. Asegúrese de que el pago ha sido confirmado y el monto aparece en su cuenta.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar'
    });

    if (!isConfirmed) return

    const result = await salesRest.save({ id, status_id: 'f47ac20c-58cc-11ef-8f8e-0242ac120002' });
    if (!result) return

    fetchSales();
    closeSaleDetail();
  }

  const onRejectClicked = async (id) => {
    const { value: reject_reason } = await Swal.fire({
      title: '¿Rechazar pedido?',
      text: 'Esta acción es irreversible. Por favor, indique el motivo del rechazo.',
      input: 'textarea',
      inputPlaceholder: 'Escriba el motivo del rechazo...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, rechazar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debe ingresar un motivo para rechazar';
        }
      }
    });

    if (!reject_reason) return

    const result = await salesRest.save({ id, status_id: 'f47ac50f-58cc-11ef-8f8e-0242ac120002', reject_reason });
    if (!result) return

    fetchSales();
    closeSaleDetail();
  }

  const onMarkReadyClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Marcar como listo para recojo?',
      text: 'Esta acción es irreversible. Asegúrese de que el pedido está listo para ser recogido.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, marcar como listo',
      cancelButtonText: 'Cancelar'
    });

    if (!isConfirmed) return

    const result = await salesRest.save({ id, status_id: 'f47ac30d-58cc-11ef-8f8e-0242ac120002' });
    if (!result) return

    fetchSales();
    closeSaleDetail();
  }

  return <>
    <section className="w-full bg-[#EFF3F5] py-12 sm:py-16">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6`}>
        <div>
          <h4 className='text-lg font-bold mb-1'>Mi pedidos</h4>
          <p className=''>Revisa tu historial de compras y rastrea tus órdenes.</p>
        </div>

        <div className='flex flex-wrap gap-4 items-center justify-between bg-white p-6 rounded-xl'>
          <input
            type='text'
            placeholder='Buscar por carta o ID de pedido...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='px-4 py-2.5 border rounded-lg bg-white text-sm w-full max-w-80 outline-none'
          />
          <div className='flex flex-wrap gap-4 flex-1 justify-end'>
            <CustomDropdown
              options={[{ value: null, label: 'Todos los estados' }, ...statuses.map(({ id, name }) => ({ value: id, label: name }))]}
              value={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="Todos los estados"
            />
          </div>
        </div>
        {/* Responsive wrapper for horizontal scroll on mobile */}
        <div className="w-full overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-[640px] sm:min-w-full rounded-xl bg-white">
            <thead className='bg-[#E8F5FF] rounded-t-xl'>
              <tr>
                <td className='py-4 px-6 font-semibold'>ID de pedido</td>
                <td className='py-4 px-6 font-semibold'>Fecha</td>
                <td className='py-4 px-6 font-semibold'>Cartas</td>
                <td className='py-4 px-6 font-semibold'>Total</td>
                <td className='py-4 px-6 font-semibold'>Estado</td>
                <td className='py-4 px-6 font-semibold'>Acciones</td>
              </tr>
            </thead>
            <tbody>
              {loadingSales ? (
                // Show 5 skeleton rows while loading
                Array.from({ length: 5 }).map((_, index) => (
                  <SkeletonRow key={index} />
                ))
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-24 px-4 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center h-64">
                      <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium">No hay ventas</p>
                      <p className="text-sm">No se encontraron pedidos con los filtros seleccionados.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sales.map((sale, index) => {
                  const firstCard = sale.details?.[0]?.card?.fullname;
                  const itemsCount = sale.details_count || 0;
                  const otherCards = itemsCount - 1
                  return <tr className={index > 0 && 'border-t'} key={sale.id}>
                    <td className='py-6 px-4 text-primary font-medium'>
                      <span className='cursor-pointer' onClick={() => openSaleDetail(sale)}>#MS{String(sale.id).padStart(8, '0')}</span>
                    </td>
                    <td className='py-6 px-4 text-sm text-silver'>{new Date(sale.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')}</td>
                    <td className='py-6 px-4'>
                      <span className='block text-sm' style={{ whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                        {firstCard} {itemsCount > 1 && <>+ {otherCards} más</>}
                      </span>
                      <small className='block text-silver text-xs'>{itemsCount} carta{itemsCount != 1 && 's'}</small>
                    </td>
                    <td className='py-6 px-4'>S/ {Number2Currency(sale.total_amount)}</td>
                    <td className='py-6 px-4'>
                      <div className='p-2 border text-xs rounded-full w-max text-center' style={{
                        backgroundColor: `${sale.status.hex}22`,
                        color: sale.status.hex
                      }}>
                        {sale.status.name}
                      </div>
                    </td>
                    <td className='py-6 px-4'>
                      <button
                        onClick={() => openSaleDetail(sale)}
                        className='text-primary underline'
                      >
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className='mt-8 flex flex-wrap justify-center gap-4'>
            <div className='flex justify-center gap-4'>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className='text-sm w-10 h-10 disabled:opacity-50'
              >
                <i className='mdi mdi-chevron-left'></i>
              </button>
              {renderPaginationButtons()}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className='text-sm w-10 h-10 disabled:opacity-50'
              >
                <i className='mdi mdi-chevron-right'></i>
              </button>
            </div>
            <div className="relative">
              <button
                onClick={() => { }}
                className='text-sm px-4 h-10 rounded-lg bg-white shadow flex items-center'
              >
                Página {currentPage}
                <i className='mdi mdi-chevron-down ms-2'></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
    {selectedSale && <SaleDetailModal sale={selectedSale} onClose={closeSaleDetail} onConfirmClicked={onConfirmClicked} onRejectClicked={onRejectClicked} onMarkReadyClicked={onMarkReadyClicked} />}
  </>;
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Base {...properties} title='Mis pedidos'>
      <Sales {...properties} />
    </Base>
  );
});
