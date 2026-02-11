import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';

import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Chat from './pages/Chat';
import NotFound from './pages/NotFound';
import Collections from './pages/Collections';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="documents" element={<Documents />} />
        <Route path="chat" element={<Chat />} />
        <Route path="collections" element={<Collections />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;