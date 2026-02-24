import React, { useEffect, useState } from 'react'
import Footer from './Footer'
import Menu from './Menu'
import NavBar from './NavBar'
import RigthBar from './RightBar'
import WhatsAppModal from '../modals/WhatsAppModal'
import { Toaster } from 'sonner'

// moment.tz.setDefault('UTC');

const Base = ({ children, title }) => {

  useEffect(() => {
    const app = new App
    const theme = new ThemeCustomizer
    app.init()
    theme.init()
    customJS()
  }, [])

  return (<>
    <div className="wrapper">
      <Menu />
      <NavBar title={title} />

      <div className="modal fade" id="searchModal" tabIndex="-1" aria-labelledby="searchModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content bg-transparent">
            <form>
              <div className="card mb-1">
                <div className="px-3 py-2 d-flex flex-row align-items-center" id="top-search">
                  <i className="ri-search-line fs-22"></i>
                  <input type="search" className="form-control border-0" id="search-modal-input"
                    placeholder="Search for actions, people," />
                  <button type="submit" className="btn p-0" data-bs-dismiss="modal" aria-label="Close">[esc]</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="page-container">
          {children}
        </div>
        <Footer />
      </div>

      <Toaster />
    </div>
    {/* <div id="wrapper">
      <NavBar {...props} title={title} whatsappStatus={whatsappStatus}/>
      <Menu {...props} />
      <div className="content-page">
        <div className="content">
          <div className="container-fluid">
            {children}
          </div>
        </div>
        <Footer />
      </div>
    </div>
    <WhatsAppModal status={whatsappStatus} setStatus={setWhatsappStatus} />
    <RigthBar {...props} />
    <div className="rightbar-overlay"></div> */}
  </>)
}

export default Base