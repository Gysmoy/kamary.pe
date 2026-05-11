import Tippy from "@tippyjs/react";
import React, { useEffect, useRef } from "react"
import { Cookies, JSON } from "sode-extend-react"

const SelectAPIFormGroup = ({ id, col, label, specification, eRef, required = false, dropdownParent, searchAPI, searchBy, selectBy = 'id', multiple = false, filter = null, onChange = () => { },
  templateResult,
  templateSelection,
  tags
}) => {
  if (!eRef) eRef = useRef();
  const generatedIdRef = useRef(id || `select-${crypto.randomUUID()}`);
  const selectId = id || generatedIdRef.current;
  const containerId = `container-${selectId}`
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const $select = $(eRef.current)
    if ($select.data('select2')) $select.select2('destroy')

    $select.select2({
      dropdownParent: dropdownParent ? $(dropdownParent) : $(`#${containerId}`),
      minimumInputLength: 0,
      minimumResultsForSearch: 0,
      tags,
      ajax: {
        url: searchAPI,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Xsrf-Token': decodeURIComponent(Cookies.get('XSRF-TOKEN'))
        },
        type: "POST",
        quietMillis: 50,
        data: function ({ term, page }) {
          return JSON.stringify({
            sort: [
              {
                selector: searchBy,
                desc: false
              }
            ],
            skip: ((page ?? 1) - 1) * 10,
            take: 10,
            filter: filter ? [
              [
                searchBy,
                "contains",
                term || ''
              ], 'and', filter
            ] : [
              searchBy,
              "contains",
              term || ''
            ]
          })
        },
        processResults: function (data, { page }) {
          return {
            results: (data?.data ?? []).map((x) => {
              const flatten = JSON.flatten(x)
              return {
                id: x[selectBy],
                text: flatten[searchBy],
                data: x
              }
            }),
            pagination: {
              more: ((page ?? 1) * 10) < data.totalCount,
            },
          };
        },
      },
      templateResult,
      templateSelection
    })

    $select.off('change.selectAPIFormGroup').on('change.selectAPIFormGroup', (e) => onChangeRef.current(e))

    return () => {
      $select.off('change.selectAPIFormGroup')
      if ($select.data('select2')) $select.select2('destroy')
    }
  }, [dropdownParent, filter, searchAPI, searchBy, selectBy, multiple, tags])

  return <div id={containerId} className={`form-group ${col} mb-2`}>
    <label htmlFor={selectId} className="form-label">
      {
        label &&
        <>
          {label} {required && <b className="text-danger">*</b>}
          {specification && <Tippy content={specification}>
            <small className="ms-1 fa fa-question-circle text-muted"></small>
          </Tippy>
          }
        </>
      }
    </label>
    <select ref={eRef} id={selectId} data-select2-managed="component" required={required} className='form-control' style={{ width: '100%' }} multiple={multiple}></select>
  </div>
}

export default SelectAPIFormGroup
