import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '@Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';
import Table from '../Components/Adminto/Table';
import Modal from '../Components/Adminto/Modal';
import InputFormGroup from '../Components/Adminto/Form/InputFormGroup';
import SelectFormGroup from '../Components/Adminto/Form/SelectFormGroup';
import Swal from 'sweetalert2';
import CardsRest from '../Actions/Admin/cards-rest';
import ReactAppend from '../Utils/ReactAppend';

const cardsRest = new CardsRest()

const Cards = ({ }) => {
  const gridRef = useRef()
  return (<>
    <Table gridRef={gridRef} title='Cartas' rest={cardsRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
          }
        });
      }}
      columns={[
        {
          dataField: 'id',
          caption: 'ID',
          visible: false
        },
        {
          caption: 'Imagen',
          width: '70px',
          allowFiltering: false,
          allowExporting: false,
          cellTemplate: (container, { data }) => {
            container.css('padding', '5px');
            ReactAppend(container,<img
                src={`//assets.tcgdex.net/${data.language.code}/${data.expansion.serie.code}/${data.expansion.code}/${data.code.split('-')[1]}/low.webp`}
                alt={data.name}
                className="d-block mx-auto"
                style={{ height: '80px', width: '60px', objectFit: 'contain' }}
                onError={e => { e.target.src = '/images/default/card.png'; }}
              />);
          }
        },
        {
          dataField: 'pokemon.name',
          caption: 'Pokémon',
        },
        {
          dataField: 'expansion.name',
          caption: 'Expansión',
        },
        {
          dataField: 'language.name',
          caption: 'Idioma',
        },
        {
          dataField: 'code',
          caption: 'Código',
        },
        {
          dataField: 'name',
          caption: 'Nombre',
        },
        {
          dataField: 'number',
          caption: 'Número',
          dataType: 'number',
          width: '90px',
        },
        {
          dataField: 'fullname',
          caption: 'Nombre completo',
        },
        {
          dataField: 'items_count',
          caption: 'En venta',
          dataType: 'number',
          width: '90px',
        },
      ]} />
  </>
  )
}

CreateReactScript((el, properties) => {

  createRoot(el).render(<BaseAdminto {...properties} title='Cartas'>
    <Cards {...properties} />
  </BaseAdminto>);
})