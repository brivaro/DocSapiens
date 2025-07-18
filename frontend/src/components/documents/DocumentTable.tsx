import React from 'react';

interface Document {
  id: string;
  filename: string;
  type: string;
  status: string;
  date: string;
  tags: string[];
}

// NFunción de borrado
interface Props {
  documents: Document[];
  onRowClick: (docId: string) => void;
  selectedDocId: string | null;
  onDelete: (docId: string) => void;
}

const statusStyles: { [key: string]: string } = {
    processed: "bg-green-100 text-green-800",
    processing: "bg-yellow-100 text-yellow-800 animate-pulse",
    pending: "bg-purple-100 text-purple-800",
    failed: "bg-red-100 text-red-800",
};

const DocumentTable: React.FC<Props> = ({ documents, onRowClick, selectedDocId, onDelete }) => {
  const handleDeleteClick = (e: React.MouseEvent, docId: string) => {
    // Detiene la propagación para evitar que onRowClick se active
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this document and all its chunks?')) {
      onDelete(docId);
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-[#e7edf4] bg-white">
      <table className="min-w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tags</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {documents.map((doc) => (
            <tr 
              key={doc.id} 
              className={`cursor-pointer hover:bg-slate-100 ${selectedDocId === doc.id ? 'bg-blue-100' : ''}`}
              onClick={() => onRowClick(doc.id)}
            >
              <td className="px-4 py-3 text-sm font-medium text-gray-800 whitespace-nowrap">{doc.filename}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{doc.type}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[doc.status.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
                  {doc.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                <div className="flex flex-wrap gap-1">
                  {doc.tags?.map((tag, index) => (
                    <span key={index} className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{doc.date}</td>
              <td className="px-4 py-3 text-sm whitespace-nowrap">
                <div className="flex items-center gap-4">
                  {/* 
                  <button 
                    onClick={() => onRowClick(doc.id)}
                    className="font-semibold text-blue-600 hover:text-blue-800"
                  >
                    View
                  </button>
                  */}
                  <button
                    onClick={(e) => handleDeleteClick(e, doc.id)}
                    className="font-semibold text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentTable;