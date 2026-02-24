import React, { useEffect } from 'react'

const FilterPagination = ({ current, setCurrent, pages }) => {
  const array = new Array(pages || 1)
  array.fill(null)

  const onPrevPageClicked = () => {
    const page = current--
    setCurrent(page < 1 ? 1 : page)
  }

  const onNextPageClicked = () => {
    const page = current--
    setCurrent(page > pages ? pages : page)
  }

  useEffect(() => {
    if (current > pages) setCurrent(pages);
  }, [pages, current])

  return (<>
    <nav aria-label="Page navigation example w-full">
      <ul className="flex flex-wrap items-center gap-2 -space-x-px text-base justify-center">
        <li>
          <button className="cursor-pointer flex items-center justify-center px-4 h-10 w-10 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700" onClick={onPrevPageClicked} type='button'>
            <span className="sr-only">Previous</span>
            <i className='mdi mdi-arrow-left'></i>
          </button>
        </li>
        {
          array.map((x, i) => {
            if ((i + 1) == current - 4 || (i + 1) == current + 4) {
              return <li key={`item-${i}`}>
                <button aria-current="page" className='z-10 flex items-center justify-center px-4 h-10 w-10 leading-tight bg-transparent text-gray-500 hover:text-gray-700 cursor-default' type='button'>···</button>
              </li>
            }
            return <li key={`item-${i}`} className={(i + 1) > current - 4 && (i + 1) < current + 4 ? 'block' : 'hidden'}>
              <button aria-current="page" className={`cursor-pointer z-10 flex items-center justify-center px-4 h-10 w-10 leading-tight  ${current == i + 1 ? 'bg-[#2E405E] text-white cursor-default' : 'bg-gray-100 text-gray-500 hover:text-gray-700'}`} onClick={() => setCurrent(i + 1)} type='button'>{i + 1}</button>
            </li>
          })
        }
        <li>
          <button className="cursor-pointer flex items-center justify-center px-4 h-10 w-10 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700" onClick={onNextPageClicked} type='button'>
            <span className="sr-only">Next</span>
            <i className='mdi mdi-arrow-right'></i>
          </button>
        </li>
      </ul>
    </nav>
  </>)
}

export default FilterPagination