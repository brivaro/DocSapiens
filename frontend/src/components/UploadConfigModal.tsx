import React, { useState } from 'react';
import NewDocumentIcon from '../assets/new_document.png';

interface Props {
  file: File;
  onClose: () => void;
  onUpload: (params: any) => void;
  isUploading: boolean;
}

const UploadConfigModal: React.FC<Props> = ({ file, onClose, onUpload, isUploading }) => {
  const [filename, setFilename] = useState(file.name);
  const [splitMode, setSplitMode] = useState('delimiter');
  const [splitBy, setSplitBy] = useState('\\n\\n');
  const [chunkSize, setChunkSize] = useState(1000);
  const [overlap, setOverlap] = useState(200);
  const [tags, setTags] = useState('');

  const handleUpload = () => {
    onUpload({
      file,
      filename: filename,
      split_mode: splitMode,
      split_by: splitBy.replace(/\\n/g, '\n'),
      chunk_size: splitMode === 'size' ? chunkSize : undefined,
      overlap: splitMode === 'size' ? overlap : undefined,
      tags: tags,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex overflow-hidden">
        <div className="hidden md:block w-1/3 bg-slate-50 p-8">
          <img src={NewDocumentIcon} alt="New Document Illustration" className="w-full h-full object-contain" />
        </div>

        <div className="w-full md:w-2/3 p-8 flex flex-col">
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Processing Options</h2>
          {/* Mostramos el nombre original para referencia */}
          <p className="text-gray-600 mb-6">Configure how to process the document.</p>

          <div className="space-y-6 overflow-y-auto pr-2 flex-grow">
            {/* --- AÑADE EL INPUT PARA EDITAR EL NOMBRE --- */}
            <div>
              <label className="font-semibold text-gray-700 block mb-2">Filename</label>
              <input 
                type="text" 
                value={filename} 
                onChange={e => setFilename(e.target.value)} 
                className="form-input w-full rounded-lg border-gray-300" 
              />
            </div>
            
            <div>
              <label className="font-semibold text-gray-700 block mb-2">Splitting Mode</label>
              <select value={splitMode} onChange={e => setSplitMode(e.target.value)} className="form-select w-full rounded-lg border-gray-300">
                <option value="delimiter">Delimiter</option>
                <option value="size">Size</option>
                <option value="pages">By Page (PDF, DOCX, XLSX, PPTX only)</option>
              </select>
            </div>
            
            {splitMode === 'delimiter' && 
              <div>
                <label className="font-semibold text-gray-700 block mb-2">Delimiter</label>
                <input type="text" value={splitBy} onChange={e => setSplitBy(e.target.value)} placeholder="e.g., \n\n for paragraphs" className="form-input w-full rounded-lg border-gray-300" />
              </div>
            }
            {splitMode === 'size' && 
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-2">Chunk Size</label>
                  <input type="number" value={chunkSize} onChange={e => setChunkSize(parseInt(e.target.value))} className="form-input w-full rounded-lg border-gray-300" />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-2">Overlap</label>
                  <input type="number" value={overlap} onChange={e => setOverlap(parseInt(e.target.value))} className="form-input w-full rounded-lg border-gray-300" />
                </div>
              </div>
            }
            
            <div>
              <label className="font-semibold text-gray-700 block mb-2">Tags</label>
              <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="Urgent, Report, Q3 (comma separated)" className="form-input w-full rounded-lg border-gray-300" />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4 border-t pt-6">
            <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300">Cancel</button>
            <button onClick={handleUpload} disabled={isUploading} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300">
              {isUploading ? 'Processing...' : 'Process & Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadConfigModal;