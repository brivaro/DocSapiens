import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { Toaster } from 'sonner';

const App: React.FC = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors /> 
      <div className="flex h-screen bg-slate-100 overflow-hidden"> {/* Cambiado a h-screen y overflow-hidden */}
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!isSidebarCollapsed)} 
        />
        <div 
          className="flex-1 flex flex-col transition-all duration-300"
          style={{ marginLeft: isSidebarCollapsed ? '80px' : '256px' }}
        >
          <Navbar />
          {/* 
            CAMBIO CLAVE:
            - Este 'main' ahora es un contenedor de layout que no puede desbordarse.
            - Ocupa el espacio restante y le pasa la responsabilidad del scroll a sus hijos.
          */}
          <main className="flex-1 p-4 sm:p-6 flex flex-col overflow-hidden">
            <Routes>
              <Route path="/" element={<Navigate to="/documents" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;