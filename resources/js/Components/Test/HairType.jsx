import React, { useState } from "react"
import ReactModal from "react-modal"

ReactModal.setAppElement('#app');

const HairType = ({ test, setTest, values }) => {

  const [modalOpen, setModalOpen] = useState(false);

  const onTypeClicked = (hair_type) => {
    setTest(old => ({ ...old, hair_type }))
  }

  return <>
    <section className="p-[5%] py-[15%] md:py-[10%] lg:py-[5%] bg-white text-center text-[#404040]">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl mb-4">Naturalmente, ¿Cuál es tu <br /><b className="font-bold text-[#303030]">tipo de cabello?</b></h1>
        <div className="flex flex-wrap justify-center text-sm w-full mb-4 gap-4">
          {
            values
              .sort((a, b) => a.presentation_order - b.presentation_order)
              .map((value, index) => {
                return <button key={index} className="border border-1-[#9577B9] rounded-lg bg-white text-[#9577B9] hover:border-1-[#C5B8D4]  hover:bg-[#C5B8D4] hover:text-white font-bold w-32 min-w-32 transition-all"
                  onClick={() => onTypeClicked(value.id)}>
                  <img className="w-full aspect-[4/3] rounded hover:scale-105 transition-all" src={`/assets/img/test/${value.correlative}.png`} alt={value.description} />
                  <p className="p-2 uppercase">{value.description}</p>
                </button>
              })
          }
        </div>
        <p className="text-sm mb-4">Conoce tu tipo de cabello <button className="underline" onClick={() => setModalOpen(true)}>aquí </button></p>
      </div>
    </section>
    <ReactModal isOpen={modalOpen}
      onRequestClose={() => setModalOpen(false)}
      className='absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-white p-10 rounded-2xl shadow-lg w-[95%] max-w-xl '
      overlayClassName={'fixed inset-0 bg-black bg-opacity-50 z-50'}
    >
      <span className="rounded-full px-4 py-2 bg-[#C5B8D4] text-white mx-auto block md:text-lg mb-4 w-max">¿Con cuál te identificas?</span>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
        <div>
          <img className="p-[2.5%] md:p-[5%] w-full aspect-square rounded-full" src="/assets/img/test/ht-straight.png" alt="Lacio" />
          <span className="block my-2 w-max mx-auto px-3 py-1.5 rounded-full border text-sm">Lacio</span>
          <div className="text-[8px] md:text-[10px] text-start">
            Por lo general es más brillante y plano. No se le forman ondas naturalmente y tampoco es fácil que mantenga un peinado por mucho tiempo, pues tiende a regresar a su forma natural.
          </div>
        </div>
        <div>
          <img className="p-[2.5%] md:p-[5%] w-full aspect-square rounded-full" src="/assets/img/test/ht-wavy.png" alt="Ondulado" />
          <span className="block my-2 w-max mx-auto px-3 py-1.5 rounded-full border text-sm">Ondeado</span>
          <div className="text-[8px] md:text-[10px] text-start">
            Se trata de cabellos que forman la letra S en todo lo largo de los rizos o de las ondas. Su forma siempre inicia próximo al cuero cabelludo y mantienen la misma forma sin importar el corte que presente.
          </div>
        </div>
        <div>
          <img className="p-[2.5%] md:p-[5%] w-full aspect-square rounded-full" src="/assets/img/test/ht-curly.png" alt="Rizado" />
          <span className="block my-2 w-max mx-auto px-3 py-1.5 rounded-full border text-sm">Rizado</span>
          <div className="text-[8px] md:text-[10px] text-start">
          Forma rizos definidos en espiral desde la mitad del cabello hacia las puntas. Tiene buen volumen, es propenso al frizz y necesita hidratación para mantener su forma.
          </div>
        </div>
        <div>
          <img className="p-[2.5%] md:p-[5%] w-full aspect-square rounded-full" src="/assets/img/test/ht-coily.png" alt="Crespo" />
          <span className="block my-2 w-max mx-auto px-3 py-1.5 rounded-full border text-sm">Crespo</span>
          <div className="text-[8px] md:text-[10px] text-start">
            Presenta bucles que comienzan en el cuero cabelludo en dirección hacia abajo hasta llegar a las puntas. Los rizos son abiertos, hidratados y con brillo. Suelen tener poca definición y son propensos al frizz.
          </div>
        </div>

      </div>
    </ReactModal>
  </>
}

export default HairType