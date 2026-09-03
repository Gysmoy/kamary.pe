import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import KpiCard, { kpiBackground } from '@Adminto/KpiCard';
import PeriodFilter from '@Adminto/PeriodFilter';
import HomeRest from '../Actions/Admin/HomeRest';

const homeRest = new HomeRest()

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
  DEVOLUCION: 'primary',
  INFRASTOCK: 'danger',
  NORMOSTOCK: 'success',
  SOBRESTOCK: 'warning',
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

const sectionLinks = [
  { href: '#dashboard-summary', label: 'Resumen' },
  { href: '#dashboard-sales', label: 'Ventas' },
  { href: '#dashboard-profitability', label: 'Rentabilidad' },
  { href: '#dashboard-rotation', label: 'Rotacion' },
  { href: '#dashboard-stock', label: 'Stock' },
  { href: '#dashboard-delays', label: 'Retrasos' },
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

const chartBackground = (rows = [], field = 'pct') => {
  let cursor = 0;
  const segments = rows
    .filter(row => Number(row[field] || 0) > 0)
    .map(row => {
      const value = Number(row[field] || 0);
      const start = cursor;
      const end = cursor + value;
      cursor = end;
      return `${row.color || '#0d6efd'} ${start}% ${end}%`;
    });

  return segments.length ? `conic-gradient(${segments.join(', ')})` : '#eef2f7';
};

const PercentDonut = ({ title, rows = [], centerValue = null, centerLabel = null }) => (
  <div className='border rounded p-3 h-100'>
    <h6 className='text-center mb-3'>{title}</h6>
    <div className='d-flex flex-wrap justify-content-center align-items-center gap-4'>
      <div
        className='rounded-circle position-relative flex-shrink-0'
        style={{ width: 190, height: 190, background: chartBackground(rows) }}
      >
        <div
          className='rounded-circle position-absolute bg-white d-flex flex-column justify-content-center align-items-center text-center'
          style={{ inset: 36 }}
        >
          <strong>{centerValue}</strong>
          <small className='text-muted'>{centerLabel}</small>
        </div>
      </div>
      <div>
        {rows.map(row => (
          <div key={`${title}-${row.status || row.label}`} className='d-flex align-items-center gap-2 mb-2'>
            <span className='rounded-circle d-inline-block' style={{ width: 10, height: 10, background: row.color || '#0d6efd' }}></span>
            <span>{row.label}</span>
            <strong>{pct(row.pct)}</strong>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PercentBarList = ({ title, rows = [], emptyText = 'Sin datos para graficar.' }) => (
  <div className='border rounded p-3 h-100'>
    <h6 className='text-center mb-3'>{title}</h6>
    {rows.length === 0 ? <EmptyState text={emptyText} /> : rows.map((row, index) => (
      <div key={`${title}-${row.reason || row.label}-${index}`} className='mb-3'>
        <div className='d-flex justify-content-between gap-3 mb-1'>
          <span>{row.reason || row.label}</span>
          <strong>{pct(row.pct)}</strong>
        </div>
        <ProgressBar value={row.pct} color='primary' />
        <small className='text-muted'>{number(row.count)} registros</small>
      </div>
    ))}
  </div>
);

const StockBadge = ({ status }) => {
  const color = stockStatusColor[status] || 'secondary';
  return <span className={`badge badge-soft-${color}`}>{stockStatusLabel[status] || status || '-'}</span>;
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

/**
 * Cabecera de indicadores. Incluye el desglose comercial/servicios y el conteo de pedidos
 * de cada uno, que el controlador ya devolvia pero la pantalla no mostraba.
 */
const KpiHeader = ({ summary = {}, dispatch = {}, rotation = {} }) => (
  <div className='row'>
    <KpiCard
      label='Ventas del periodo'
      value={money(summary.salesValue)}
      hint={`${number(summary.ordersCount)} operaciones`}
      icon='ti ti-cash'
      background={kpiBackground.blue}
    />
    <KpiCard
      label='Ventas comerciales'
      value={money(summary.commercialSalesValue)}
      hint={`${number(summary.commercialOrdersCount)} pedidos`}
      icon='ti ti-shopping-bag'
      background={kpiBackground.lightBlue}
      href='/admin/commercial-orders'
    />
    <KpiCard
      label='Ventas de servicios'
      value={money(summary.serviceSalesValue)}
      hint={`${number(summary.serviceOrdersCount)} ordenes`}
      icon='ti ti-tools'
      background={kpiBackground.teal}
      href='/admin/services-service-order'
    />
    <KpiCard
      label='Margen bruto'
      value={pct(summary.grossMarginPct)}
      hint={money(summary.grossProfit)}
      icon='ti ti-chart-line'
      background={kpiBackground.green}
      href='#dashboard-profitability'
    />

    <KpiCard
      label='Unidades vendidas'
      value={number(summary.salesUnits, 3)}
      hint={`Costo ${money(summary.salesCost)}`}
      icon='ti ti-package'
      background={kpiBackground.purple}
    />
    <KpiCard
      label='Eficiencia de despacho'
      value={pct(dispatch.efficiencyPct)}
      hint={`${number(dispatch.onTimeDelivered)} de ${number(dispatch.totalDelivered)} a tiempo`}
      icon='ti ti-truck-delivery'
      background={kpiBackground.slate}
      href='#dashboard-delays'
    />
    <KpiCard
      label='Entregas con demora'
      value={number(dispatch.delayedDelivered)}
      hint={`${pct(dispatch.delayPct)} de las entregas`}
      icon='ti ti-clock-exclamation'
      background={kpiBackground.red}
      href='#dashboard-delays'
    />
    <KpiCard
      label='Stock valorizado'
      value={money(rotation.totalValue)}
      hint={`${number(rotation.totalItems)} items · ${number(rotation.totalUnits, 0)} und.`}
      icon='ti ti-stack-2'
      background={kpiBackground.orange}
      href='#dashboard-rotation'
    />
  </div>
);

const SummaryPanel = ({ summary = {} }) => (
  <div id='dashboard-summary' className='card h-100'>
    <div className='card-body'>
      <SectionHeader title='Resumen comercial' />
      <div className='row'>
        <MetricTile label='Ventas valor' value={money(summary.salesValue)} hint={`Comercial ${money(summary.commercialSalesValue)} | Servicios ${money(summary.serviceSalesValue)}`} icon='ti ti-cash' color='primary' />
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
  const productWarehouseRows = data.productWarehouseRows || [];

  return (
    <div id='dashboard-profitability' className='card h-100'>
      <div className='card-body'>
        <SectionHeader
          title='KPI de rentabilidad por producto'
          meta='Precio venta, precio costo, diferencia y porcentaje de rentabilidad.'
          action={<span className='badge badge-soft-primary'>Total almacenes</span>}
        />
        <div className='row mb-3'>
          <div className='col-sm-6 col-xl-3 mb-2'>
            <div className='border rounded p-2 h-100'>
              <small className='text-muted d-block'>Unidades</small>
              <strong>{number(totals.units, 3)}</strong>
            </div>
          </div>
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
          <div className='col-sm-6 col-xl-3 mb-2'>
            <div className='border rounded p-2 h-100'>
              <small className='text-muted d-block'>Precio venta prom.</small>
              <strong>{money(totals.avgSalePrice)}</strong>
            </div>
          </div>
          <div className='col-sm-6 col-xl-3 mb-2'>
            <div className='border rounded p-2 h-100'>
              <small className='text-muted d-block'>Precio costo prom.</small>
              <strong>{money(totals.avgCostPrice)}</strong>
            </div>
          </div>
          <div className='col-sm-6 col-xl-3 mb-2'>
            <div className='border rounded p-2 h-100'>
              <small className='text-muted d-block'>Diferencia unitaria</small>
              <strong>{money(totals.unitProfitValue)}</strong>
            </div>
          </div>
        </div>
        <h6 className='mb-2'>Listado por producto - todos los almacenes</h6>
        {productRows.length === 0 ? <EmptyState /> : (
          <div className='table-responsive mb-4' style={{ maxHeight: 360, overflowY: 'auto' }}>
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
                  <th className='text-end'>Dif. total</th>
                </tr>
              </thead>
              <tbody>
                {productRows.map(row => (
                  <tr key={`profit-product-${row.articleId}`}>
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
                    <td className='text-end'>{money(row.profitValue)}</td>
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
                  <th className='text-end'>Und.</th>
                  <th className='text-end'>Venta</th>
                  <th className='text-end'>Costo</th>
                  <th className='text-end'>Diferencia</th>
                  <th className='text-end'>Rentabilidad</th>
                </tr>
              </thead>
              <tbody>
                {warehouseRows.map(row => (
                  <tr key={`profit-warehouse-${row.warehouseId || row.warehouseName}`}>
                    <td>{row.warehouseName}</td>
                    <td className='text-end'>{number(row.units, 3)}</td>
                    <td className='text-end'>{money(row.salesValue)}</td>
                    <td className='text-end'>{money(row.costValue)}</td>
                    <td className='text-end'>{money(row.profitValue)}</td>
                    <td className='text-end'>{pct(row.profitPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <h6 className='mt-4 mb-2'>Detalle producto por almacen</h6>
        {productWarehouseRows.length === 0 ? <EmptyState text='Sin detalle por almacen.' /> : (
          <div className='table-responsive' style={{ maxHeight: 360, overflowY: 'auto' }}>
            <table className='table table-sm align-middle mb-0'>
              <thead className='table-light' style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th>Almacen</th>
                  <th>Producto</th>
                  <th className='text-end'>Und.</th>
                  <th className='text-end'>Precio venta</th>
                  <th className='text-end'>Precio costo</th>
                  <th className='text-end'>Diferencia</th>
                  <th className='text-end'>Rentab.</th>
                </tr>
              </thead>
              <tbody>
                {productWarehouseRows.map(row => (
                  <tr key={`profit-warehouse-product-${row.warehouseId || row.warehouseName}-${row.articleId}`}>
                    <td>{row.warehouseName}</td>
                    <td>
                      <strong>{row.articleCode}</strong>
                      <div className='text-muted small'>{row.articleName}</div>
                    </td>
                    <td className='text-end'>{number(row.units, 3)}</td>
                    <td className='text-end'>{money(row.avgSalePrice)}</td>
                    <td className='text-end'>{money(row.avgCostPrice)}</td>
                    <td className='text-end'>{money(row.unitProfitValue)}</td>
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
    <div id='dashboard-rotation' className='card'>
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
              <RotationMetric label='Total unidades' count={data.totalUnits} value={data.totalValue} color='#8e7cc3' />
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
              <span className='badge badge-soft-primary'>Devolucion {warehouse.statusSummary?.DEVOLUCION || 0}</span>
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

const DeliveryDelayAnalysis = ({ data = {} }) => {
  const recentRows = data.recentRows || [];
  const delayReasons = data.delayReasons || [];
  const efficiencyRows = data.efficiencyRows || [];
  const delayedTotal = Number(data.delayedDelivered || 0);

  return (
    <div id='dashboard-delays' className='card'>
      <div className='card-body'>
        <SectionHeader
          title='Motivos de demora en la entrega'
          meta='Porcentaje de eficiencia y porcentaje por cada motivo de retraso.'
          action={<a href='/admin/dispatch' className='btn btn-sm btn-outline-primary'>Ver despachos</a>}
        />
        <div className='row mb-3'>
          <div className='col-sm-6 col-xl-3 mb-2'>
            <div className='border rounded p-2 h-100'>
              <small className='text-muted d-block'>Entregas</small>
              <strong>{number(data.totalDelivered)}</strong>
            </div>
          </div>
          <div className='col-sm-6 col-xl-3 mb-2'>
            <div className='border rounded p-2 h-100'>
              <small className='text-muted d-block'>A tiempo</small>
              <strong>{number(data.onTimeDelivered)}</strong>
            </div>
          </div>
          <div className='col-sm-6 col-xl-3 mb-2'>
            <div className='border rounded p-2 h-100'>
              <small className='text-muted d-block'>Con demora</small>
              <strong>{number(data.delayedDelivered)} / {pct(data.delayPct)}</strong>
            </div>
          </div>
          <div className='col-sm-6 col-xl-3 mb-2'>
            <div className='border rounded p-2 h-100'>
              <small className='text-muted d-block'>Eficiencia</small>
              <strong>{pct(data.efficiencyPct)}</strong>
            </div>
          </div>
        </div>
        <div className='row mb-3'>
          <div className='col-xl-5 mb-3'>
            <PercentDonut
              title='Distribucion de eficiencia'
              rows={efficiencyRows}
              centerValue={pct(data.efficiencyPct)}
              centerLabel='eficiencia'
            />
          </div>
          <div className='col-xl-7 mb-3'>
            <PercentBarList
              title='Distribucion % por motivo de retraso'
              rows={delayReasons}
              emptyText='Sin motivos de retraso registrados.'
            />
          </div>
        </div>
        <div className='row'>
          <div className='col-xl-4 mb-3'>
            <div className='border rounded p-3 h-100'>
              <h6 className='text-center mb-3'>Resumen por motivo</h6>
              <div className='table-responsive'>
                <table className='table table-sm align-middle mb-0'>
                  <thead className='table-light'>
                    <tr>
                      <th>Motivo retraso</th>
                      <th className='text-end'>Total</th>
                      <th className='text-end'>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delayReasons.length === 0 && (
                      <tr><td colSpan='3' className='text-center text-muted py-3'>Sin retrasos.</td></tr>
                    )}
                    {delayReasons.map(row => (
                      <tr key={`delay-reason-table-${row.reason}`}>
                        <td>{row.reason}</td>
                        <td className='text-end'>{number(row.count)}</td>
                        <td className='text-end'>{pct(row.pct)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {delayReasons.length > 0 && (
                    <tfoot>
                      <tr>
                        <th>Total</th>
                        <th className='text-end'>{number(delayedTotal)}</th>
                        <th className='text-end'>100%</th>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
          <div className='col-xl-8 mb-3'>
            <div className='border rounded p-3 h-100'>
              <h6 className='text-center mb-3'>Detalle de entregas</h6>
              <div className='table-responsive' style={{ maxHeight: 420, overflowY: 'auto' }}>
                <table className='table table-sm align-middle mb-0'>
                  <thead className='table-light' style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th>Despacho</th>
                      <th>Registro</th>
                      <th>Solicitada</th>
                      <th>Entrega</th>
                      <th className='text-end'>Dif. dias</th>
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

const DashboardHome = ({
  catalogMetrics = [],
  salesDashboard: initialDashboard = {},
  initialFilters = {},
  availableYears = [],
}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [salesDashboard, setSalesDashboard] = useState(initialDashboard);
  const [loading, setLoading] = useState(false);

  const period = salesDashboard.period || {};
  const summary = salesDashboard.summary || {};
  const dispatch = salesDashboard.dispatch || {};

  const load = async (nextFilters = filters) => {
    setLoading(true);
    const data = await homeRest.dashboard(nextFilters);
    if (data) {
      setFilters(data.filters);
      setSalesDashboard(data.salesDashboard);
    }
    setLoading(false);
  };

  return (
    <div className='row'>
      <div className='col-12'>
        <PeriodFilter
          value={filters}
          years={availableYears}
          loading={loading}
          onChange={setFilters}
          onApply={(next) => load(next ?? filters)}
        />
      </div>
      <div className='col-12 mb-3'>
        <div className='card border-0 shadow-sm'>
          <div className='card-body'>
            <div className='d-flex flex-wrap justify-content-between align-items-center gap-3'>
              <div>
                <p className='text-muted mb-0'>Resumen de {period.label || 'el periodo'}: {date(period.start)} - {date(period.end)}</p>
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

      <div className='col-12'>
        <KpiHeader summary={summary} dispatch={dispatch} rotation={salesDashboard.inventoryRotation || {}} />
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
        <InventoryRotationSummary data={salesDashboard.inventoryRotation || {}} />
      </div>
      <div className='col-12 mb-3'>
        <StockByWarehouse rows={salesDashboard.stockByWarehouse || []} />
      </div>
      <div className='col-12 mb-3'>
        <DeliveryDelayAnalysis data={dispatch} />
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
