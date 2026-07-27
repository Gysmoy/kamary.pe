import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import BaseAdminto from '@Adminto/Base'
import CreateReactScript from '../Utils/CreateReactScript'

const Documentation = ({ manuals = [] }) => {
  const [current, setCurrent] = useState(manuals[0]?.key ?? null)
  const manual = manuals.find(item => item.key === current) ?? null

  if (!manuals.length) {
    return <div className='card'>
      <div className='card-body text-center py-5'>
        <i className='ti ti-book fs-1 text-muted d-block mb-2'></i>
        <h5 className='mb-1'>Aun no hay manuales publicados</h5>
        <p className='text-muted mb-0'>Cuando se publique un manual aparecera en esta pantalla.</p>
      </div>
    </div>
  }

  return (<>
    <div className='row'>
      <div className='col-12 col-xl-3'>
        <div className='card'>
          <div className='card-body p-2'>
            {manuals.map(item => (
              <button
                key={item.key}
                type='button'
                onClick={() => setCurrent(item.key)}
                className={`btn w-100 text-start mb-1 ${item.key === current ? 'btn-primary' : 'btn-light'}`}
              >
                <span className='d-flex align-items-start gap-2'>
                  <i className='ti ti-file-text fs-18 mt-1'></i>
                  <span>
                    <span className='d-block fw-semibold'>{item.title}</span>
                    <small className={item.key === current ? 'text-white-50' : 'text-muted'}>
                      {item.audience} · {item.version}
                    </small>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {manual && <div className='card'>
          <div className='card-body'>
            <h5 className='mb-2'>{manual.title}</h5>
            <p className='text-muted fs-13 mb-3'>{manual.description}</p>
            <div className='d-flex flex-column gap-2'>
              <a
                href={`/admin/docs/file/${manual.key}`}
                target='_blank'
                rel='noreferrer'
                className='btn btn-outline-primary btn-sm'
              >
                <i className='ti ti-external-link me-1'></i> Abrir en pestana nueva
              </a>
              <a
                href={`/admin/docs/file/${manual.key}?download=1`}
                className='btn btn-outline-secondary btn-sm'
              >
                <i className='ti ti-download me-1'></i> Descargar PDF
                {manual.size ? <span className='text-muted ms-1'>({manual.size} MB)</span> : null}
              </a>
            </div>
          </div>
        </div>}
      </div>

      <div className='col-12 col-xl-9'>
        <div className='card'>
          <div className='card-body p-2'>
            {manual?.available
              ? <iframe
                title={manual.title}
                src={`/admin/docs/file/${manual.key}#view=FitH`}
                style={{ width: '100%', height: 'calc(100vh - 230px)', minHeight: '520px', border: 0 }}
              />
              : <div className='text-center py-5'>
                <i className='ti ti-file-off fs-1 text-muted d-block mb-2'></i>
                <h5 className='mb-1'>Manual no disponible</h5>
                <p className='text-muted mb-0'>El archivo aun no ha sido cargado en el servidor.</p>
              </div>}
          </div>
        </div>
      </div>
    </div>
  </>)
}

CreateReactScript((el, properties) => {
  createRoot(el).render(<BaseAdminto {...properties} title='Documentación'>
    <Documentation {...properties} />
  </BaseAdminto>)
})
