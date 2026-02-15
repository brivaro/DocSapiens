import React from 'react';
import { Trash, FileText, DownloadSimple, Eye } from 'phosphor-react';
import { clsx } from 'clsx';

interface TableDocument {
  id: string;
  filename: string;
  type: string;
  status: string;
  date: string;
  tags: string[];
  originalFilename: string;
  chunk_count: number;
}

interface Props {
  documents: TableDocument[];
  onViewChunks: (docId: string) => void;
  selectedDocId: string | null;
  onDeleteRequest: (doc: { id: string; filename: string }) => void;
  onReIndex?: () => void;
}

export default function DocumentTable({ documents, onViewChunks, selectedDocId, onDeleteRequest }: Props) {
  if (documents.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-gray-500 border-2 border-dashed border-gray-700 rounded-2xl bg-gray-800/30">
            <FileText size={48} className="mb-3 opacity-50" />
            <p className="text-lg font-medium">No hay documentos indexados</p>
            <p className="text-sm">Sube uno nuevo para empezar.</p>
        </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
      <table className="w-full text-left border-collapse">
        <thead>
            <tr className="text-gray-400 border-b border-gray-700 text-xs uppercase tracking-wider bg-gray-900/90 sticky top-0 z-10 backdrop-blur-sm">
                <th className="px-6 py-4 font-medium w-1/3">Nombre</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium">Etiquetas</th>
                <th className="px-6 py-4 font-medium">Fecha</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
            {documents.map((doc) => (
                <DocumentRow
                key={doc.id}
                doc={doc}
                isSelected={selectedDocId === doc.id}
                onViewChunks={onViewChunks}
                onDeleteRequest={onDeleteRequest}
                />
            ))}
        </tbody>
      </table>
    </div>
  );
}

const DocumentRow: React.FC<{ 
    doc: TableDocument; 
    isSelected: boolean; 
    onViewChunks: (id: string) => void;
    onDeleteRequest: (doc: { id: string; filename: string }) => void; 
}> = ({ doc, isSelected, onViewChunks, onDeleteRequest }) => (
  <tr className={`transition-colors ${isSelected ? 'bg-blue-900/20' : 'hover:bg-gray-700/30'}`}>
    {/* Nombre */}
    <td className="px-6 py-4 align-middle">
        <div className="flex items-center gap-3">
            <FileText size={20} className="text-blue-400 flex-shrink-0" />
            <span className="text-sm font-medium text-white truncate max-w-xs block" title={doc.originalFilename}>
                {doc.filename}
            </span>
        </div>
    </td>
    
    {/* Status */}
    <td className="px-6 py-4 align-middle"><StatusBadge status={doc.status} /></td>
    
    {/* Tags */}
    <td className="px-6 py-4 align-middle">
      <div className="flex flex-wrap gap-1">
          {doc.tags && doc.tags.length > 0 
            ? doc.tags.map((tag: string) => <TagBadge key={tag} tag={tag} />)
            : <span className="text-xs text-gray-600 italic">Sin etiquetas</span>
          }
      </div>
    </td>

    {/* Fecha */}
    <td className="px-6 py-4 align-middle text-sm text-gray-400 whitespace-nowrap">{doc.date}</td>

    {/* Acciones */}
    <td className="px-6 py-4 align-middle text-right">
       <div className="flex items-center justify-end gap-2">
            {/* BOTÓN OJO: Ver Chunks */}
            <button 
                onClick={() => onViewChunks(doc.id)}
                className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                title="Ver Fragmentos"
            >
                <Eye size={18} weight={isSelected ? 'fill' : 'regular'}/>
            </button>

            {/* Descargar */}
            <a 
                href={`/api/v1/documents/${doc.id}/download`}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="Descargar Original"
                download
            >
                <DownloadSimple size={18} />
            </a>

            {/* Eliminar */}
            <button
                onClick={(e) => { e.stopPropagation(); onDeleteRequest({ id: doc.id, filename: doc.originalFilename }); }}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                title="Eliminar"
            >
                <Trash size={18} />
            </button>
       </div>
    </td>
  </tr>
);

const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
        processed: "bg-green-500/10 text-green-400 border-green-500/20",
        processing: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse",
        pending: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        failed: "bg-red-500/10 text-red-400 border-red-500/20"
    };
    const style = styles[status.toLowerCase() as keyof typeof styles] || styles.pending;
    
    return (
        <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider", style)}>
            {status}
        </span>
    );
};

const TagBadge = ({ tag }: { tag: string }) => {
    // Función para obtener un color consistente
    const hash = tag.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const colors = [
        'bg-blue-900/30 text-blue-300 border-blue-500/30',
        'bg-purple-900/30 text-purple-300 border-purple-500/30',
        'bg-green-900/30 text-green-300 border-green-500/30',
        'bg-yellow-900/30 text-yellow-300 border-yellow-500/30',
    ];
    const colorStyle = colors[Math.abs(hash) % colors.length];

    return (
        <span className={clsx("px-2 py-0.5 rounded text-xs border", colorStyle)}>
            {tag}
        </span>
    );
};