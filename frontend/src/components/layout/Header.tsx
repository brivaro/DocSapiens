import { List, X, User, Bell } from 'phosphor-react';
import { useRagSettings } from '../../context/RagSettingsContext';

interface HeaderProps {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

function Header({ isSidebarCollapsed, toggleSidebar }: HeaderProps) {
    const { config } = useRagSettings();

    // Mapping para mostrar etiquetas bonitas del Task Type
    const taskTypeLabels: Record<string, string> = {
        RETRIEVAL_QUERY: "Búsqueda Estándar",
        FACT_VERIFICATION: "Verificación de Hechos",
        QUESTION_ANSWERING: "Preguntas y Respuestas",
        // ... otros
    };

    return (
        <header className="bg-gray-800/90 backdrop-blur-md p-4 flex justify-between items-center border-b border-gray-700 h-16 transition-all duration-300 sticky top-0 z-30">
          <div className="flex items-center gap-4">
              <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-gray-700 transition-colors text-white">
                {isSidebarCollapsed ? <List size={24} /> : <X size={24} />}
              </button>
              
              {/* Indicador de Configuración Actual */}
              {config && (
                  <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-700/50 rounded-full border border-gray-600">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                      <span className="text-xs text-gray-300 font-mono">
                          {taskTypeLabels[config.embedding_task_type] || config.embedding_task_type} 
                          <span className="text-gray-500 mx-1">|</span> 
                          Dim: {config.embedding_dimension}
                      </span>
                  </div>
              )}
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 rounded-full hover:bg-gray-700 transition-colors text-gray-300 hover:text-white">
                <Bell size={24} />
                {/* Badge ejemplo */}
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-800"></span>
            </button>
            
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-700">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold border-2 border-gray-600 shadow-md">
                  <User size={20} weight="fill" />
              </div>
              <div className="hidden sm:block">
                  <p className="text-sm font-medium text-white">Admin</p>
                  <p className="text-xs text-gray-400">DocSapiens</p>
              </div>
            </div>
          </div>
        </header>
    );
}

export default Header;