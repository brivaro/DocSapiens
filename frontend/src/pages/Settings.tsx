import React from "react";

const Settings: React.FC = () => (
  <div className="max-w-2xl mx-auto p-6">
    <h1 className="text-[#0d141c] text-2xl font-bold mb-6">Configuración</h1>
    <div className="bg-white rounded-xl border border-[#cedbe8] p-6 mb-6">
      <h2 className="text-lg font-semibold mb-2">Gestión de claves API</h2>
      <p className="text-[#49739c] mb-4">Aquí podrás crear, revocar y gestionar tus claves API para acceder al backend.</p>
      {/* Aquí irá el componente de gestión de claves API */}
      <button className="bg-[#0c7ff2] text-white px-4 py-2 rounded-xl font-bold">Crear nueva API Key</button>
    </div>
    <div className="bg-white rounded-xl border border-[#cedbe8] p-6">
      <h2 className="text-lg font-semibold mb-2">Configuración general</h2>
      <p className="text-[#49739c]">Opciones de configuración global de la plataforma.</p>
    </div>
  </div>
);

export default Settings; 