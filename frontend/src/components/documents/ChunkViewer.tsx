import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import NoDocSelectedImage from '../../assets/no_doc_selected.png';

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

const ChunkViewer: React.FC<Props> = ({ selectedDocId }) => {
  const { data: chunks, isLoading, error } = useQuery({
    queryKey: ['chunks', selectedDocId],
    queryFn: () => fetchChunks(selectedDocId!),
    enabled: !!selectedDocId, // Solo ejecuta la query si hay un docId seleccionado
  });

  if (!selectedDocId) {
    return (
      <div className="text-center p-10 bg-white rounded-xl border border-[#e7edf4]">
        <img src={NoDocSelectedImage} alt="No document selected" className="mx-auto w-64 h-auto" />
        <h3 className="mt-4 text-lg font-bold">No document selected</h3>
        <p className="text-sm text-gray-500">Please select a document from the table to view its chunks.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Document Chunks</h2>
      {isLoading && <p>Loading chunks...</p>}
      {error && <p className="text-red-500">Error: {error.message}</p>}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {chunks && [...chunks] // Creamos una copia para no mutar el caché de react-query
          .sort((a, b) => a.chunk_id - b.chunk_id) // Ordenamos por chunk_id
          .map((chunk, index) => (
            <div key={index} className="p-4 bg-slate-50 border rounded-lg">
              <p className="text-xs font-mono text-gray-500 mb-2">CHUNK #{chunk.chunk_id}</p>
              <p className="text-sm text-gray-800">{chunk.text}</p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ChunkViewer;