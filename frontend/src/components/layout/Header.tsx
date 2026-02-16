import { useContext, useState, useRef, useEffect } from 'react';
import { NotificationsContext } from '../../context/NotificationsContext';
import { Bell, List, Trash, X } from 'phosphor-react';
import { clsx } from 'clsx';

interface HeaderProps {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

function Header({ isSidebarCollapsed, toggleSidebar }: HeaderProps) {
    const { notifications, unreadCount, clearNotifications } = useContext(NotificationsContext)!;
    const [showNotif, setShowNotif] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotif(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="bg-gray-800/90 backdrop-blur-md p-4 flex justify-between items-center border-b border-gray-700 h-16 transition-all duration-300 sticky top-0 z-30">
          <div className="flex items-center gap-4">
              <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-gray-700 transition-colors text-white">
                {isSidebarCollapsed ? <List size={24} /> : <X size={24} />}
              </button>
          </div>

        <div className="relative" ref={notificationRef}>
            <button 
                onClick={() => setShowNotif(!showNotif)}
                className={clsx(
                    "relative p-2 rounded-full transition-colors text-gray-300 hover:text-white",
                    showNotif ? "bg-gray-700 text-white" : "hover:bg-gray-700"
                )}
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-800"></span>
                )}
            </button>

            {/* Dropdown de notificaciones */}
            {showNotif && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                    <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-gray-900">
                        <h3 className="text-sm font-bold text-white">Notificaciones</h3>
                        {notifications.length > 0 && (
                            <button 
                                onClick={() => {
                                    clearNotifications();
                                    // Opcional: si quieres que se cierre al limpiar, descomenta la siguiente línea:
                                    // setShowNotif(false); 
                                }} 
                                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                            >
                                <Trash size={12}/> Limpiar
                            </button>
                        )}
                    </div>
                    <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">Sin notificaciones</div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} className={clsx("p-3 border-b border-gray-700/50 text-sm", 
                                    n.type === 'error' ? 'bg-red-900/10' : 'bg-gray-800'
                                )}>
                                    <p className="text-gray-200">{n.message}</p>
                                    <span className="text-[10px] text-gray-500">{new Date(n.timestamp).toLocaleTimeString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
        </header>
    );
}

export default Header;