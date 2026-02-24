import { createRoot } from 'react-dom/client';
import Base from './Components/Tailwind/Base';
import CreateReactScript from './Utils/CreateReactScript';
import Banner from './Components/Home/Banner';
import Brands from './Components/Home/Brands';
import Categories from './Components/Home/Categories';
import Items from './Components/Home/Items';
import Bundles from './Components/Home/Bundles';
import Courses from './Components/Home/Courses';

const Home = ({ }) => {
  return (<main className='overflow-hidden'>
    <Banner />
    <div className='relative space-y-8 sm:space-y-16 lg:space-y-20 py-8 sm:py-16 lg:py-20'>
      <Brands />
      <Categories />
      <Bundles />
      <Items />
      <Courses />
    </div>
  </main>);
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<Base {...properties} title='Inicio'>
    <Home {...properties} />
  </Base>);
})