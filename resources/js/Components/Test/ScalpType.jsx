import React, { useState } from "react"
import ReactModal from "react-modal"

ReactModal.setAppElement('#app');

const ScalpType = ({ test, setTest, values }) => {

  const [modalOpen, setModalOpen] = useState(false);

  const onTypeClicked = (scalp_type) => {
    setTest(old => ({ ...old, scalp_type }))
  }

  const fragrances = {
    dry: '🍂',
    normal: '🍃',
    oily: '💧'
  }

  return <>
    <section className="p-[5%] py-[15%] md:py-[10%] lg:py-[5%] bg-white text-center text-[#404040]">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl mb-4 font-light">Tu <b className="font-bold text-[#303030]">cuero cabelludo</b> es:</h1>
        <div className="flex justify-evenly text-sm w-full mb-4 gap-2 h-32">
          {
            values.map((value, index) => {
              return <figure key={index} className="flex flex-col gap-4 text-4xl transition-all group">
                <button className="w-28 py-2 rounded border border-[#9577B9] text-[#9577B9] hover:border-[#C5B8D4] hover:bg-[#C5B8D4] hover:text-white font-bold text-base uppercase" onClick={() => onTypeClicked(value.id)}>
                  {value.description}
                </button>
                <img
                  className="w-10 h-auto mx-auto transform transition-all duration-300 group-hover:w-12"
                  src={`/assets/img/scalp_types/${value.correlative}.png`}
                />
              </figure>
            })
          }
        </div>
        <p className="text-sm mb-4">Conoce tu tipo de cuero cabelludo <button className="underline" onClick={() => setModalOpen(true)}>aquí </button></p>
      </div>
    </section>
    <ReactModal isOpen={modalOpen}
      onRequestClose={() => setModalOpen(false)}
      className='absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-white p-10 rounded-2xl shadow-lg w-[95%] max-w-xl '
      overlayClassName={'fixed inset-0 bg-black bg-opacity-50 z-50'}
    >
      <span className="rounded-full px-4 py-2 bg-[#C5B8D4] text-white md:text-lg mx-auto block mb-4 w-max">¿Con cuál te identificas?</span>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <img className="p-[2.5%] md:p-[5%] aspect-square rounded-full" src="/assets/img/test/dry.png" alt="" />
          <span className="block my-2 w-max mx-auto px-3 py-1.5 rounded-full border text-sm">Seco</span>
          <ul className="text-[8px] md:text-[10px] text-start">
            <li className="flex gap-1">
              <i className="mdi mdi-circle-small font-bold"></i>
              Tiene un aspecto apagado.</li>
            <li className="flex gap-1">
              <i className="mdi mdi-circle-small font-bold"></i>
              Es áspero al tacto.</li>
            <li className="flex gap-1">
              <i className="mdi mdi-circle-small font-bold"></i>
              Se enreda fácilmente y es difícil de peinar.</li>
            <li className="flex gap-1">
              <i className="mdi mdi-circle-small font-bold"></i>
              Presenta puntas abiertas o bifurcadas.</li>
            <li className="flex gap-1">
              <i className="mdi mdi-circle-small font-bold"></i>
              Suele tener electricidad estática.</li>
          </ul>
        </div>
        <div>
          <img className="p-[2.5%] md:p-[5%] aspect-square rounded-full" src="/assets/img/test/normal.png" alt="" />
          <span className="block my-2 w-max mx-auto px-3 py-1.5 rounded-full border text-sm">Normal</span>
          <ul className="text-[8px] md:text-[10px] text-start">
            <li className="flex gap-1">
              <i className="mdi mdi-circle-small font-bold"></i>
              Se mantiene bien el peinado.</li>
            <li className="flex gap-1">
              <i className="mdi mdi-circle-small font-bold"></i>
              Casi siempre presenta un buen aspecto.</li>
            <li className="flex gap-1">
              <i className="mdi mdi-circle-small font-bold"></i>
              Al tacto no es graso ni seco.</li>
            <li className="flex gap-1">
              <i className="mdi mdi-circle-small font-bold"></i>
              Tiene un aspecto brillante y sano.</li>
          </ul>
        </div>
        <div>
          <img className="p-[2.5%] md:p-[5%] aspect-square rounded-full" src="/assets/img/test/oily.png" alt="" />
          <span className="block my-2 w-max mx-auto px-3 py-1.5 rounded-full border text-sm">Graso</span>
          <ul className="text-[8px] md:text-[10px] text-start">
            <li className="flex gap-1">
              <i className="mdi mdi-circle-small font-bold"></i>
              Después del lavado, la grasa aparece enseguida.</li>
            <li className="flex gap-1">
              <i className="mdi mdi-circle-small font-bold"></i>
              No presenta el brillo.</li>
            <li className="flex gap-1">
              <i className="mdi mdi-circle-small font-bold"></i>
              Se ve sin firmeza y no tiene volumen.</li>
            <li className="flex gap-1">
              <i className="mdi mdi-circle-small font-bold"></i>
              Se pega al cuero cabelludo y tiende a que se adhiera con mayor facilidad el polvo.</li>
          </ul>
        </div>
      </div>
    </ReactModal>
  </>
}

export default ScalpType