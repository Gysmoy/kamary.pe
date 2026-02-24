import React, { useState } from "react"
import ReactModal from "react-modal"

ReactModal.setAppElement('#app');

const HairThickness = ({ test, setTest, values }) => {

  const [modalOpen, setModalOpen] = useState(false);

  const onTypeClicked = (hair_thickness) => {
    setTest(old => ({ ...old, hair_thickness }))
  }

  return <>
    <section className="p-[5%] py-[15%] md:py-[10%] lg:py-[5%] bg-white text-center text-[#404040]">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl mb-4">¿Cuál crees que es el <b className="font-bold text-[#303030]">grosor<br />de tu cabello?</b></h1>
        <div className="flex flex-wrap justify-center text-sm w-full mb-4 gap-4">
          {
            values
              .sort((a, b) => a.presentation_order - b.presentation_order)
              .map((value, index) => {
                return <button key={index} className="border border-1-[#9577B9] rounded-lg bg-white text-[#9577B9] hover:border-1-[#C5B8D4]  hover:bg-[#C5B8D4] hover:text-white font-bold w-[100px] md:w-32 transition-all"
                  onClick={() => onTypeClicked(value.id)}>
                  <img className="w-full aspect-[4/3] rounded hover:scale-105 transition-all object-center object-cover" src={`/assets/img/test/${value.correlative}.png`} alt={value.description} />
                  <p className="p-2 uppercase">{value.description}</p>
                </button>
              })
          }
        </div>
        <p className="text-sm mb-4">Conoce el grosor de tu cabello <button className="underline" onClick={() => setModalOpen(true)}>aquí</button></p>
      </div>
    </section>
    <ReactModal isOpen={modalOpen}
      onRequestClose={() => setModalOpen(false)}
      className='absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-white p-10 rounded-2xl shadow-lg w-[95%] max-w-md'
      overlayClassName={'fixed inset-0 bg-black bg-opacity-50 z-50'}
    >
      <span className="rounded-full px-4 py-2 bg-[#C5B8D4] text-white mx-auto block mb-4 w-max md:text-lg">Conoce el grosor de tu cabello</span>
      <span className="block text-xs md:text-sm text-center my-4">
        La capacidad de tu cabello para mantener un peinado puede indicar su grosor.
          <img
          className="w-3 inline-block ms-1"
           src="/assets/img/emojis/girl.png" alt="" />
      </span>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <span className="block my-2 w-24 mx-auto px-3 py-1.5 rounded-full border text-sm">Fino</span>
          <div className="text-[8px] md:text-[10px] text-center">
            El cabello fino no sujetará muy bien los rizos ni los peinados que te hagas, durarán muy poco tiempo.
          </div>
        </div>
        <div>
          <span className="block my-2 w-24 mx-auto px-3 py-1.5 rounded-full border text-sm">Medio</span>
          <div className="text-[8px] md:text-[10px] text-center">
            El cabello medio es relativamente fácil de peinar y mantendrá su forma por más tiempo.
          </div>
        </div>
        <div>
          <span className="block my-2 w-24 mx-auto px-3 py-1.5 rounded-full border text-sm">Grueso</span>
          <div className="text-[8px] md:text-[10px] text-center">
            El cabello grueso sujeta bien los rizos, pero puede ser difícil peinarlo porque tiene menos volumen.
          </div>
        </div>
      </div>
    </ReactModal>
  </>
}

export default HairThickness