import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client'; // Importación corregida
import { CircleNotch, Star, WarningCircle } from 'phosphor-react';

interface Chunk {
  text: string;
  chunk_id: number;
}

const fetchChunks = async (docId: string): Promise<Chunk[]> => {
  const { data } = await apiClient.get(`/v1/documents/${docId}/chunks/`);
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
      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
        <WarningCircle size={48} className="mb-2 opacity-50" />
        <h3 className="text-lg font-semibold">Selecciona un documento</h3>
        <p className="text-sm">Elige un archivo de la lista para ver sus fragmentos.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Fragmentos (Chunks)</h2>
          {isFetching && <CircleNotch size={24} className="animate-spin text-blue-500" />}
      </div>
      
      {isLoading && <p className="text-gray-500 text-center">Cargando chunks...</p>}
      {error && <p className="text-red-500 text-sm">Error cargando chunks.</p>}

      {chunks && chunks.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center text-center p-4 bg-gray-50 rounded-lg mt-4">
          <WarningCircle size={32} className="text-yellow-500 mb-2" />
          <p className="text-sm text-gray-600">Este archivo no tiene texto extraíble o no ha sido procesado aún.</p>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300">
        {chunks && [...chunks]
          .sort((a, b) => a.chunk_id - b.chunk_id)
          .map((chunk) => (
            <div key={chunk.chunk_id} className="p-4 bg-white border border-gray-200 rounded-lg transition hover:shadow-md hover:border-blue-300">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">CHUNK #{chunk.chunk_id}</p>
                 <button className="p-1 text-gray-400 hover:text-yellow-500">
                    <Star size={16} />
                </button>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed break-words font-mono">
                {chunk.text}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ChunkPanel;