import { useRoutes } from 'react-router-dom'

import { Entry } from './pages/Entry'
import { Projects } from './pages/Projects'
import { ProjectDetails } from './pages/ProjectDetails'
import { ServicesPage } from './pages/Services'
import { PackagesPage } from './pages/Packages'
import { AboutPage } from './pages/About'
import { ContactPage } from './pages/Contact'
import { ConsultationPage } from './pages/Consultation'
import { StartProjectPage } from './pages/StartProject'
import { NotFoundPage } from './pages/NotFound'

const routes = [
  { path: '/', Component: Entry },
  { path: '/projects', Component: Projects },
  { path: '/projects/:id', Component: ProjectDetails },
  { path: '/services', Component: ServicesPage },
  { path: '/packages', Component: PackagesPage },
  { path: '/about', Component: AboutPage },
  { path: '/contact', Component: ContactPage },
  { path: '/consultation', Component: ConsultationPage },
  { path: '/start-project', Component: StartProjectPage },
  { path: '/*', Component: NotFoundPage },
]

export default function App() {
  return useRoutes(routes)
}
