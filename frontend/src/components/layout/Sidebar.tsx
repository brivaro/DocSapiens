import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { 
    House, FileText, ChatCircleDots, Books,
    ArrowCircleLeft, ArrowCircleRight 
} from 'phosphor-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: House },
  { name: 'Colecciones', path: '/collections', icon: Books },
  { name: 'Documentos', path: '/documents', icon: FileText },
  { name: 'Chat IA', path: '/chat', icon: ChatCircleDots },
];
interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={clsx(
        "fixed top-0 left-0 z-40 h-screen bg-gray-900 border-r border-gray-700 flex flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header del Sidebar (Logo) */}
      <div className="flex items-center h-16 px-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-center w-12 flex-shrink-0">
           {/* LOGO PERSONALIZADO */}
           <img 
             src="/docsapiens.png" 
             alt="Logo" 
             className="w-10 h-10 rounded-lg object-cover shadow-lg" 
           />
        </div>
        <span
          className={clsx(
            "ml-3 text-xl font-bold text-white whitespace-nowrap transition-all duration-300 origin-left",
            isCollapsed ? "opacity-0 w-0 scale-0" : "opacity-100 w-auto scale-100"
          )}
        >
          DocSapiens
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.name}
              to={item.path}
              title={isCollapsed ? item.name : ''}
              className={clsx(
                "flex items-center rounded-lg transition-all relative group h-12",
                isActive 
                  ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/20" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <div className={clsx(
                "flex items-center justify-center flex-shrink-0 transition-all duration-300",
                isCollapsed ? "w-full" : "w-12 pl-1"
              )}>
                <Icon size={24} weight={isActive ? 'fill' : 'regular'} />
              </div>

              <span
                className={clsx(
                  "whitespace-nowrap ml-2 transition-all duration-300",
                  isCollapsed ? "opacity-0 w-0 translate-x-[-10px]" : "opacity-100 w-auto translate-x-0"
                )}
              >
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer del Sidebar */}
      <div className="p-4 border-t border-gray-700 flex-shrink-0 bg-gray-900 z-10">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors h-10"
        >
          {isCollapsed ? <ArrowCircleRight size={28} /> : (
             <div className="flex items-center gap-3 w-full px-2">
                <ArrowCircleLeft size={24} />
                <span className="font-medium">Colapsar</span>
             </div>
          )}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;