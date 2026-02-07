import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { House, File, ChatCircleDots, Gear, ArrowCircleLeft, ArrowCircleRight } from 'phosphor-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: House },
  { name: 'Documents', path: '/documents', icon: File },
  { name: 'Chat', path: '/chat', icon: ChatCircleDots },
  { name: 'Settings', path: '/settings', icon: Gear },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();

  return (
    <aside 
      className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-40 ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-gray-200">
        <img src={"/docsapiens.png"} alt="DocSapiens Logo" className="w-8 h-8 rounded-full" />
        {!isCollapsed && <span className="text-xl font-bold text-gray-800">DocSapiens</span>}
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-4 p-3 rounded-lg text-gray-600 hover:bg-slate-100 hover:text-blue-600 transition-colors ${isActive ? 'bg-blue-50 text-blue-600 font-semibold' : ''}`}
            >
              <Icon size={24} weight={isActive ? 'fill' : 'regular'} />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Botón de Colapsar */}
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={onToggle} 
          className="flex items-center gap-4 w-full p-3 rounded-lg text-gray-600 hover:bg-slate-100"
        >
          {isCollapsed ? <ArrowCircleRight size={24} /> : <ArrowCircleLeft size={24} />}
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;