import React, { useEffect, useState } from "react"
import FilterPagination from "../../Reutilizables/Pagination/FilterPagination"
import PostCard from "./PostCard"
import PostsRest from "../../Actions/PostsRest"
import ArrayJoin from "../../Utils/ArrayJoin"

const postsRest = new PostsRest()

const Results = ({ filter }) => {
  const [results, setResults] = useState([])
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const filter2search = [
      ['name', 'contains', filter.search],
      ['summary', 'contains', filter.search],
    ];
    if (filter.category) {
      filter2search.push([
        'category.id', '=', filter.category
      ])
    }

    postsRest.paginate({
      filter: ArrayJoin(filter2search, 'and'),
      requireTotalCount: true,
      skip: 12 * (currentPage - 1),
      sort: [{ selector: 'post_date', desc: filter.sortOrder == 'desc' }],
      take: 12,
    })
      .then(({ status, data, totalCount }) => {
        if (status != 200) return
        setPages(Math.ceil(totalCount / 12))
        setResults(data)
      })

  }, [filter, currentPage])

  return <>
    <section className="p-[5%] pt-0 grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {
        results.map((item, index) => {
          return <PostCard key={index} {...item} firstImage />
        })
      }
    </section>
    <div className="p-[5%]">
      <FilterPagination pages={pages} current={currentPage} setCurrent={setCurrentPage} />
    </div>
  </>
}

export default Results