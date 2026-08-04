import Tippy from "@tippyjs/react";
import React, { useEffect, useRef } from "react"
import { JSON } from "sode-extend-react"
import select2SpanishLanguage from "../../../Utils/select2SpanishLanguage"
import { select2DropdownParentFor } from "../../../Utils/select2DropdownParent"
import { installSelect2ModalFixes } from "../../../Utils/select2ModalFixes"
import xsrfToken from "../../../Utils/xsrfToken"

const SelectAPIFormGroup = ({ id, col, label, specification, eRef, required = false, disabled = false, dropdownParent, searchAPI, searchBy, selectBy = 'id', multiple = false, filter = null, extraParams = null, onChange = () => { },
  templateResult,
  templateSelection,
  tags,
  append = null
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
    installSelect2ModalFixes()
    const $select = $(eRef.current)
    if ($select.data('select2')) $select.select2('destroy')

    $select.select2({
      dropdownParent: select2DropdownParentFor(eRef.current, dropdownParent, `#${containerId}`),
      minimumInputLength: 0,
      minimumResultsForSearch: 0,
      language: select2SpanishLanguage,
      tags,
      ajax: {
        url: searchAPI,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Xsrf-Token': xsrfToken()
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
            ],
            ...(extraParams || {})
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

    $select.prop('disabled', !!disabled)

    $select.off('change.selectAPIFormGroup').on('change.selectAPIFormGroup', (e) => onChangeRef.current(e))

    return () => {
      $select.off('change.selectAPIFormGroup')
      if ($select.data('select2')) $select.select2('destroy')
    }
  }, [dropdownParent, filter, extraParams, searchAPI, searchBy, selectBy, multiple, tags, disabled])

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
    {append ? (
      <div className="d-flex align-items-center gap-1">
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <select ref={eRef} id={selectId} data-select2-managed="component" required={required} disabled={disabled} className='form-control' style={{ width: '100%' }} multiple={multiple}></select>
        </div>
        {append}
      </div>
    ) : (
      <select ref={eRef} id={selectId} data-select2-managed="component" required={required} disabled={disabled} className='form-control' style={{ width: '100%' }} multiple={multiple}></select>
    )}
  </div>
}

export default SelectAPIFormGroup
