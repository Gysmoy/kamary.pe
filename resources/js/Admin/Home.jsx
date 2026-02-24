import { Chart, registerables } from 'chart.js';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '../Components/Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';

Chart.register(...registerables);
const Home = ({ }) => {

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100dvh - 150px)' }}>
      <div className="text-center">
        <a href="/admin/users" className="btn btn-sm btn-success btn-lg mx-2">
          <i className='mdi mdi-account-multiple me-1'></i>
          Usuarios MasterSet
        </a>
        <a href="/admin/sales" className="btn btn-sm btn-info btn-lg mx-2">
          <i className='mdi mdi-cart me-1'></i>
          Ver Pedidos
        </a>
      </div>
    </div>
  );
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<BaseAdminto {...properties} title="Dashboard">
    <Home {...properties} />
  </BaseAdminto>);
})