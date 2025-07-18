import React, { useState, useRef } from 'react';
import { useDocuments } from '../hooks/useDocuments';
import DocumentTable from '../components/documents/DocumentTable';
import ChunkViewer from '../components/documents/ChunkViewer'; 
import UploadConfigModal from '../components/UploadConfigModal';
import { formatDocType } from '../utils/format';

const Documents: React.FC = () => {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  
  // --- PASO 1: CREAR LA REFERENCIA ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    documents: apiDocuments = [], 
    isLoading, error, 
    uploadDocument, isUploading,
    deleteDocument 
  } = useDocuments();
  
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const handleFileSelect = (file: File | null) => {
    if (file) setPendingFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };
  
  // --- PASO 2: CREAR UNA FUNCIÓN DE LIMPIEZA ---
  const handleCancelUpload = () => {
    setPendingFile(null); // Limpia el estado de React
    // Y limpia el valor del input del DOM
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = (params: any) => {
    uploadDocument(params, {
      onSuccess: () => {
        handleCancelUpload(); // Reutilizamos la función para limpiar todo
      },
      onError: () => {
        // Opcional: podrías decidir mantener la modal abierta en caso de error
        // TODO: handleCancelUpload(); 
      }
    });
  };

  const handleDelete = (docId: string) => {
    if (selectedDocId === docId) {
      setSelectedDocId(null);
    }
    deleteDocument(docId);
  };

  const tableData = apiDocuments.map(doc => ({
    id: doc.id,
    filename: doc.filename,
    type: formatDocType(doc.content_type),
    status: doc.status || 'failed',
    date: doc.uploaded_at && doc.uploaded_at !== "N/A" 
          ? new Date(doc.uploaded_at).toLocaleDateString() 
          : 'N/A',
    tags: doc.tags
  }));

  return (
    <div className="p-4 lg:p-6">
      {pendingFile && (
        <UploadConfigModal
          file={pendingFile}
          // --- PASO 3: USAR LA NUEVA FUNCIÓN ---
          onClose={handleCancelUpload}
          onUpload={handleUpload}
          isUploading={isUploading}
        />
      )}
      
      {/* --- CONTENEDOR FLEX PRINCIPAL --- */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* --- Columna Izquierda: Controles --- */}
        <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col gap-6">
          <h1 className="text-3xl font-bold text-gray-800">Documents</h1>
          
          {/* Input de búsqueda con ícono */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
              </div>
              <input type="text" placeholder="Search documents..." className="form-input block w-full rounded-lg border-gray-300 bg-gray-50 pl-10 focus:border-blue-500 focus:ring-blue-500" />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Upload</h2>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <p className="font-bold">Drag and drop files here</p>
              <p className="text-sm text-gray-500">Or click to browse</p>
            </div>
            <input 
              type="file" 
              id="file-input"
              // --- PASO 1 (continuación): ASIGNAR LA REFERENCIA ---
              ref={fileInputRef}
              className="hidden" 
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} 
            />
          </div>

          {/* Filters Section */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Filters</h2>
            <div className="space-y-3">
              {/* --- ESTILO MEJORADO --- */}
              <select className="form-select w-full rounded-lg border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-blue-500">
                <option>All types</option>
                <option>PDF</option>
                <option>DOCX</option>
              </select>
              <select className="form-select w-full rounded-lg border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-blue-500">
                <option>All statuses</option>
                <option>Processed</option>
              </select>
              <select className="form-select w-full rounded-lg border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-blue-500">
                <option>Sort by date</option>
              </select>
            </div>
          </div>
        </div>

        {/* --- COLUMNA DERECHA: Contenido --- */}
        <div className="w-full lg:w-2/3 xl:w-3/4 flex flex-col gap-8">
          <div>
            {isLoading && <p className="text-center p-4">Loading documents...</p>}
            {error && <p className="text-center p-4 text-red-500">Error: {error.message}</p>}
            {!isLoading && !error && (
              <DocumentTable 
                documents={tableData} 
                onRowClick={setSelectedDocId} 
                selectedDocId={selectedDocId} 
                onDelete={handleDelete} // <-- Usamos la nueva función
              />
            )}
          </div>
          <div>
            <ChunkViewer selectedDocId={selectedDocId} />
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Documents;