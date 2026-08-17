import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import History from './pages/History'
import Check from './pages/Check'
import SyncBar from './components/SyncBar'
import SyncGate from './components/SyncGate'

export default function App() {
  return (
    <HashRouter>
      <SyncGate>
        <div className="app">
          <header className="topbar">
            <span className="brand">Fit Log</span>
            <nav>
              <NavLink to="/" end>
                내 옷 이력
              </NavLink>
              <NavLink to="/check">새 옷 판정</NavLink>
            </nav>
            <SyncBar />
          </header>
          <main className="content">
            <Routes>
              <Route path="/" element={<History />} />
              <Route path="/check" element={<Check />} />
            </Routes>
          </main>
        </div>
      </SyncGate>
    </HashRouter>
  )
}
