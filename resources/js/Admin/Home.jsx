import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';

const formatValue = (value) => {
  if (value === null || value === undefined) return 'Pendiente'
  return Number(value).toLocaleString('es-PE')
}

const DashboardHome = ({ metrics = [] }) => {
  const readyMetrics = metrics.filter(metric => metric.value !== null).length

  return (
    <div className='row'>
      <div className='col-12 mb-3'>
        <div className='card border-0 shadow-sm'>
          <div className='card-body'>
            <h4 className='mb-1'>Dashboard</h4>
            <p className='text-muted mb-2'>Resumen rapido para que el panel vaya agarrando forma.</p>
            <div className='d-flex flex-wrap gap-2'>
              <span className='badge badge-soft-primary'>Metricas activas: {readyMetrics}/{metrics.length}</span>
              <span className='badge badge-soft-secondary'>Fecha: {new Date().toLocaleDateString('es-PE')}</span>
            </div>
          </div>
        </div>
      </div>

      {metrics.map((metric) => (
        <div key={metric.key} className='col-xl-4 col-md-6'>
          <a href={metric.route} className='text-reset text-decoration-none'>
            <div className='card'>
              <div className='card-body'>
                <div className='d-flex justify-content-between align-items-start'>
                  <div>
                    <p className='text-muted mb-1'>{metric.label}</p>
                    <h3 className='mb-1'>{formatValue(metric.value)}</h3>
                    <small className='text-muted'>
                      {metric.value === null ? 'Modulo en implementacion' : 'Ver detalle'}
                    </small>
                  </div>
                  <div className={`avatar-sm bg-${metric.color}-subtle rounded d-flex align-items-center justify-content-center`}>
                    <i className={`${metric.icon} fs-24 text-${metric.color}`}></i>
                  </div>
                </div>
              </div>
            </div>
          </a>
        </div>
      ))}
    </div>
  );
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<BaseAdminto {...properties} title='Dashboard'>
    <DashboardHome {...properties} />
  </BaseAdminto>);
})
