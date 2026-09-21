import { NavLink, Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { PERSON_VIEWS } from '../../lib/constants.js';

const NAV_ITEMS = [
  { to: '/', label: 'Översikt', icon: '🏠', end: true },
  { to: '/uppdrag', label: 'Uppdrag', icon: '📋' },
  { to: '/karta', label: 'Karta', icon: '🗺️' },
  { to: '/maskiner', label: 'Maskiner', icon: '🔧' },
  { to: '/planering', label: 'Planering', icon: '🗓️' },
];

export default function Layout() {
  const { personView, setPersonView, office } = useApp();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="topbar-logo">HE</span>
          <div>
            <div className="topbar-title">Hässleholm Entreprenad AB</div>
            <div className="topbar-subtitle">
              {office ? office.address : 'Laddar kontorsplats…'}
            </div>
          </div>
        </div>

        <nav className="topbar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 'topbar-nav-link' + (isActive ? ' active' : '')}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="user-switcher">
          {PERSON_VIEWS.map((view) => (
            <button
              key={view}
              type="button"
              className={'user-pill' + (personView === view ? ' active' : '')}
              onClick={() => setPersonView(view)}
            >
              {view}
            </button>
          ))}
        </div>
      </header>

      <main className="app-content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => 'bottom-nav-link' + (isActive ? ' active' : '')}
          >
            <span className="bottom-nav-icon" aria-hidden="true">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
