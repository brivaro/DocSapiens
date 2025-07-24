import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import NoDocSelectedImage from '../../assets/no_doc_selected.png';
import { CircleNotch, Star, WarningCircle } from 'phosphor-react';

interface Chunk {
  text: string;
  chunk_id: number;
}

const fetchChunks = async (docId: string): Promise<Chunk[]> => {
  const { data } = await api.get(`/api/v1/documents/${docId}/chunks/`);
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
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  if (!selectedDocId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <img src={NoDocSelectedImage} alt="No document selected" className="w-48" />
        <h3 className="mt-4 text-lg font-semibold text-gray-700">Select a document</h3>
        <p className="text-sm text-gray-500">Choose a file from the list to view its fragments (chunks).</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Document chunks</h2>
          {isFetching && <CircleNotch size={24} className="animate-spin text-blue-500" />}
      </div>
      
      {isLoading && <p>Cargando chunks...</p>}
      {error && <p className="text-red-500">Error: {error.message}</p>}

      {chunks && chunks.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center p-4 bg-gray-50 rounded-lg mt-4">
          <WarningCircle size={32} className="text-yellow-500 mb-2" />
          <p className="text-sm text-gray-600">Unsupported file type for text extraction</p>
        </div>
      )}
      
      <div className="space-y-3">
        {chunks && [...chunks]
          .sort((a, b) => a.chunk_id - b.chunk_id)
          .map((chunk) => (
            <div key={chunk.chunk_id} className="p-4 bg-white border border-gray-200 rounded-lg transition hover:shadow-md hover:border-blue-300">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold font-mono text-gray-500">CHUNK #{chunk.chunk_id}</p>
                 <button className="p-1 text-gray-400 hover:text-yellow-500">
                    <Star size={16} />
                </button>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed break-words">
                {chunk.text}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ChunkPanel;