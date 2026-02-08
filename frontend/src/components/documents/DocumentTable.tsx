import React from 'react';
import { Trash, ArrowsClockwise, FileText, DownloadSimple } from 'phosphor-react';
import { ApiDocument } from '../../hooks/useDocuments';
import { clsx } from 'clsx';
import { API_BASE_URL } from '../../api/client';

interface Props {
  documents: ApiDocument[];
  onReIndex: (doc: ApiDocument) => void;
  onDelete: (id: string) => void;
}

export default function DocumentTable({ documents, onReIndex, onDelete }: Props) {
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
    <div className="overflow-hidden bg-gray-800 border border-gray-700 rounded-xl shadow-lg">
      <table className="w-full text-left text-sm text-gray-400">
        <thead className="bg-gray-900 text-gray-200 uppercase font-bold text-xs">
          <tr>
            <th scope="col" className="px-6 py-4">Archivo</th>
            <th scope="col" className="px-6 py-4">Chunks</th>
            <th scope="col" className="px-6 py-4">Estado</th>
            <th scope="col" className="px-6 py-4">Etiquetas</th>
            <th scope="col" className="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-700/50 transition-colors group">
              <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <FileText size={20} weight="fill" />
                </div>
                <div className="truncate max-w-[200px]" title={doc.filename}>
                    {doc.filename}
                    <div className="text-xs text-gray-500 font-normal">{new Date(doc.uploaded_at || '').toLocaleDateString()}</div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="font-mono bg-gray-700 px-2 py-1 rounded text-gray-300">
                    {doc.chunk_count || 0}
                </span>
              </td>
              <td className="px-6 py-4">
                 <StatusBadge status={doc.status || 'unknown'} />
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                    {doc.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-300 border border-gray-600">
                            {tag}
                        </span>
                    ))}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a 
                        href={`${API_BASE_URL}/v1/documents/${doc.id}/download`} 
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                        title="Descargar Original"
                        download
                    >
                        <DownloadSimple size={18} />
                    </a>
                    <button 
                        onClick={() => onReIndex(doc)}
                        className="p-2 text-blue-400 hover:text-white hover:bg-blue-600 rounded-lg transition-colors"
                        title="Re-Indexar / Cambiar Chunking"
                    >
                        <ArrowsClockwise size={18} />
                    </button>
                    <button 
                        onClick={() => onDelete(doc.id)}
                        className="p-2 text-red-400 hover:text-white hover:bg-red-600 rounded-lg transition-colors"
                        title="Eliminar"
                    >
                        <Trash size={18} />
                    </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
        processed: "bg-green-500/10 text-green-400 border-green-500/20",
        processing: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse",
        pending: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        failed: "bg-red-500/10 text-red-400 border-red-500/20"
    };
    const style = styles[status as keyof typeof styles] || styles.pending;
    
    return (
        <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider", style)}>
            {status}
        </span>
    );
};