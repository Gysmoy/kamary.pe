import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';

const number = (value, digits = 0) => Number(value || 0).toLocaleString('es-PE', {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
});

const money = (value) => Number(value || 0).toLocaleString('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const pct = (value) => `${number(value, 2)}%`;

const date = (value) => {
  if (!value) return '-';
  const normalized = value.length === 10 ? `${value}T00:00:00` : value;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('es-PE');
};

const clampPct = (value) => Math.max(0, Math.min(100, Number(value || 0)));

const stockStatusColor = {
  INFRASTOCK: 'danger',
  NORMOSTOCK: 'success',
  SOBRESTOCK: 'warning',
};

const sectionLinks = [
  { href: '#dashboard-summary', label: 'Resumen' },
  { href: '#dashboard-sales', label: 'Ventas' },
  { href: '#dashboard-stock', label: 'Stock' },
  { href: '#dashboard-dispatch', label: 'Despacho' },
  { href: '#dashboard-base', label: 'Base' },
];

const EmptyState = ({ text = 'Sin datos para el periodo.' }) => (
  <div className='text-center text-muted py-4'>{text}</div>
);

const ProgressBar = ({ value, color = 'primary' }) => (
  <div className='progress' style={{ height: 6 }}>
    <div className={`progress-bar bg-${color}`} style={{ width: `${clampPct(value)}%` }}></div>
  </div>
);

const StockBadge = ({ status }) => {
  const color = stockStatusColor[status] || 'secondary';
  return <span className={`badge badge-soft-${color}`}>{status || '-'}</span>;
};

const SectionHeader = ({ title, action = null, meta = null }) => (
  <div className='d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3'>
    <div>
      <h5 className='mb-0'>{title}</h5>
      {meta && <small className='text-muted'>{meta}</small>}
    </div>
    {action}
  </div>
);

const MetricTile = ({ label, value, hint, icon, color = 'primary' }) => (
  <div className='col-sm-6 col-xl-3 mb-3'>
    <div className='border rounded p-3 h-100'>
      <div className='d-flex justify-content-between align-items-start gap-2'>
        <div>
          <p className='text-muted mb-1'>{label}</p>
          <h4 className='mb-1'>{value}</h4>
          <small className='text-muted'>{hint}</small>
        </div>
        <div className={`avatar-sm bg-${color}-subtle rounded d-flex align-items-center justify-content-center flex-shrink-0`}>
          <i className={`${icon} fs-24 text-${color}`}></i>
        </div>
      </div>
    </div>
  </div>
);

const SummaryPanel = ({ summary = {} }) => (
  <div id='dashboard-summary' className='card h-100'>
    <div className='card-body'>
      <SectionHeader title='Resumen comercial' />
      <div className='row'>
        <MetricTile label='Ventas valor' value={money(summary.salesValue)} hint={`${summary.ordersCount || 0} operaciones`} icon='ti ti-cash' color='primary' />
        <MetricTile label='Ventas unidades' value={number(summary.salesUnits, 3)} hint='Productos comerciales' icon='ti ti-package' color='info' />
        <MetricTile label='Costo ventas' value={money(summary.salesCost)} hint='Costo comercial' icon='ti ti-receipt-2' color='warning' />
        <MetricTile label='Margen bruto' value={pct(summary.grossMarginPct)} hint={money(summary.grossProfit)} icon='ti ti-chart-line' color='success' />
      </div>
    </div>
  </div>
);

const DispatchOverview = ({ data = {} }) => {
  const delayReasons = data.delayReasons || [];

  return (
    <div className='card h-100'>
      <div className='card-body'>
        <SectionHeader
          title='Despacho'
          action={<a href='/admin/dispatch' className='btn btn-sm btn-outline-primary'>Ver despachos</a>}
        />
        <div className='d-flex justify-content-between align-items-end mb-2'>
          <div>
            <p className='text-muted mb-1'>Eficiencia</p>
            <h3 className='mb-0'>{pct(data.efficiencyPct)}</h3>
          </div>
          <span className='badge badge-soft-danger'>{number(data.delayedDelivered)} retrasos</span>
        </div>
        <ProgressBar value={data.efficiencyPct} color='success' />
        <div className='d-flex justify-content-between text-muted small mt-2 mb-3'>
          <span>{data.onTimeDelivered || 0} a tiempo</span>
          <span>{data.totalDelivered || 0} entregas</span>
        </div>
        <h6 className='mb-2'>Motivos de retraso</h6>
        {delayReasons.length === 0 ? <EmptyState text='Sin retrasos registrados.' /> : delayReasons.slice(0, 4).map(row => (
          <div key={`delay-reason-summary-${row.reason}`} className='mb-3'>
            <div className='d-flex justify-content-between mb-1'>
              <span>{row.reason}</span>
              <span>{pct(row.pct)}</span>
            </div>
            <ProgressBar value={row.pct} color='warning' />
          </div>
        ))}
      </div>
    </div>
  );
};

const WarehouseSales = ({ rows = [] }) => {
  const max = Math.max(1, ...rows.map(row => Number(row.salesValue || 0)));

  return (
    <div className='card h-100'>
      <div className='card-body'>
        <SectionHeader
          title='Ventas por almacen'
          action={<a href='/admin/reports/sales' className='btn btn-sm btn-outline-primary'>Ver reporte</a>}
        />
        {rows.length === 0 ? <EmptyState /> : rows.map(row => (
          <div key={`warehouse-sales-${row.warehouseId || row.warehouseName}`} className='mb-3 pb-2 border-bottom'>
            <div className='d-flex justify-content-between gap-3 mb-1'>
              <div>
                <strong>{row.warehouseName}</strong>
                <div className='text-muted small'>{number(row.units, 3)} unidades | {row.ordersCount} pedidos</div>
              </div>
              <div className='text-end'>
                <strong>{money(row.salesValue)}</strong>
                <div className='text-muted small'>Margen {pct(row.profitPct)}</div>
              </div>
            </div>
            <ProgressBar value={(Number(row.salesValue || 0) / max) * 100} />
          </div>
        ))}
      </div>
    </div>
  );
};

const Profitability = ({ data = {} }) => {
  const totals = data.totals || {};
  const productRows = data.productRows || [];
  const warehouseRows = data.warehouseRows || [];

  return (
    <div className='card h-100'>
      <div className='card-body'>
        <SectionHeader title='Rentabilidad por producto' action={<span className='badge badge-soft-primary'>Total almacenes</span>} />
        <div className='row mb-3'>
          <div className='col-md-4 mb-2'>
            <small className='text-muted d-block'>Venta</small>
            <strong>{money(totals.salesValue)}</strong>
          </div>
          <div className='col-md-4 mb-2'>
            <small className='text-muted d-block'>Costo</small>
            <strong>{money(totals.costValue)}</strong>
          </div>
          <div className='col-md-4 mb-2'>
            <small className='text-muted d-block'>Rentabilidad</small>
            <strong>{pct(totals.profitPct)}</strong>
          </div>
        </div>
        {productRows.length === 0 ? <EmptyState /> : (
          <div className='table-responsive mb-4' style={{ maxHeight: 360, overflowY: 'auto' }}>
            <table className='table table-sm align-middle mb-0'>
              <thead className='table-light' style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th>Producto</th>
                  <th className='text-end'>Precio venta</th>
                  <th className='text-end'>Precio costo</th>
                  <th className='text-end'>Diferencia</th>
                  <th className='text-end'>%</th>
                </tr>
              </thead>
              <tbody>
                {productRows.map(row => (
                  <tr key={`profit-product-${row.articleId}`}>
                    <td>
                      <strong>{row.articleCode}</strong>
                      <div className='text-muted small'>{row.articleName}</div>
                    </td>
                    <td className='text-end'>{money(row.avgSalePrice)}</td>
                    <td className='text-end'>{money(row.avgCostPrice)}</td>
                    <td className='text-end'>{money(row.profitValue)}</td>
                    <td className='text-end'>{pct(row.profitPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <h6 className='mb-2'>Resumen por almacen</h6>
        {warehouseRows.length === 0 ? <EmptyState text='Sin ventas por almacen.' /> : (
          <div className='table-responsive'>
            <table className='table table-sm align-middle mb-0'>
              <thead>
                <tr>
                  <th>Almacen</th>
                  <th className='text-end'>Venta</th>
                  <th className='text-end'>Costo</th>
                  <th className='text-end'>Rentabilidad</th>
                </tr>
              </thead>
              <tbody>
                {warehouseRows.map(row => (
                  <tr key={`profit-warehouse-${row.warehouseId || row.warehouseName}`}>
                    <td>{row.warehouseName}</td>
                    <td className='text-end'>{money(row.salesValue)}</td>
                    <td className='text-end'>{money(row.costValue)}</td>
                    <td className='text-end'>{pct(row.profitPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const StockByWarehouse = ({ rows = [] }) => (
  <div id='dashboard-stock' className='card'>
    <div className='card-body'>
      <SectionHeader
        title='Stock por almacen'
        meta='Estado por dias de cobertura: <15 infra, 15-30 normo, >30 sobre.'
        action={<a href='/admin/reports/inventory' className='btn btn-sm btn-outline-primary'>Ver inventario</a>}
      />
      {rows.length === 0 ? <EmptyState /> : rows.map(warehouse => (
        <div key={`stock-warehouse-${warehouse.warehouseId || warehouse.warehouseName}`} className='border rounded p-3 mb-3'>
          <div className='d-flex flex-wrap justify-content-between gap-2 mb-3'>
            <div>
              <h6 className='mb-1'>{warehouse.warehouseName}</h6>
              <small className='text-muted'>{warehouse.productCount} productos | Stock valorizado {money(warehouse.totalStockValue)}</small>
            </div>
            <div className='d-flex flex-wrap gap-2 align-items-start'>
              <span className='badge badge-soft-danger'>Infra {warehouse.statusSummary?.INFRASTOCK || 0}</span>
              <span className='badge badge-soft-success'>Normo {warehouse.statusSummary?.NORMOSTOCK || 0}</span>
              <span className='badge badge-soft-warning'>Sobre {warehouse.statusSummary?.SOBRESTOCK || 0}</span>
            </div>
          </div>
          <div className='table-responsive' style={{ maxHeight: 340, overflowY: 'auto' }}>
            <table className='table table-sm align-middle mb-0'>
              <thead className='table-light' style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th>Producto</th>
                  <th className='text-end'>Prom. mensual</th>
                  <th className='text-end'>Stock</th>
                  <th className='text-end'>Valorizado</th>
                  <th className='text-end'>Dias</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {(warehouse.products || []).map(product => (
                  <tr key={`stock-product-${warehouse.warehouseId}-${product.articleId}`}>
                    <td>
                      <strong>{product.articleCode}</strong>
                      <div className='text-muted small'>{product.articleName}</div>
                    </td>
                    <td className='text-end'>{number(product.avgMonthlyUnits, 3)}</td>
                    <td className='text-end'>{number(product.stock, 3)}</td>
                    <td className='text-end'>{money(product.stockValue)}</td>
                    <td className='text-end'>{product.coverageDays === null ? 'Sin rotacion' : number(product.coverageDays, 1)}</td>
                    <td><StockBadge status={product.stockStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DispatchDetail = ({ data = {} }) => {
  const recentRows = data.recentRows || [];

  return (
    <div id='dashboard-dispatch' className='card'>
      <div className='card-body'>
        <SectionHeader title='Detalle de despacho' action={<a href='/admin/dispatch' className='btn btn-sm btn-outline-primary'>Ver despachos</a>} />
        <div className='table-responsive'>
          <table className='table table-sm align-middle mb-0'>
            <thead>
              <tr>
                <th>Despacho</th>
                <th>Registro</th>
                <th>Solicitada</th>
                <th>Entrega</th>
                <th className='text-end'>Dif.</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {recentRows.length === 0 && (
                <tr><td colSpan='6' className='text-center text-muted py-3'>Sin entregas en el periodo.</td></tr>
              )}
              {recentRows.map(row => (
                <tr key={`dispatch-row-${row.id}-${row.orderCode}`}>
                  <td>
                    <strong>{row.code}</strong>
                    <div className='text-muted small'>{row.orderCode}</div>
                  </td>
                  <td>{date(row.registeredDate)}</td>
                  <td>{date(row.requestedDate)}</td>
                  <td>{date(row.deliveredDate)}</td>
                  <td className='text-end'>{row.delayDays}</td>
                  <td>{row.delayReason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CatalogMetrics = ({ rows = [] }) => {
  const readyMetrics = rows.filter(metric => metric.value !== null).length;

  return (
    <div id='dashboard-base' className='card'>
      <div className='card-body'>
        <SectionHeader title='Base operativa' action={<span className='badge badge-soft-secondary'>{readyMetrics}/{rows.length} metricas activas</span>} />
        <div className='row'>
          {rows.map(metric => (
            <div key={metric.key} className='col-xl-2 col-md-4 col-sm-6 mb-3'>
              <a href={metric.route} className='text-reset text-decoration-none'>
                <div className='border rounded p-3 h-100'>
                  <div className='d-flex justify-content-between align-items-start gap-2'>
                    <div>
                      <p className='text-muted mb-1'>{metric.label}</p>
                      <h5 className='mb-0'>{metric.value === null ? 'Pendiente' : number(metric.value)}</h5>
                    </div>
                    <i className={`${metric.icon} fs-22 text-${metric.color}`}></i>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DashboardHome = ({ catalogMetrics = [], salesDashboard = {} }) => {
  const period = salesDashboard.period || {};
  const summary = salesDashboard.summary || {};
  const dispatch = salesDashboard.dispatch || {};

  return (
    <div className='row'>
      <div className='col-12 mb-3'>
        <div className='card border-0 shadow-sm'>
          <div className='card-body'>
            <div className='d-flex flex-wrap justify-content-between align-items-center gap-3'>
              <div>
                <h4 className='mb-1'>Dashboard comercial</h4>
                <p className='text-muted mb-0'>{period.label || 'Periodo'}: {date(period.start)} - {date(period.end)}</p>
              </div>
              <div className='d-flex flex-wrap gap-2 justify-content-end'>
                {sectionLinks.map(link => (
                  <a key={link.href} href={link.href} className='btn btn-sm btn-light'>{link.label}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='col-xl-8 mb-3'>
        <SummaryPanel summary={summary} />
      </div>
      <div className='col-xl-4 mb-3'>
        <DispatchOverview data={dispatch} />
      </div>

      <div id='dashboard-sales' className='col-12 mb-2'>
        <h5 className='mb-0'>Ventas y rentabilidad</h5>
      </div>
      <div className='col-xl-5 mb-3'>
        <WarehouseSales rows={salesDashboard.warehouseSales || []} />
      </div>
      <div className='col-xl-7 mb-3'>
        <Profitability data={salesDashboard.profitability || {}} />
      </div>

      <div className='col-12 mb-3'>
        <StockByWarehouse rows={salesDashboard.stockByWarehouse || []} />
      </div>
      <div className='col-12 mb-3'>
        <DispatchDetail data={dispatch} />
      </div>
      <div className='col-12'>
        <CatalogMetrics rows={catalogMetrics} />
      </div>
    </div>
  );
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<BaseAdminto {...properties} title='Dashboard'>
    <DashboardHome {...properties} />
  </BaseAdminto>);
});
