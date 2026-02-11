import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { File, X, CloudArrowUp, Gear, Trash, CheckCircle, CircleNotch, WarningCircle, TextT } from 'phosphor-react';
import apiClient from '../../api/client';
import { clsx } from 'clsx';
import { Portal } from '../common/Portal';

// Interfaz actualizada
interface FileWithConfig {
  id: string;
  file: File;
  filename: string;
  tags: string;
  split_mode: 'delimiter' | 'size' | 'pages' | 'whole';
  split_by: string;
  chunk_size: number;
  overlap: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const uploadDocumentApi = async (params: Omit<FileWithConfig, 'id' | 'file' | 'status' | 'error'> & { file: File }) => {
    const formData = new FormData();
    formData.append("file", params.file, params.filename);
    formData.append("split_mode", params.split_mode);
    
    // IMPORTANTE: Enviar el split_by correctamente escapado si es necesario
    if (params.split_mode === 'delimiter') {
        formData.append("split_by", params.split_by.replace(/\\n/g, '\n'));
    }
    if (params.split_mode === 'size') {
        formData.append("chunk_size", params.chunk_size.toString());
        formData.append("overlap", params.overlap.toString());
    }
    formData.append("tags", params.tags);
    const { data } = await apiClient.post("/api/v1/documents/upload/", formData);
    return data;
};

// Componente para un solo archivo
const FileConfigItem: React.FC<{
  item: FileWithConfig;
  onUpdate: (id: string, newConfig: Partial<FileWithConfig>) => void;
  onRemove: (id: string) => void;
  isUploading: boolean;
}> = ({ item, onUpdate, onRemove, isUploading }) => {
  const [showConfig, setShowConfig] = useState(true); // Abierto por defecto para que el usuario vea opciones
  
  return (
    <div className="p-3 bg-gray-700/30 border border-gray-600 rounded-lg transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          {item.status === 'uploading' && <CircleNotch size={20} className="animate-spin text-blue-400 flex-shrink-0" />}
          {item.status === 'success' && <CheckCircle size={20} className="text-green-400 flex-shrink-0" />}
          {item.status === 'error' && <WarningCircle size={20} className="text-red-400 flex-shrink-0" />}
          {item.status === 'pending' && <File size={20} className="text-gray-400 flex-shrink-0" />}
          <span className="font-medium text-sm text-white truncate">{item.filename}</span>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setShowConfig(!showConfig)} disabled={isUploading} className={clsx("p-1.5 rounded-md transition-colors", showConfig ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-600 hover:text-white")}><Gear size={18} /></button>
            <button onClick={() => onRemove(item.id)} disabled={isUploading} className="p-1.5 rounded-md text-gray-400 hover:bg-red-900/30 hover:text-red-400 disabled:text-gray-600"><Trash size={18} /></button>
        </div>
      </div>
      
      {showConfig && (
        <div className="mt-4 pt-4 border-t border-gray-600 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {/* Fila 1 */}
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-400 block mb-1">Nombre del Archivo</label>
            <input type="text" value={item.filename} onChange={e => onUpdate(item.id, { filename: e.target.value })} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>

          {/* Fila 2: Modo y Opciones específicas */}
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Modo de División</label>
            <select value={item.split_mode} onChange={e => onUpdate(item.id, { split_mode: e.target.value as FileWithConfig['split_mode'] })} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none">
              <option value="delimiter">Delimitador (Texto)</option>
              <option value="whole">Todo Junto (Sin dividir)</option>
              <option value="size">Tamaño Fijo</option>
              <option value="pages">Por Páginas (PDF/PPT)</option>
            </select>
          </div>

          {/* INPUT DE DELIMITADOR (Ahora visible y editable) */}
          {item.split_mode === 'delimiter' && (
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1 flex items-center gap-1">
                 Delimitador <span className="text-gray-500 font-normal">(regex o texto)</span>
              </label>
              <div className="relative">
                <TextT size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"/>
                <input 
                    type="text" 
                    value={item.split_by} 
                    onChange={e => onUpdate(item.id, { split_by: e.target.value })} 
                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 pl-7 text-sm text-white font-mono focus:ring-1 focus:ring-blue-500 outline-none" 
                    placeholder="\n\n"
                />
              </div>
            </div>
          )}

          {item.split_mode === 'size' && (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Tamaño Chunk</label>
                <input type="number" value={item.chunk_size} onChange={e => onUpdate(item.id, { chunk_size: parseInt(e.target.value) })} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Solapamiento</label>
                <input type="number" value={item.overlap} onChange={e => onUpdate(item.id, { overlap: parseInt(e.target.value) })} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
            </>
          )}

          {/* Fila 3: Tags */}
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-400 block mb-1">Etiquetas (separadas por comas)</label>
            <input type="text" value={item.tags} onChange={e => onUpdate(item.id, { tags: e.target.value })} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" placeholder="urgente, finanzas, Q1..." />
          </div>
        </div>
      )}
      {item.error && <p className="text-xs text-red-400 mt-2 bg-red-900/20 p-2 rounded border border-red-500/30">{item.error}</p>}
    </div>
  )
}

const UploadModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [files, setFiles] = useState<FileWithConfig[]>([]);
  const queryClient = useQueryClient();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileWithConfig[] = acceptedFiles.map(file => ({
      id: `${file.name}-${Date.now()}`,
      file,
      filename: file.name,
      tags: '',
      split_mode: 'delimiter',
      split_by: '\\n\\n', // Default visible para el usuario
      chunk_size: 1000,
      overlap: 200,
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true
  });

  const updateFileConfig = (id: string, newConfig: Partial<FileWithConfig>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...newConfig } : f));
  };
  
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const { mutateAsync: uploadFile } = useMutation({ 
      mutationFn: uploadDocumentApi,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['documents'] });
      }
  });

  const handleUploadAll = () => {
    files.filter(f => f.status === 'pending').forEach(fileConfig => {
        uploadFile(fileConfig);
    });
    onClose();
  };
  
  const isUploading = files.some(f => f.status === 'uploading');

  return (
    <Portal>
        {/* Backdrop con blur y color oscuro suave */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            
            {/* Contenedor del Modal */}
            <div 
                className="bg-gray-900 border border-gray-700 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-zoomIn ring-1 ring-white/10"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <header className="p-5 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <CloudArrowUp size={24} className="text-blue-400"/> Subir Documentos
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </header>

                {/* Contenido Scrollable */}
                <div className="p-6 flex-1 overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    
                    {/* Zona de Arrastre Mejorada */}
                    <div 
                        {...getRootProps()} 
                        className={clsx(
                            "p-10 border-2 border-dashed rounded-xl text-center transition-all cursor-pointer group",
                            isDragActive 
                                ? 'border-blue-500 bg-blue-500/10' 
                                : 'border-gray-600 bg-gray-800/30 hover:border-blue-400 hover:bg-gray-800'
                        )} 
                        onClick={open}
                    >
                        <input {...getInputProps()} />
                        <div className="bg-gray-700/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                             <CloudArrowUp size={32} className={clsx("transition-colors", isDragActive ? "text-blue-400" : "text-gray-400 group-hover:text-blue-300")} />
                        </div>
                        <p className="font-semibold text-white text-lg">Arrastra archivos aquí</p>
                        <p className="text-sm text-gray-400 mt-1">o haz clic para explorar en tu ordenador</p>
                        <p className="text-xs text-gray-500 mt-4 bg-gray-900/50 inline-block px-3 py-1 rounded-full border border-gray-700">
                            Soporta: PDF, DOCX, TXT, Excel, PPTX
                        </p>
                    </div>
                    
                    {/* Lista de Archivos */}
                    {files.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-full h-px bg-gray-700"></span>
                                <span className="flex-shrink-0">Archivos ({files.length})</span>
                                <span className="w-full h-px bg-gray-700"></span>
                            </p>
                            <div className="grid gap-3">
                                {files.map(item => (
                                    <FileConfigItem key={item.id} item={item} onUpdate={updateFileConfig} onRemove={removeFile} isUploading={isUploading} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="p-5 bg-gray-800/50 border-t border-gray-700 flex justify-between items-center">
                    <span className="text-sm text-gray-400 font-mono">
                        {files.length > 0 ? `${files.length} listo(s) para procesar` : 'Esperando archivos...'}
                    </span>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button
                            onClick={handleUploadAll}
                            disabled={isUploading || files.length === 0}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:translate-y-[-1px]"
                        >
                            {isUploading ? <><CircleNotch size={18} className="animate-spin" /> Subiendo...</> : 'Procesar Todo'}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    </Portal>
  );
};

export default UploadModal;