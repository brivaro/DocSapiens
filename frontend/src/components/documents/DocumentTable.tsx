import React from 'react';
import { Trash } from 'phosphor-react';
import StatusBadge from './StatusBadge';
import TagBadge from './TagBadge';

// Interfaces sin cambios
interface Document {
  id: string;
  filename: string;
  type: string;
  status: string;
  date: string;
  tags: string[];
  originalFilename: string;
}

interface Props {
  documents: Document[];
  onRowClick: (docId: string) => void;
  selectedDocId: string | null;
  onDeleteRequest: (doc: { id: string; filename: string }) => void;
}

// Componente para una fila, que se comporta como <tr>
const DocumentRow: React.FC<{ doc: Document; isSelected: boolean; onRowClick: Props['onRowClick']; onDeleteRequest: Props['onDeleteRequest'] }> = ({ doc, isSelected, onRowClick, onDeleteRequest }) => (
  // Fila: se comporta como un <tr>
  <div
    onClick={() => onRowClick(doc.id)}
    className={`table-row border-b border-gray-200 cursor-pointer transition-colors last:border-b-0 ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`}
  >
    {/* Celda Nombre: se comporta como <td>. El 'overflow-hidden' es la garantía final. */}
    <div className="table-cell px-6 py-4 align-middle">
        <div className="overflow-hidden">
            <p className="text-sm font-medium text-gray-900 break-all" title={doc.originalFilename}>
              {doc.filename}
            </p>
        </div>
    </div>

    {/* Celdas restantes */}
    <div className="table-cell px-6 py-4 align-middle">
      <StatusBadge status={doc.status} />
    </div>
    <div className="table-cell px-6 py-4 align-middle">
      <div className="flex flex-wrap gap-1">
        {doc.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
      </div>
    </div>
    <div className="table-cell px-6 py-4 align-middle text-sm text-gray-500 uppercase">{doc.type}</div>
    <div className="table-cell px-6 py-4 align-middle text-sm text-gray-500">{doc.date}</div>
    <div className="table-cell px-6 py-4 align-middle text-center">
      <button
        onClick={(e) => { e.stopPropagation(); onDeleteRequest({ id: doc.id, filename: doc.originalFilename }); }}
        title={`Delete ${doc.originalFilename}`}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
      >
        <Trash size={18} />
      </button>
    </div>
  </div>
);

// Componente principal de la tabla
const DocumentTable: React.FC<Props> = ({ documents, onRowClick, selectedDocId, onDeleteRequest }) => {
  if (documents.length === 0) {
    return <p className="text-center text-gray-500 py-10">No documents found.</p>;
  }
  
  return (
    // Contenedor principal: se comporta como <table style="table-layout: fixed">
    <div className="table w-full table-fixed">
      {/* Cabecera: se comporta como <thead> */}
      <div className="table-header-group bg-gray-50 sticky top-0 z-10">
        {/* Fila de cabecera: se comporta como <tr> */}
        <div className="table-row">
          {/* 
            CAMBIO CLAVE: Celdas de cabecera con anchos de PORCENTAJE explícitos e inquebrantables.
            Usamos 'style' para que la propiedad sea directa y no pueda ser sobreescrita por otra clase.
          */}
          <div className="table-cell px-6 h-12 align-middle text-xs font-bold text-gray-500 uppercase" style={{ width: '28%' }}>Name</div>
          <div className="table-cell px-6 h-12 align-middle text-xs font-bold text-gray-500 uppercase" style={{ width: '17%' }}>Status</div>
          <div className="table-cell px-6 h-12 align-middle text-xs font-bold text-gray-500 uppercase" style={{ width: '19%' }}>Tags</div>
          <div className="table-cell px-6 h-12 align-middle text-xs font-bold text-gray-500 uppercase" style={{ width: '10%' }}>Type</div>
          <div className="table-cell px-6 h-12 align-middle text-xs font-bold text-gray-500 uppercase" style={{ width: '13%' }}>Date</div>
          <div className="table-cell px-6 h-12 align-middle text-center text-xs font-bold text-gray-500 uppercase" style={{ width: '13%' }}>Actions</div>
        </div>
      </div>
      
      {/* Cuerpo de la tabla: se comporta como <tbody> */}
      <div className="table-row-group bg-white">
        {documents.map((doc) => (
           <DocumentRow
             key={doc.id}
             doc={doc}
             isSelected={selectedDocId === doc.id}
             onRowClick={onRowClick}
             onDeleteRequest={onDeleteRequest}
           />
        ))}
      </div>
    </div>
  );
};

export default DocumentTable;