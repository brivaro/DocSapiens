import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

interface Chunk {
  document_id: string;
  chunk_id: number;
  text: string;
  start: number;
  end: number;
}

interface ChunkModalProps {
  docId: string;
  docName: string;
  onClose: () => void;
}

const fetchChunks = async (docId: string): Promise<Chunk[]> => {
  const { data } = await api.get(`/api/v1/documents/${docId}/chunks/`);
  return data;
};

const ChunkModal: React.FC<ChunkModalProps> = ({ docId, docName, onClose }) => {
  const { data: chunks, isLoading, error } = useQuery({
    queryKey: ["chunks", docId],
    queryFn: () => fetchChunks(docId),
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold">Chunks for: {docName}</h2>
          <button onClick={onClose} className="text-2xl font-bold">×</button>
        </div>
        <div className="overflow-y-auto">
          {isLoading && <p>Loading chunks...</p>}
          {error && <p className="text-red-500">Error loading chunks: {error.message}</p>}
          {chunks && (
            <ul className="space-y-4">
              {chunks.map((chunk, index) => (
                <li key={index} className="border p-4 rounded-md bg-slate-50">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Chunk ID:</strong> {chunk.chunk_id} | <strong>Position:</strong> {chunk.start}-{chunk.end}
                  </p>
                  <p className="text-gray-800">{chunk.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChunkModal;