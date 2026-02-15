import React, { useState, useMemo } from 'react';
import { useDocuments } from '../hooks/useDocuments';
import DocumentTable from '../components/documents/DocumentTable';
import ChunkPanel from '../components/documents/ChunkPanel';
import UploadModal from '../components/documents/UploadModal';
import DeleteConfirmModal from '../components/documents/DeleteConfirmModal';
import { formatDocType, getFilenameWithoutExtension } from '../utils/format';
import { Plus, Search } from 'lucide-react';
import Select from 'react-select';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { CloudArrowUp } from 'phosphor-react';

type SelectOption = { value: string; label: string };

const selectStyles = {
    control: (base: any) => ({ 
        ...base, 
        backgroundColor: '#1f2937', 
        borderColor: '#4b5563', 
        color: 'white',
        minHeight: '42px'
    }),
    menu: (base: any) => ({ 
        ...base, 
        backgroundColor: '#1f2937', 
        border: '1px solid #374151',
        zIndex: 9999
    }),
    menuPortal: (base: any) => ({ 
        ...base, 
        zIndex: 9999 
    }),
    option: (base: any, state: { isFocused: boolean; isSelected: boolean }) => ({
        ...base, 
        backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#374151' : 'transparent', 
        color: 'white', 
        cursor: 'pointer',
    }),
    singleValue: (base: any) => ({ ...base, color: 'white' }),
    multiValue: (base: any) => ({ ...base, backgroundColor: '#374151', border: '1px solid #4b5563' }),
    multiValueLabel: (base: any) => ({ ...base, color: 'white' }),
    input: (base: any) => ({ ...base, color: 'white' }),
    placeholder: (base: any) => ({ ...base, color: '#9ca3af' }),
};

const Documents: React.FC = () => {
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<{ id: string; name: string } | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const { documents: apiDocuments = [], isLoading, deleteDocument } = useDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SelectOption | null>(null);
  const [tagFilter, setTagFilter] = useState<readonly SelectOption[]>([]);

  const filteredDocuments = useMemo(() => {
    return apiDocuments.filter(doc => {
        const searchMatch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = !statusFilter || statusFilter.value === 'all' || doc.status?.toLowerCase() === statusFilter.value;
        const selectedTags = tagFilter.map(t => t.value);
        const tagMatch = selectedTags.length === 0 || doc.tags?.some(tag => selectedTags.includes(tag));
        return searchMatch && statusMatch && tagMatch;
    });
  }, [apiDocuments, searchTerm, statusFilter, tagFilter]);

  const tableData = filteredDocuments.map(doc => ({
    id: doc.id,
    filename: getFilenameWithoutExtension(doc.filename),
    type: formatDocType(doc.content_type),
    status: doc.status || 'failed',
    date: doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('es-ES') : 'N/A',
    tags: doc.tags || [],
    originalFilename: doc.filename,
    chunk_count: doc.chunk_count || 0
  }));

  const handleViewChunks = (docId: string) => {
      setSelectedDocId(prev => prev === docId ? null : docId);
  };
  
  const handleDeleteRequest = (doc: { id: string; filename: string }) => setDocToDelete({ id: doc.id, name: doc.filename });
  const confirmDelete = () => {
    if (docToDelete) {
      if (selectedDocId === docToDelete.id) setSelectedDocId(null);
      deleteDocument(docToDelete.id);
      setDocToDelete(null);
    }
  };

  return (
    <>
      {isUploadModalOpen && <UploadModal onClose={() => setUploadModalOpen(false)} />}
      {docToDelete && (
        <DeleteConfirmModal 
          isOpen={!!docToDelete} 
          onClose={() => setDocToDelete(null)}
          onConfirm={confirmDelete}
          documentName={docToDelete.name}
        />
      )}

      <PanelGroup direction="horizontal" className="w-full h-[calc(100vh-8rem)]">
        <Panel defaultSize={65} minSize={40}>
          <div className="grid grid-rows-[auto_auto_1fr] bg-gray-800 p-6 rounded-xl border border-gray-700 h-full overflow-hidden">
            {/* Header */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Documentos</h1>
                <p className="text-sm text-gray-400 mt-1">Gestiona tu base de conocimiento.</p>
              </div>
              <button onClick={() => setUploadModalOpen(true)} className="flex-shrink-0 flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
                <Plus size={20} /> Subir Nuevo
              </button>
            </header>
            
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 mb-4 z-10 relative">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full h-full py-2 pl-10 pr-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400" />
              </div>
              <Select 
                options={[{ value: 'all', label: 'Todos' }, { value: 'processed', label: 'Procesados' }, { value: 'processing', label: 'Procesando' }, { value: 'failed', label: 'Fallidos' }]} 
                onChange={setStatusFilter} 
                placeholder="Estado" 
                styles={selectStyles} 
                classNamePrefix="react-select" 
                isClearable 
                menuPortalTarget={document.body}
              />
              <Select 
                isMulti 
                options={useMemo(() => { const tagsSet = new Set<string>(); apiDocuments.forEach(doc => doc.tags?.forEach(tag => { if (tag) tagsSet.add(tag); })); return Array.from(tagsSet).sort().map(tag => ({ value: tag, label: tag })); }, [apiDocuments])} 
                onChange={setTagFilter} 
                placeholder="Etiquetas" 
                styles={selectStyles} 
                classNamePrefix="react-select" 
                menuPortalTarget={document.body}
              />
            </div>
            
            {/* Tabla con estado vacío */}
            <div className="overflow-y-auto min-h-0 bg-gray-900/50 rounded-lg border border-gray-700 z-0">
              {isLoading ? (
                  <div className="flex justify-center items-center h-full text-gray-400">Cargando...</div>
              ) : tableData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-10 text-center opacity-60">
                      <CloudArrowUp size={64} className="text-gray-600 mb-4"/>
                      <h3 className="text-xl font-bold text-gray-400">No hay documentos</h3>
                      <p className="text-gray-500">Sube tu primer archivo para empezar.</p>
                  </div>
              ) : (
                <DocumentTable 
                  documents={tableData} 
                  onViewChunks={handleViewChunks} 
                  selectedDocId={selectedDocId} 
                  onDeleteRequest={handleDeleteRequest}
                  onReIndex={() => {}} 
                />
              )}
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-2 flex items-center justify-center group bg-gray-900 hover:bg-gray-800 transition-colors">
            <div className="w-1 h-10 bg-gray-600 group-hover:bg-blue-500 transition-colors rounded-full" />
        </PanelResizeHandle>
        
        {/* Panel de Chunks */}
        <Panel defaultSize={35} minSize={25} maxSize={50} className="hidden lg:block">
          <div className="bg-gray-800 p-0 h-full border border-gray-700 overflow-hidden flex flex-col">
              <ChunkPanel selectedDocId={selectedDocId} />
          </div>
        </Panel>
      </PanelGroup>
    </>
  );
};

export default Documents;