import React from "react"

const ProgressBar = ({ className = 'max-w-md', width, color = '#F7C2C6', isSecondary = false, formulaIndex }) => {
  return <div className={`h-2 bg-[#EFEAE5] ${className} rounded-full mx-auto relative`}>
    <hr className={`h-full rounded-full`} style={{
      backgroundColor: color,
      width: width,
      transition: 'all .25s'
    }} />

    {
      isSecondary &&
      <div className="relative">
        <span className='absolute text-xs text-nowrap top-3 transition-all -translate-x-1/2 bg-[#A191B8] text-white px-2 py-0.5 rounded-full before:content-[""] before:absolute before:top-[-6px] before:left-1/2 before:-translate-x-1/2 before:border-l-[6px] before:border-l-transparent before:border-r-[6px] before:border-r-transparent before:border-b-[6px] before:border-b-[#A191B8]' style={{
          left: width
        }}>
          {formulaIndex}<sup>a</sup> fórmula
        </span>
      </div>
    }
  </div>
}

export default ProgressBar