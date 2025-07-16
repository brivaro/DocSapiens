import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full py-32">
    <h1 className="text-4xl font-bold text-[#0d141c] mb-4">404 - Página no encontrada</h1>
    <p className="text-[#49739c] mb-6">La página que buscas no existe o ha sido movida.</p>
    <Link to="/dashboard" className="bg-[#0c7ff2] text-white px-6 py-3 rounded-xl font-bold">Ir al Dashboard</Link>
  </div>
);

export default NotFound; 