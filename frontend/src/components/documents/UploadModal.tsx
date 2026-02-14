import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { File, X, CloudArrowUp, Gear, Trash, CheckCircle, CircleNotch, WarningCircle, TextT, Database } from 'phosphor-react';
import apiClient from '../../api/client';
import { clsx } from 'clsx';
import { Portal } from '../common/Portal';
import { useVectorStores } from '../../hooks/useVectorStores';
import { VectorStore } from '../../types/vectorStore';

interface FileWithConfig {
  id: string;
  file: File;
  filename: string;
  vector_store_id: string;
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
    formData.append("vector_store_id", params.vector_store_id);
    formData.append("split_mode", params.split_mode);
    
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

// ESTILO COMÚN PARA SELECTORES E INPUTS OSCUROS
const inputBaseClass = "w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all";

const FileConfigItem: React.FC<{
  item: FileWithConfig;
  vectorStores: VectorStore[] | undefined;
  onUpdate: (id: string, newConfig: Partial<FileWithConfig>) => void;
  onRemove: (id: string) => void;
  isUploading: boolean;
}> = ({ item, vectorStores, onUpdate, onRemove, isUploading }) => {
  const [showConfig, setShowConfig] = useState(true);
  
  return (
    <div className="p-3 bg-gray-700/30 border border-gray-600 rounded-lg transition-all">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
          {item.status === 'uploading' && <CircleNotch size={20} className="animate-spin text-blue-400 flex-shrink-0" />}
          {item.status === 'success' && <CheckCircle size={20} className="text-green-400 flex-shrink-0" />}
          {item.status === 'error' && <WarningCircle size={20} className="text-red-400 flex-shrink-0" />}
          {item.status === 'pending' && <File size={20} className="text-gray-400 flex-shrink-0" />}
          
          <span className="font-medium text-sm text-white truncate" title={item.filename}>
            {item.filename}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setShowConfig(!showConfig)} disabled={isUploading} className={clsx("p-1.5 rounded-md transition-colors", showConfig ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-600 hover:text-white")}><Gear size={18} /></button>
            <button onClick={() => onRemove(item.id)} disabled={isUploading} className="p-1.5 rounded-md text-gray-400 hover:bg-red-900/30 hover:text-red-400 disabled:text-gray-600"><Trash size={18} /></button>
        </div>
      </div>
      
      {showConfig && (
        <div className="mt-4 pt-4 border-t border-gray-600 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          
          {/* SELECTOR DE COLECCIÓN MEJORADO */}
          <div className="md:col-span-2 bg-gray-900/40 p-3 rounded-lg border border-gray-700">
            <label className="text-[11px] uppercase tracking-wider font-bold text-gray-400 block mb-2 flex items-center gap-2">
               <Database size={14} className="text-blue-400" /> Colección Destino
            </label>
            <select 
                value={item.vector_store_id} 
                onChange={e => onUpdate(item.id, { vector_store_id: e.target.value })}
                className={clsx(
                    inputBaseClass,
                    !item.vector_store_id && "border-red-500/50 bg-red-900/10 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                )}
            >
                <option value="" className="bg-gray-900 text-gray-500">-- Selecciona una Colección --</option>
                {vectorStores?.map(vs => (
                    <option key={vs.id} value={vs.id} className="bg-gray-900">
                        {vs.name} ({vs.embedding_dimension}d)
                    </option>
                ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-400 block mb-1">Nombre del Archivo</label>
            <input 
              type="text" 
              value={item.filename} 
              onChange={e => onUpdate(item.id, { filename: e.target.value })} 
              className={inputBaseClass}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Modo de División</label>
            <select 
                value={item.split_mode} 
                onChange={e => onUpdate(item.id, { split_mode: e.target.value as FileWithConfig['split_mode'] })} 
                className={inputBaseClass}
            >
              <option value="delimiter" className="bg-gray-900">Delimitador (Texto)</option>
              <option value="whole" className="bg-gray-900">Todo Junto (Sin dividir)</option>
              <option value="size" className="bg-gray-900">Tamaño Fijo</option>
              <option value="pages" className="bg-gray-900">Por Páginas (PDF/PPT)</option>
            </select>
          </div>

          {item.split_mode === 'delimiter' && (
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1 flex items-center gap-1">
                 Delimitador <span className="text-gray-500 font-normal">(regex o texto)</span>
              </label>
              <div className="relative">
                <TextT size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                <input 
                    type="text" 
                    value={item.split_by} 
                    onChange={e => onUpdate(item.id, { split_by: e.target.value })} 
                    className={clsx(inputBaseClass, "pl-9 font-mono")}
                    placeholder="\n\n"
                />
              </div>
            </div>
          )}

          {item.split_mode === 'size' && (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Tamaño Chunk</label>
                <input 
                    type="number" 
                    value={item.chunk_size} 
                    onChange={e => onUpdate(item.id, { chunk_size: parseInt(e.target.value) })} 
                    className={inputBaseClass}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Solapamiento</label>
                <input 
                    type="number" 
                    value={item.overlap} 
                    onChange={e => onUpdate(item.id, { overlap: parseInt(e.target.value) })} 
                    className={inputBaseClass} 
                />
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-400 block mb-1">Etiquetas (separadas por comas)</label>
            <input 
                type="text" 
                value={item.tags} 
                onChange={e => onUpdate(item.id, { tags: e.target.value })} 
                className={inputBaseClass} 
                placeholder="urgente, finanzas, Q1..." 
            />
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
  const { vectorStores } = useVectorStores();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileWithConfig[] = acceptedFiles.map(file => ({
      id: `${file.name}-${Date.now()}`,
      file,
      filename: file.name,
      vector_store_id: '',
      tags: '',
      split_mode: 'delimiter',
      split_by: '\\n\\n',
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

  const handleUploadAll = async () => {
    if (files.some(f => !f.vector_store_id)) {
        alert("Por favor selecciona una colección de destino para todos los archivos.");
        return;
    }

    for (const fileConfig of files) {
        if (fileConfig.status !== 'pending') continue;
        
        updateFileConfig(fileConfig.id, { status: 'uploading' });
        try {
            await uploadFile(fileConfig);
            updateFileConfig(fileConfig.id, { status: 'success' });
        } catch (error: any) {
            updateFileConfig(fileConfig.id, { 
                status: 'error', 
                error: error.response?.data?.detail || "Error subiendo archivo" 
            });
        }
    }
    
    if (files.every(f => f.status === 'success')) {
        setTimeout(onClose, 1000);
    }
  };
  
  const isUploading = files.some(f => f.status === 'uploading');

  return (
    <Portal>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div 
                className="bg-gray-900 border border-gray-700 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-zoomIn ring-1 ring-white/10"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-5 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <CloudArrowUp size={24} className="text-blue-400"/> Subir Documentos
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </header>

                <div className="p-6 flex-1 overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
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
                    </div>
                    
                    {files.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-full h-px bg-gray-700"></span>
                                <span className="flex-shrink-0">Archivos ({files.length})</span>
                                <span className="w-full h-px bg-gray-700"></span>
                            </p>
                            <div className="grid gap-3">
                                {files.map(item => (
                                    <FileConfigItem 
                                        key={item.id} 
                                        item={item} 
                                        vectorStores={vectorStores}
                                        onUpdate={updateFileConfig} 
                                        onRemove={removeFile} 
                                        isUploading={isUploading} 
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <footer className="p-5 bg-gray-800/50 border-t border-gray-700 flex justify-between items-center">
                    <span className="text-sm text-gray-400 font-mono">
                        {files.length > 0 ? `${files.length} archivo(s)` : 'Esperando archivos...'}
                    </span>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button
                            onClick={handleUploadAll}
                            disabled={isUploading || files.length === 0}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-1px]"
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