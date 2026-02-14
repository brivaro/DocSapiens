import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header'; 
import { Toaster } from 'react-hot-toast';

const SIDEBAR_STATE_KEY = 'docsapiens_sidebar_collapsed';

function Layout() {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(() => {
        try {
            const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
            return saved ? JSON.parse(saved) : false;
        } catch { return false; }
    });

    useEffect(() => {
        localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(isSidebarCollapsed));
    }, [isSidebarCollapsed]);

    const handleToggleSidebar = () => setSidebarCollapsed((prev: boolean) => !prev);

    return (
        // FIX: h-screen y overflow-hidden
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden font-sans">
            <Toaster 
                position="top-right"
                toastOptions={{
                    style: { background: '#1f2937', color: '#fff', border: '1px solid #374151' },
                    success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                    error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                }}
            />

            <Sidebar isCollapsed={isSidebarCollapsed} onToggle={handleToggleSidebar} />
            
            <div 
                className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}
                style={{ width: `calc(100% - ${isSidebarCollapsed ? '5rem' : '16rem'})` }}
            >
                <Header isSidebarCollapsed={isSidebarCollapsed} toggleSidebar={handleToggleSidebar} />
                
                {/* FIX: Main es el único con scroll */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent bg-gray-900">
                    <div className="w-full h-full mx-auto animate-fade-in">
                         <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Layout;