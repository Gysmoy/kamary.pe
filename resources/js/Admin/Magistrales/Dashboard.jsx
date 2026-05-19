import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../../Utils/CreateReactScript';

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

const statusLabel = {
  pending: 'Pendiente',
  in_process: 'En proceso',
  finished: 'Finalizada',
  cancelled: 'Anulada',
};

const statusColor = {
  pending: 'warning',
  in_process: 'info',
  finished: 'success',
  cancelled: 'danger',
};

const stockStatusLabel = {
  DEVOLUCION: 'Devolucion',
  INFRASTOCK: 'Infra stock',
  NORMOSTOCK: 'Normal',
  SOBRESTOCK: 'Sobre stock',
};

const stockChartColor = {
  DEVOLUCION: '#0d6efd',
  INFRASTOCK: '#16b5c2',
  NORMOSTOCK: '#f10aa7',
  SOBRESTOCK: '#f59f00',
};

const EmptyState = ({ text = 'Sin datos para el periodo.' }) => (
  <div className='text-center text-muted py-4'>{text}</div>
);

const ProgressBar = ({ value, color = 'primary' }) => (
  <div className='progress' style={{ height: 6 }}>
    <div className={`progress-bar bg-${color}`} style={{ width: `${clampPct(value)}%` }}></div>
  </div>
);

const SectionHeader = ({ title, meta = null, action = null }) => (
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
  <div className='card h-100'>
    <div className='card-body'>
      <SectionHeader title='Resumen magistral' />
      <div className='row'>
        <MetricTile label='Ventas' value={money(summary.salesValue)} hint={`${summary.salesCount || 0} ventas`} icon='ti ti-cash' color='primary' />
        <MetricTile label='Unidades vendidas' value={number(summary.salesUnits, 3)} hint={`${summary.quotesCount || 0} cotizaciones`} icon='ti ti-package-export' color='info' />
        <MetricTile label='Produccion' value={number(summary.productionUnits, 3)} hint={`${summary.finishedProductionCount || 0} finalizadas`} icon='ti ti-clipboard-check' color='success' />
        <MetricTile label='Ingresos' value={money(summary.incomesValue)} hint={`${summary.incomesCount || 0} registros`} icon='ti ti-file-import' color='warning' />
      </div>
    </div>
  </div>
);

const ProductionPanel = ({ summary = {}, rows = [] }) => {
  const total = Math.max(1, rows.reduce((acc, row) => acc + Number(row.count || 0), 0));

  return (
    <div className='card h-100'>
      <div className='card-body'>
        <SectionHeader
          title='Produccion'
          action={<a href='/admin/magistrales-production-order' className='btn btn-sm btn-outline-primary'>Ver ordenes</a>}
        />
        <div className='d-flex justify-content-between align-items-end mb-2'>
          <div>
            <p className='text-muted mb-1'>Ordenes activas</p>
            <h3 className='mb-0'>{number(summary.productionCount)}</h3>
          </div>
          <span className='badge badge-soft-warning'>{number(summary.pendingProductionCount)} pendientes</span>
        </div>
        {rows.length === 0 ? <EmptyState /> : rows.map(row => {
          const color = statusColor[row.status] || 'secondary';
          return (
            <div key={`production-status-${row.status}`} className='mb-3'>
              <div className='d-flex justify-content-between mb-1'>
                <span>{statusLabel[row.status] || row.status}</span>
                <span>{number(row.count)}</span>
              </div>
              <ProgressBar value={(Number(row.count || 0) / total) * 100} color={color} />
              <small className='text-muted'>{number(row.units, 3)} unidades</small>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SalesByType = ({ rows = [] }) => {
  const max = Math.max(1, ...rows.map(row => Number(row.salesValue || 0)));

  return (
    <div className='card h-100'>
      <div className='card-body'>
        <SectionHeader
          title='Ventas por tipo'
          action={<a href='/admin/magistrales-sales' className='btn btn-sm btn-outline-primary'>Ver ventas</a>}
        />
        {rows.length === 0 ? <EmptyState /> : rows.map(row => (
          <div key={`sales-type-${row.label}`} className='mb-3 pb-2 border-bottom'>
            <div className='d-flex justify-content-between gap-3 mb-1'>
              <div>
                <strong>{row.label}</strong>
                <div className='text-muted small'>{number(row.count)} operaciones</div>
              </div>
              <strong>{money(row.salesValue)}</strong>
            </div>
            <ProgressBar value={(Number(row.salesValue || 0) / max) * 100} />
          </div>
        ))}
      </div>
    </div>
  );
};

const ProfitabilityPanel = ({ data = {} }) => {
  const totals = data.totals || {};
  const productRows = data.productRows || [];

  return (
    <div id='magistrales-profitability' className='card'>
      <div className='card-body'>
        <SectionHeader
          title='KPI de rentabilidad por producto'
          meta='Precio venta, precio costo, diferencia y porcentaje de rentabilidad.'
          action={<span className='badge badge-soft-primary'>Almacen fijo</span>}
        />
        <div className='row mb-3'>
          <div className='col-sm-6 col-xl-3 mb-2'>
            <div className='border rounded p-2 h-100'>
              <small className='text-muted d-block'>Venta total</small>
              <strong>{money(totals.salesValue)}</strong>
            </div>
          </div>
          <div className='col-sm-6 col-xl-3 mb-2'>
            <div className='border rounded p-2 h-100'>
              <small className='text-muted d-block'>Costo total</small>
              <strong>{money(totals.costValue)}</strong>
            </div>
          </div>
          <div className='col-sm-6 col-xl-3 mb-2'>
            <div className='border rounded p-2 h-100'>
              <small className='text-muted d-block'>Diferencia total</small>
              <strong>{money(totals.profitValue)}</strong>
            </div>
          </div>
          <div className='col-sm-6 col-xl-3 mb-2'>
            <div className='border rounded p-2 h-100'>
              <small className='text-muted d-block'>Rentabilidad</small>
              <strong>{pct(totals.profitPct)}</strong>
            </div>
          </div>
        </div>
        <h6 className='mb-2'>Listado por producto</h6>
        {productRows.length === 0 ? <EmptyState /> : (
          <div className='table-responsive mb-4' style={{ maxHeight: 340, overflowY: 'auto' }}>
            <table className='table table-sm align-middle mb-0'>
              <thead className='table-light' style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th>Producto</th>
                  <th className='text-end'>Und.</th>
                  <th className='text-end'>Precio venta</th>
                  <th className='text-end'>Precio costo</th>
                  <th className='text-end'>Diferencia</th>
                  <th className='text-end'>Rentab.</th>
                  <th className='text-end'>Venta total</th>
                </tr>
              </thead>
              <tbody>
                {productRows.map(row => (
                  <tr key={`mag-profit-product-${row.articleId}`}>
                    <td>
                      <strong>{row.articleCode}</strong>
                      <div className='text-muted small'>{row.articleName}</div>
                    </td>
                    <td className='text-end'>{number(row.units, 3)}</td>
                    <td className='text-end'>{money(row.avgSalePrice)}</td>
                    <td className='text-end'>{money(row.avgCostPrice)}</td>
                    <td className='text-end'>{money(row.unitProfitValue)}</td>
                    <td className='text-end'>{pct(row.profitPct)}</td>
                    <td className='text-end'>{money(row.salesValue)}</td>
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

const InventoryPanel = ({ data = {} }) => {
  const rows = data.warehouseRows || [];
  const warehouseRow = rows[0] || null;
  const max = Math.max(1, ...rows.map(row => Number(row.stockValue || 0)));

  return (
    <div className='card h-100'>
      <div className='card-body'>
        <SectionHeader
          title='Inventario magistral'
          meta={`${number(data.articleCount)} articulos con valorizacion`}
          action={<a href='/admin/magistrales/inventory' className='btn btn-sm btn-outline-primary'>Ver inventario</a>}
        />
        <div className='row mb-3'>
          <div className='col-md-6 mb-2'>
            <small className='text-muted d-block'>Stock valorizado</small>
            <strong>{money(data.stockValue)}</strong>
          </div>
          <div className='col-md-6 mb-2'>
            <small className='text-muted d-block'>Stock unidades</small>
            <strong>{number(data.stockUnits, 3)}</strong>
          </div>
        </div>
        {warehouseRow ? (
          <div className='mb-3'>
            <div className='d-flex justify-content-between mb-1'>
              <span>Almacen fijo</span>
              <span>{money(warehouseRow.stockValue)}</span>
            </div>
            <ProgressBar value={(Number(warehouseRow.stockValue || 0) / max) * 100} color='success' />
            <small className='text-muted'>
              {warehouseRow.warehouseName} | {number(warehouseRow.stockUnits, 3)} unidades | {number(warehouseRow.articleCount)} articulos
            </small>
          </div>
        ) : <EmptyState />}
      </div>
    </div>
  );
};

const LowStockPanel = ({ rows = [] }) => (
  <div className='card h-100'>
    <div className='card-body'>
      <SectionHeader title='Alertas de stock' action={<span className='badge badge-soft-danger'>{number(rows.length)} alertas</span>} />
      {rows.length === 0 ? <EmptyState text='Sin articulos por debajo del minimo.' /> : (
        <div className='table-responsive' style={{ maxHeight: 360, overflowY: 'auto' }}>
          <table className='table table-sm align-middle mb-0'>
            <thead className='table-light' style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th>Articulo</th>
                <th>Almacen</th>
                <th className='text-end'>Stock</th>
                <th className='text-end'>Min.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={`low-stock-${row.articleId}-${row.warehouseName}`}>
                  <td>
                    <strong>{row.articleCode}</strong>
                    <div className='text-muted small'>{row.articleName}</div>
                  </td>
                  <td>{row.warehouseName}</td>
                  <td className='text-end'>{number(row.stock, 3)} {row.unitLabel || ''}</td>
                  <td className='text-end'>{number(row.stockMin, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);

const ActivityPanel = ({ rows = [] }) => (
  <div className='card'>
    <div className='card-body'>
      <SectionHeader title='Actividad reciente' />
      {rows.length === 0 ? <EmptyState /> : (
        <div className='table-responsive'>
          <table className='table table-sm align-middle mb-0'>
            <thead>
              <tr>
                <th>Operacion</th>
                <th>Codigo</th>
                <th>Fecha</th>
                <th>Detalle</th>
                <th className='text-end'>Importe / cantidad</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`activity-${row.type}-${row.code}-${index}`}>
                  <td><span className='badge badge-soft-secondary'>{row.type}</span></td>
                  <td>{row.code}</td>
                  <td>{date(row.date)}</td>
                  <td>{row.subject || '-'}</td>
                  <td className='text-end'>
                    {row.amount === null ? '-' : (row.type === 'Venta' || row.type === 'Ingreso' ? money(row.amount) : number(row.amount, 3))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);

const pieBackground = (rows = [], field = 'pctItems') => {
  let cursor = 0;
  const segments = rows
    .filter(row => Number(row[field] || 0) > 0)
    .map(row => {
      const value = Number(row[field] || 0);
      const start = cursor;
      const end = cursor + value;
      cursor = end;
      return `${stockChartColor[row.status] || '#6c757d'} ${start}% ${end}%`;
    });

  return segments.length ? `conic-gradient(${segments.join(', ')})` : '#eef2f7';
};

const RotationMetric = ({ label, count, value, color = '#0d6efd' }) => (
  <div className='col-6 col-xl mb-3'>
    <div className='border rounded h-100 overflow-hidden' style={{ borderColor: `${color}66` }}>
      <div className='text-center px-2 py-2' style={{ background: `${color}22` }}>
        <div className='text-muted text-uppercase small'>{label}</div>
        <h4 className='mb-0'>{number(count)}</h4>
      </div>
      <div className='text-center px-2 py-2' style={{ background: `${color}44` }}>
        <div className='text-muted text-uppercase small'>Valor</div>
        <h5 className='mb-0'>{money(value)}</h5>
      </div>
    </div>
  </div>
);

const RotationPie = ({ title, rows = [], field = 'pctItems' }) => (
  <div className='card h-100'>
    <div className='card-body'>
      <h6 className='text-center mb-3'>{title}</h6>
      <div className='d-flex flex-wrap justify-content-center align-items-center gap-4'>
        <div
          className='rounded-circle flex-shrink-0'
          style={{
            width: 210,
            height: 210,
            background: pieBackground(rows, field),
          }}
        ></div>
        <div>
          {rows.map(row => (
            <div key={`${title}-${row.status}`} className='d-flex align-items-center gap-2 mb-2'>
              <span className='rounded-circle d-inline-block' style={{ width: 10, height: 10, background: stockChartColor[row.status] || '#6c757d' }}></span>
              <span>{stockStatusLabel[row.status] || row.label}</span>
              <strong>{pct(row[field])}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const RotationBarChart = ({ title, rows = [], field = 'stockValue', formatter = money, legend = null }) => {
  const max = Math.max(1, ...rows.map(row => Number(row[field] || 0)));

  return (
    <div className='card h-100'>
      <div className='card-body'>
        <h6 className='text-center mb-2'>{title}</h6>
        {legend && (
          <div className='d-flex align-items-center gap-2 small mb-2'>
            <span className='d-inline-block' style={{ width: 18, height: 10, background: '#0d6efd' }}></span>
            <span className='text-muted text-uppercase'>{legend}</span>
          </div>
        )}
        <div className='d-flex align-items-end justify-content-around gap-3' style={{ height: 230 }}>
          {rows.map(row => {
            const value = Number(row[field] || 0);
            const height = value > 0 ? Math.max(4, (value / max) * 100) : 0;
            return (
              <div key={`${title}-${row.status}`} className='d-flex flex-column align-items-center flex-fill h-100'>
                <small className='fw-semibold mb-1 text-primary text-center'>{formatter(row[field])}</small>
                <div className='d-flex align-items-end flex-grow-1 w-100 border-bottom'>
                  <div
                    className='w-100 rounded-top'
                    style={{ height: `${height}%`, background: '#0d6efd', minHeight: value > 0 ? 8 : 0 }}
                  ></div>
                </div>
                <small className='text-muted text-uppercase text-center mt-2' style={{ fontSize: 11 }}>{stockStatusLabel[row.status] || row.label}</small>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const InventoryRotationSummary = ({ data = {} }) => {
  const rows = data.statusRows || [];

  return (
    <div className='card'>
      <div className='card-body'>
        <SectionHeader
          title='Promedio de venta de los ultimos 90 dias'
          meta={`${date(data.period?.start)} - ${date(data.period?.end)}`}
          action={<span className='badge badge-soft-primary'>{number(data.totalItems)} items</span>}
        />
        {rows.length === 0 || Number(data.totalItems || 0) === 0 ? <EmptyState text='Sin stock valorizado para clasificar.' /> : (
          <>
            <div className='row'>
              <RotationMetric label='Total items' count={data.totalItems} value={data.totalValue} color='#5dade2' />
              {rows.map(row => (
                <RotationMetric
                  key={`rotation-metric-${row.status}`}
                  label={stockStatusLabel[row.status] || row.label}
                  count={row.items}
                  value={row.stockValue}
                  color={stockChartColor[row.status] || '#6c757d'}
                />
              ))}
            </div>
            <div className='row'>
              <div className='col-xl-6 mb-3'>
                <RotationPie title='Distribucion % por Status' rows={rows} field='pctItems' />
              </div>
              <div className='col-xl-6 mb-3'>
                <RotationBarChart title='Inventario valorizado' rows={rows} field='stockValue' formatter={money} legend='Valorizacion' />
              </div>
              <div className='col-xl-6 mb-3'>
                <RotationBarChart title='Total items por Status' rows={rows} field='items' formatter={number} legend='Items' />
              </div>
              <div className='col-xl-6 mb-3'>
                <RotationBarChart title='Distribucion % por valorizacion' rows={rows} field='pctValue' formatter={pct} legend='Valorizacion' />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const MagistralesDashboard = ({ magistralesDashboard = {} }) => {
  const period = magistralesDashboard.period || {};
  const summary = magistralesDashboard.summary || {};

  return (
    <div className='row'>
      <div className='col-12 mb-3'>
        <div className='card border-0 shadow-sm'>
          <div className='card-body'>
            <div className='d-flex flex-wrap justify-content-between align-items-center gap-2'>
              <div>
                <h4 className='mb-1'>Dashboard Magistrales</h4>
                <p className='text-muted mb-0'>{period.label || 'Periodo'}: {date(period.start)} - {date(period.end)}</p>
              </div>
              <div className='d-flex flex-wrap gap-2'>
                <a href='/admin/magistrales-sales' className='btn btn-sm btn-light'>Ventas</a>
                <a href='#magistrales-profitability' className='btn btn-sm btn-light'>Rentabilidad</a>
                <a href='/admin/magistrales-production-order' className='btn btn-sm btn-light'>Produccion</a>
                <a href='/admin/magistrales/inventory' className='btn btn-sm btn-light'>Inventario</a>
                <a href='#magistrales-rotation' className='btn btn-sm btn-light'>Rotacion</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='col-xl-8 mb-3'>
        <SummaryPanel summary={summary} />
      </div>
      <div className='col-xl-4 mb-3'>
        <ProductionPanel summary={summary} rows={magistralesDashboard.productionStatus || []} />
      </div>
      <div className='col-xl-5 mb-3'>
        <SalesByType rows={magistralesDashboard.salesByType || []} />
      </div>
      <div className='col-xl-7 mb-3'>
        <InventoryPanel data={magistralesDashboard.inventory || {}} />
      </div>
      <div className='col-12 mb-3'>
        <ProfitabilityPanel data={magistralesDashboard.profitability || {}} />
      </div>
      <div id='magistrales-rotation' className='col-12 mb-3'>
        <InventoryRotationSummary data={magistralesDashboard.inventoryRotation || {}} />
      </div>
      <div className='col-xl-6 mb-3'>
        <LowStockPanel rows={magistralesDashboard.lowStock || []} />
      </div>
      <div className='col-xl-6 mb-3'>
        <ActivityPanel rows={magistralesDashboard.recentActivity || []} />
      </div>
    </div>
  );
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<BaseAdminto {...properties} title='Dashboard Magistrales'>
    <MagistralesDashboard {...properties} />
  </BaseAdminto>);
});
