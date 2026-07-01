import { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import SpreadCollection from './pages/SpreadCollection'
import Portfolio from './pages/Portfolio'
import Admin from './pages/Admin'
import Apply from './pages/Apply'

type Page = 'dashboard' | 'spread' | 'portfolio' | 'admin' | 'apply'

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')

  return (
    <Layout page={page} setPage={setPage}>
      {page === 'dashboard' && <Dashboard setPage={setPage} />}
      {page === 'spread'    && <SpreadCollection />}
      {page === 'portfolio' && <Portfolio />}
      {page === 'admin'     && <Admin />}
      {page === 'apply'     && <Apply />}
    </Layout>
  )
}
