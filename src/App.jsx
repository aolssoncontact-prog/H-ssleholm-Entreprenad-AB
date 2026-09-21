import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout.jsx';
import LoadingScreen from './components/common/LoadingScreen.jsx';
import { useApp } from './context/AppContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Missions from './pages/Missions.jsx';
import MissionDetail from './pages/MissionDetail.jsx';
import MapView from './pages/MapView.jsx';
import Machines from './pages/Machines.jsx';
import Schedule from './pages/Schedule.jsx';

export default function App() {
  const { loading } = useApp();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/uppdrag" element={<Missions />} />
        <Route path="/uppdrag/:id" element={<MissionDetail />} />
        <Route path="/karta" element={<MapView />} />
        <Route path="/maskiner" element={<Machines />} />
        <Route path="/planering" element={<Schedule />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
