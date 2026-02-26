import { Chart, registerables } from 'chart.js';
import { createRoot } from 'react-dom/client';
import BaseAdminto from '../Components/Adminto/Base';
import CreateReactScript from '../Utils/CreateReactScript';

Chart.register(...registerables);
const Home = ({ }) => {

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100dvh - 150px)' }}>
      <div className="text-center">
        {/* Three rotating gears using MDI icons */}
        <div className="mb-3">
          <i className="mdi mdi-cog mdi-spin text-primary" style={{ fontSize: '1.5rem' }}></i>
          <i className="mdi mdi-cog mdi-spin text-primary" style={{ fontSize: '2.5rem' }}></i>
          <i className="mdi mdi-cog mdi-spin text-primary" style={{ fontSize: '2rem' }}></i>
        </div>
        <h1 className="mb-2">Próximamente</h1>
        <p className="text-muted">Esta sección está en construcción</p>
      </div>
    </div>
  );
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<BaseAdminto {...properties} title="Dashboard">
    <Home {...properties} />
  </BaseAdminto>);
})