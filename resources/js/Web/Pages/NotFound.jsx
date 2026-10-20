import { createRoot } from 'react-dom/client'
import CreateReactScript from '../../Utils/CreateReactScript'
import Layout from '../components/Layout'
import NotFoundContent from '../components/NotFoundContent'

CreateReactScript((el, properties) => {
  createRoot(el).render(<Layout><NotFoundContent {...properties} /></Layout>)
})
