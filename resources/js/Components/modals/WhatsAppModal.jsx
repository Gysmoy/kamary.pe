import React, { useEffect, useRef, useState } from "react";
import WhatsAppStatuses from "../../Reutilizables/WhatsApp/WhatsAppStatuses";
import '../../../css/qr-code.css'
import WhatsAppSessionTab from "./WhatsAppSessionTab";

const otherSessions = ['Spammer']

const WhatsAppModal = ({ status, setStatus }) => {
  const phoneRef = useRef()
  const modalRef = useRef()
  const [tabActive, setTabActive] = useState('Principal')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const modalElement = document.getElementById('whatsapp-modal');
    modalElement.addEventListener('show.bs.modal', () => setIsModalOpen(true));
    modalElement.addEventListener('hide.bs.modal', () => setIsModalOpen(false));
    return () => {
      modalElement.removeEventListener('show.bs.modal', () => setIsModalOpen(true));
      modalElement.removeEventListener('hide.bs.modal', () => setIsModalOpen(false));
    };
  }, []);

  return (
    <div ref={modalRef} id="whatsapp-modal" className="modal fade" aria-hidden="true" data-bs-backdrop='static'>
      <div className="modal-dialog modal-sm modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-body">
            <button type='button' className='btn-close position-absolute top-0 end-0 me-2 mt-2' data-bs-dismiss='modal' aria-label='Close'></button>
            <ul className="nav nav-tabs nav-bordered mx-auto" style={{ width: 'max-content' }}>
              {
                [null, ...otherSessions].map(session => {
                  return <li className="nav-item" key={session ?? 'Principal'}>
                    <a href={`#wa-session-${session ?? 'Principal'}`} data-bs-toggle="tab" aria-expanded="false" className={`nav-link px-3 py-1 bg-transparent ${tabActive == (session ?? 'Principal') ? 'active' : ''}`} onClick={() => setTabActive(session ?? 'Principal')}>
                      {/* <i className={`mdi mdi-circle me-1 text-${WhatsAppStatuses[status]?.color}`} /> */}
                      {session ?? 'Principal'}
                    </a>
                  </li>
                })
              }
              {/* <li className="nav-item">
                <a href="#wa-session-main" data-bs-toggle="tab" aria-expanded="false" className="nav-link px-3 py-1 bg-transparent active" onClick={() => setTabActive('Main')}>
                  <i className={`mdi mdi-circle me-1 text-${WhatsAppStatuses[status]?.color}`} />
                  Principal
                </a>
              </li>
              <li className="nav-item">
                <a href="#wa-session-spammer" data-bs-toggle="tab" aria-expanded="true" className="nav-link px-3 py-1 bg-transparent" onClick={() => setTabActive('Spammer')}>
                  <i className="mdi mdi-circle me-1" />
                  Spammer
                </a>
              </li> */}
            </ul>
            <div className="tab-content" style={{ minHeight: '240px' }}>
              {
                [null, ...otherSessions].map(session => {
                  return <WhatsAppSessionTab
                    key={session ?? 'Principal'}
                    active={tabActive == (session ?? 'Principal')}
                    session={session}
                    status={status}
                    setStatus={setStatus}
                    phoneRef={phoneRef}
                    isModalOpen={isModalOpen}
                  />
                })
              }
              {/* <WhatsAppSessionTab
                active={tabActive == 'Main'}
                status={status}
                setStatus={setStatus}
                phoneRef={phoneRef}
                isModalOpen={isModalOpen}
              />
              <WhatsAppSessionTab
                active={tabActive == 'Spammer'}
                session="Spammer"
                phoneRef={phoneRef}
                isModalOpen={isModalOpen}
              /> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WhatsAppModal;