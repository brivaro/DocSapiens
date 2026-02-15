import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { CircleNotch, Cube, Eye, WarningCircle, Hash } from 'phosphor-react';

interface Chunk {
  text: string;
  chunk_id: number;
  document_id: string;
  start: number;
  end: number;
}

const fetchChunks = async (docId: string): Promise<Chunk[]> => {
  const { data } = await apiClient.get(`/api/v1/documents/${docId}/chunks/`);
  return data;
};

interface Props {
  selectedDocId: string | null;
}

const ChunkPanel: React.FC<Props> = ({ selectedDocId }) => {
  const { data: chunks, isLoading, error, isFetching } = useQuery({
    queryKey: ['chunks', selectedDocId],
    queryFn: () => fetchChunks(selectedDocId!),
    enabled: !!selectedDocId,
    staleTime: 5 * 60 * 1000,
  });

  if (!selectedDocId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gray-800">
        <Cube size={64} className="text-gray-700 mb-4 opacity-50" weight="duotone" />
        <h3 className="text-lg font-semibold text-gray-300">Vista de Fragmentos</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-xs">
            Selecciona un documento haciendo clic en el icono del ojo (<Eye className="inline" size={14} />) para ver cómo la IA divide y entiende tu archivo.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-800 border-l border-gray-700 shadow-xl">
      {/* Header Panel */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 shrink-0">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Cube size={20} className="text-blue-500" /> 
          Fragmentos del Documento
        </h2>
        {isFetching && <CircleNotch size={18} className="animate-spin text-blue-400" />}
      </div>

      {/* Loading State */}
      {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <CircleNotch size={32} className="animate-spin text-blue-500" />
              <p className="text-sm text-gray-400">Recuperando vectores...</p>
          </div>
      )}
      
      {/* Error State */}
      {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/20 m-4 rounded-lg text-red-400 text-sm">
              Error cargando los fragmentos. Intenta re-indexar el documento.
          </div>
      )}

      {/* Empty State */}
      {chunks && chunks.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center text-center p-8 mt-4">
          <WarningCircle size={48} className="text-yellow-500/50 mb-2" />
          <p className="text-sm text-gray-400 font-medium">Sin contenido indexado</p>
          <p className="text-xs text-gray-500 mt-1 px-4">
            Este archivo no tiene texto extraíble o no se ha procesado correctamente en la base vectorial.
          </p>
        </div>
      )}

      {/* Chunks List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {chunks && [...chunks]
          .sort((a, b) => a.chunk_id - b.chunk_id)
          .map((chunk) => (
            <div key={chunk.chunk_id} className="bg-gray-750 border border-gray-700 rounded-lg p-3 hover:border-blue-500/30 transition-all group shadow-sm">
              <div className="flex justify-between items-center mb-2 border-b border-gray-700/50 pb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded border border-blue-500/20 flex items-center gap-1">
                        <Hash size={10} /> {chunk.chunk_id}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                        {chunk.start} - {chunk.end}
                    </span>
                </div>
              </div>
              
              {/* Contenido del texto con estilos robustos */}
              <div className="text-sm text-gray-300 font-mono bg-gray-900/50 p-3 rounded border border-gray-700/30 whitespace-pre-wrap break-words leading-relaxed select-text">
                {chunk.text || <span className="text-gray-500 italic">Sin texto disponible...</span>}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ChunkPanel;