import { useState } from 'react';
import { useDocuments, ApiDocument } from '../hooks/useDocuments';
import DocumentTable from '../components/documents/DocumentTable';
import UploadModal from '../components/documents/UploadModal';
import ReIndexModal from '../components/documents/ReIndexModal';
import { Plus, MagnifyingGlass } from 'phosphor-react';

export default function Documents() {
    const { documents, isLoading, deleteDocument, reIndexDocument } = useDocuments();
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [reIndexDoc, setReIndexDoc] = useState<ApiDocument | null>(null);
    const [search, setSearch] = useState("");

    const filteredDocs = documents?.filter(d => 
        d.filename.toLowerCase().includes(search.toLowerCase()) || 
        d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    ) || [];

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-white">Documentos</h1>
                    <p className="text-gray-400 mt-1">Gestiona tu base de conocimiento. Sube, edita y re-indexa.</p>
                </div>
                <button 
                    onClick={() => setIsUploadOpen(true)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
                >
                    <Plus size={20} weight="bold" /> Subir Nuevo
                </button>
            </div>

            {/* Barra de búsqueda */}
            <div className="relative">
                <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre o etiqueta..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
            </div>

            {/* Tabla con Scroll */}
            <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-gray-700 bg-gray-800/50">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-400">Cargando documentos...</div>
                ) : (
                    <DocumentTable 
                        documents={filteredDocs} 
                        onDelete={(id) => {
                            if(window.confirm("¿Seguro que quieres borrar este documento?")) deleteDocument(id);
                        }}
                        onReIndex={(doc) => setReIndexDoc(doc)}
                    />
                )}
            </div>

            {/* Modales */}
            {isUploadOpen && <UploadModal onClose={() => setIsUploadOpen(false)} />}
            
            {reIndexDoc && (
                <ReIndexModal 
                    document={reIndexDoc} 
                    onClose={() => setReIndexDoc(null)} 
                    onConfirm={async (params) => {
                        await reIndexDocument(params);
                    }}
                />
            )}
        </div>
    );
}