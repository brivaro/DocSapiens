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

type SelectOption = { value: string; label: string };

const Documents: React.FC = () => {
  // Estados y hooks no cambian
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<{ id: string; name: string } | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const { documents: apiDocuments = [], isLoading, deleteDocument } = useDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SelectOption | null>(null);
  const [tagFilter, setTagFilter] = useState<readonly SelectOption[]>([]);

  // Datos y filtros no cambian
  const filteredDocuments = useMemo(() => {
    // ... (lógica de filtrado existente)
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
    date: doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A',
    tags: doc.tags || [],
    originalFilename: doc.filename,
  }));

  // Manejadores no cambian
  const handleRowClick = (docId: string) => setSelectedDocId(prev => prev === docId ? null : docId);
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
          {/* 
            CAMBIO ESTRUCTURAL CLAVE: Usamos CSS Grid para el layout del panel.
            - grid-rows-[auto_auto_1fr]: Fila 1 y 2 tienen altura automática, Fila 3 ocupa el resto.
            - overflow-hidden: Es la garantía final de que nada se saldrá del panel.
          */}
          <div className="grid grid-rows-[auto_auto_1fr] bg-white p-6 rounded-xl border border-gray-200 h-full overflow-hidden">
            {/* Fila 1: Cabecera */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                <p className="text-sm text-gray-500 mt-1">Manage and explore your corporate files.</p>
              </div>
              <button onClick={() => setUploadModalOpen(true)} className="flex-shrink-0 flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
                <Plus size={20} /> Upload Document
              </button>
            </header>
            
            {/* Fila 2: Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 mb-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full h-full py-1.5 pl-10 pr-3 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              </div>
              <Select options={useMemo(() => [{ value: 'all', label: 'All Statuses' }, { value: 'processed', label: 'Processed' }, { value: 'processing', label: 'Processing' }, { value: 'failed', label: 'Failed' }], [])} onChange={setStatusFilter} placeholder="Filter by Status" classNamePrefix="react-select" isClearable />
              <Select isMulti options={useMemo(() => { const tagsSet = new Set<string>(); apiDocuments.forEach(doc => doc.tags?.forEach(tag => { if (tag) tagsSet.add(tag); })); return Array.from(tagsSet).sort().map(tag => ({ value: tag, label: tag })); }, [apiDocuments])} onChange={setTagFilter} placeholder="Filter by Tags" classNamePrefix="react-select" />
            </div>
            
            {/* 
              Fila 3: Contenedor de la tabla con scroll.
              - overflow-y-auto: Habilita el scroll vertical cuando es necesario.
              - min-h-0: Esencial para que el scroll funcione correctamente dentro de un layout Grid.
            */}
            <div className="overflow-y-auto min-h-0">
              {isLoading ? <p className="p-4 text-center text-gray-500">Loading documents...</p> : (
                <DocumentTable 
                  documents={tableData} 
                  onRowClick={handleRowClick} 
                  selectedDocId={selectedDocId} 
                  onDeleteRequest={handleDeleteRequest}
                />
              )}
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-2 flex items-center justify-center group">
            <div className="w-1 h-10 bg-slate-200 group-hover:bg-blue-500 transition-colors rounded-full" />
        </PanelResizeHandle>
        
        <Panel defaultSize={35} minSize={25} className="hidden lg:block">
          <div className="bg-white p-6 rounded-xl border border-gray-200 h-full overflow-y-auto">
            <ChunkPanel selectedDocId={selectedDocId} />
          </div>
        </Panel>
      </PanelGroup>
    </>
  );
};

export default Documents;