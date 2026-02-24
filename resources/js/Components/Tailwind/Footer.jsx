import React, { useState } from "react";
import ReactModal from "react-modal";

import Tippy from "@tippyjs/react";
import HtmlContent from "../../Utils/HtmlContent";
import Global from "../../Utils/Global";

ReactModal.setAppElement('#app')

const Footer = ({ socials = [], terms, footerLinks = [] }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const links = {}
  footerLinks.forEach(fl => {
    links[fl.correlative] = fl?.description ?? ''
  })

  return (
    <>
      <footer className="relative w-full bg-[#263246] z-10">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-12 lg:gap-16">
            <div className="md:col-span-2">
              <a href="/" className="flex-shrink-0">
                <img src='/assets/img/logo.svg' alt="" className="h-8" />
              </a>
            </div>
            <div className="md:col-span-3 grid md:grid-cols-3 gap-y-6 gap-x-8 sm:gap-y-16">
              <div>
                <h4 className="text-white font-semibold mb-5">Políticas</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button href="#" className="hover:text-white transition-colors" onClick={() => setModalOpen(true)} >
                      Políticas de privacidad
                    </button>
                  </li>
                  <li>
                    <button href="#" className="hover:text-white transition-colors" onClick={() => setModalOpen(true)} >
                      Términos y Condiciones
                    </button>
                  </li>
                  <li>
                    <button href="#" className="hover:text-white transition-colors" onClick={() => setModalOpen(true)} >
                      Políticas de cambio
                    </button>
                  </li>
                  <li>
                    <button href="#" className="hover:text-white transition-colors" onClick={() => setModalOpen(true)} >
                      Libro de reclamaciones
                    </button>
                  </li>
                </ul>
              </div>

              <div className="md:col-span-2">
                <h4 className="text-white font-semibold mb-5">Únete a nuestro blog</h4>
                <p className="text-sm mb-5">Suscríbete y recibe todas nuestras novedades</p>
                <label className="flex border border-light w-full ps-6 p-2.5 rounded-full gap-2.5">
                  <input type="text" className="flex-1 bg-transparent text-light outline-none text-md" placeholder="Ingresa tu e-mail" />
                  <button className="bg-deep text-sm text-white px-6 py-3 rounded-full font-semibold transition-colors uppercase">
                    <i className="mdi mdi-send" />
                  </button>
                </label>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-5">Horario de atención</h4>
                <ul className="space-y-2 text-sm">
                  <li>Lun - Sab: 8:00 - 20:00</li>
                  <li>Dom: 11:30 - 18:00</li>
                </ul>
              </div>
              <div className="md:col-span-2">
                <h4 className="text-white font-semibold mb-5">Nuestras redes</h4>
                <ul className="flex gap-2 flex-wrap">
                  <li>
                    <a href="" className="flex items-center justify-center bg-light text-secondary w-8 h-8 rounded-full">
                      <i className="mdi mdi-facebook mdi-18px"></i>
                    </a>
                  </li>
                  <li>
                    <a href="" className="flex items-center justify-center bg-light text-secondary w-8 h-8 rounded-full">
                      <i className="mdi mdi-youtube mdi-18px"></i>
                    </a>
                  </li>
                  <li>
                    <a href="" className="flex items-center justify-center bg-light text-secondary w-8 h-8 rounded-full">
                      <i className="mdi mdi-instagram mdi-18px"></i>
                    </a>
                  </li>
                  <li>
                    <a href="" className="flex items-center justify-center bg-light text-secondary w-8 h-8 rounded-full">
                      <i className="mdi mdi-twitter mdi-18px"></i>
                    </a>
                  </li>
                  <li>
                    <a href="" className="flex items-center justify-center bg-light text-secondary w-8 h-8 rounded-full">
                      <i className=" mdi-18px"></i>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <section className="relative bg-container">
        <img src="/assets/img/utils/footer.png" alt="" className="absolute inset-0 w-full h-full object-cover z-0 opacity-20" />
        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center z-10 gap-6">
          <div className="flex-1 p-6 pb-3 md:pb-6">
            <h4 className="text-3xl font-semibold font-title uppercase mb-2">Ventas al por mayor al</h4>
            <p>Encuentra el repuesto exacto para tu vehículo con asesoría experta.</p>
          </div>
          <div className="p-6 pt-3 md:pt-6 pr-0 flex justify-end w-full md:w-auto">
            <a href="https://wa.me/51902680354?text=Hola%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20repuestos" className="relative bg-primary block font-semibold text-2xl px-6 py-2.5 pl-20 rounded-tl-[40px] rounded-bl-2xl">
              <i className="left-8 absolute mdi mdi-whatsapp mdi-36px" />
              +51 902 680 354
            </a>
          </div>
        </div>
      </section>
      <div className="p-2 text-xs text-center bg-light text-deep font-semibold flex gap-2 flex-wrap justify-center">
        <span>Copyright © 2026 {Global.APP_NAME}</span>
        <i className="mdi mdi-circle-small" />
        <span>Reservados todos los derechos</span>
        <i className="mdi mdi-circle-small" />
        <span>By <a href={`//devex.pe?utm_source=${Global.APP_CORRELATIVE}`}>{Global.APP_BY}</a></span>
      </div>

      {/* Modal para Términos y Condiciones */}
      <ReactModal
        isOpen={modalOpen}
        onRequestClose={closeModal}
        contentLabel="Términos y condiciones"
        className="absolute left-1/2 -translate-x-1/2 bg-container text-light p-6 rounded shadow-lg w-[95%] max-w-2xl my-8 outline-none h-[90vh]"
        overlayClassName="fixed inset-0 bg-[#040A14] bg-opacity-[88%] z-50"
      >
        <button onClick={closeModal} className="float-right text-gray-500 hover:text-gray-900">
          Cerrar
        </button>
        <h2 className="text-xl font-bold mb-4">Políticas de privacidad y condiciones de uso</h2>
        <HtmlContent className="prose h-[calc(90vh-120px)] lg:h-[calc(90vh-90px)] overflow-auto" html={terms?.description} />
      </ReactModal>
    </>
  );
};

export default Footer;
