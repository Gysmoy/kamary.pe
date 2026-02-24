import { createRoot } from 'react-dom/client';
import BaseAdminto from '../Components/Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';

const Home = ({ }) => {
  return (
    <div className='d-flex flex-column align-items-center justify-content-center' style={{ height: 'calc(100dvh - 145px)' }}>
      <h1 className='text-center mb-4'>Dashboard</h1>
      <div className='d-flex gap-3'>
        <a href='/seller/sales' className='btn btn-primary'>Mis Pedidos</a>
        <a href='/seller/cards' className='btn btn-primary'>Mis Cartas</a>
      </div>
    </div>
  );
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<BaseAdminto {...properties} title="Dashboard">
    <Home {...properties} />
  </BaseAdminto>);
})