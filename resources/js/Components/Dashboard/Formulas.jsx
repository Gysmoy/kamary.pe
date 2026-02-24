import React, { useState } from 'react';
import FormulaCard from './Components/FormulaCard';

const Formulas = ({ items }) => {

  const [formulas, setFormulas] = useState(items)

  return (
    <div>
      <h2 className='text-xl border-b pb-2 mb-4 font-bold'>
        Tus fórmulas 🫧
      </h2>
      <div className='flex flex-col gap-12 pb-4 items-center relative'>
        {
          formulas.length == 0 && <div className='mx-auto text-center'>
            <h1 className='text-2xl font-bold mb-4'>Ups!</h1>
            <p className='text-sm mb-4'>Al parecer no tienes formulas</p>
            <button href="/test" className='rounded-full px-3 py-2 text-white bg-[#A191B8] text-sm'>CREA TU FÓRMULA</button>
          </div>
        }
        {
          formulas.map((item, index) => {
            return <FormulaCard key={index} {...item} index={index} setFormulas={setFormulas} />
          })
        }
      </div>
    </div>
  );
}

export default Formulas;
