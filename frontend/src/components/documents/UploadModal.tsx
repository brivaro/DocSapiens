import { useState, useRef, ChangeEvent } from 'react';
import { X, CloudArrowUp, FilePlus, CircleNotch } from 'phosphor-react';
import { useDocuments } from '../../hooks/useDocuments';
import { useAppToast } from '../../hooks/useAppToast';
import { clsx } from 'clsx';

interface Props {
  onClose: () => void;
}

export default function UploadModal({ onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  // Opciones básicas de chunking (para usuarios avanzados)
  const [chunkSize, setChunkSize] = useState(1000);
  const [splitMode, setSplitMode] = useState("delimiter");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadDocument } = useDocuments();
  const toast = useAppToast();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      await uploadDocument({
        file,
        filename: file.name,
        tags,
        split_mode: splitMode,
        split_by: "\\n\\n",
        chunk_size: chunkSize,
        overlap: 200
      });
      toast.success(`Documento "${file.name}" subido. Procesando...`);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Error al subir el documento.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-800 border border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-zoomIn">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CloudArrowUp className="text-blue-400" size={24} /> Subir Documento
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
            {/* Drop Zone Simplificada */}
            <div 
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                    "border-2 border-dashed border-gray-600 rounded-xl p-8 text-center cursor-pointer transition-all hover:border-blue-500 hover:bg-gray-700/30",
                    file && "border-green-500 bg-green-500/10"
                )}
            >
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
                {file ? (
                    <div>
                        <FilePlus size={48} className="mx-auto text-green-400 mb-2" />
                        <p className="text-white font-bold">{file.name}</p>
                        <p className="text-sm text-green-300">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                ) : (
                    <div>
                        <CloudArrowUp size={48} className="mx-auto text-blue-400 mb-2" />
                        <p className="text-gray-300 font-medium">Haz clic para seleccionar</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, DOCX, TXT, Excel</p>
                    </div>
                )}
            </div>

            {/* Configuración Rápida */}
            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Etiquetas (Opcional)</label>
                    <input 
                        type="text" 
                        value={tags} 
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="ej: finanzas, 2024, urgente" 
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Modo Split</label>
                        <select 
                            value={splitMode}
                            onChange={(e) => setSplitMode(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white text-sm outline-none"
                        >
                            <option value="delimiter">Delimitador</option>
                            <option value="size">Tamaño</option>
                            <option value="pages">Páginas</option>
                        </select>
                     </div>
                     {splitMode === 'size' && (
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1">Tamaño Chunk</label>
                            <input 
                                type="number" 
                                value={chunkSize}
                                onChange={(e) => setChunkSize(Number(e.target.value))}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white text-sm outline-none"
                            />
                        </div>
                     )}
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-700 bg-gray-800 flex justify-end gap-3">
             <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">Cancelar</button>
             <button 
                onClick={handleUpload} 
                disabled={!file || isUploading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isUploading ? <CircleNotch className="animate-spin" /> : <CloudArrowUp weight="bold" />}
                {isUploading ? 'Subiendo...' : 'Subir'}
            </button>
        </div>
      </div>
    </div>
  );
}