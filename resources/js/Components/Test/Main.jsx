import React from "react"
import BreakdownsRest from "../../actions/BreakdownsRest"

const breakdownsRest = new BreakdownsRest()

const Main = ({ test, setTest, setFirstTime, userFormulasCount }) => {
  const onStartTestClicked = async (refresh) => {
    breakdownsRest.save({ field: 'started_test' })
    setFirstTime(false)
    if (refresh) {
      setTest({ has_started: true })
    } else {
      setTest(old => ({ ...old, has_started: true }))
    }
  }

  return <section className='p-[5%] py-[10%] md:py-[7.5%] lg:py-[5%] bg-white text-center'
    style={{
      backgroundImage: 'url(/assets/img/test/bg-image.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'top',
      backgroundRepeat: 'no-repeat'
    }}>
    <div className='max-w-md mx-auto'>
      <h1 className='text-2xl md:text-3xl'>
        Test para <b>crear tu fórmula única.</b>
      </h1>
      <p className='my-[5%] text-sm'>
        En  menos de dos minutos, creemos juntos una fórmula única para el cuidado de tu cabello.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 mx-auto md:mx-[12.5%]">
        <button className='bg-[#C5B8D4] text-white text-sm px-8 py-3 rounded border border-white w-max  text-nowrap' onClick={() => onStartTestClicked(false)}>{
          test.has_started
            ? 'CONTINUAR TEST'
            : '¡EMPIEZA AHORA!'
        }</button>
        {
          test.has_started &&
          <button className='bg-white text-[#9577B9] text-sm px-8 py-3 rounded border border-white w-max text-nowrap' onClick={() => onStartTestClicked(true)}>REINICIAR TEST</button>
        }

        {
          userFormulasCount > 0 &&
          <button
            href='/my-account'
            className='bg-white text-[#9577B9] text-sm px-8 py-3 rounded border border-white w-max text-nowrap'>
            MIS FÓRMULAS
            <i className="ms-1 mdi mdi-arrow-top-right"></i>
          </button>
        }
      </div>
      <figure className='h-[50vh]'></figure>
    </div>
  </section>
}

export default Main 