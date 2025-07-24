// src/components/UploadModal.tsx
import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { File, X, CloudArrowUp, Gear, Trash, CheckCircle, CircleNotch, WarningCircle } from 'phosphor-react';
import { api } from '../../api/client';

// Interfaz actualizada con todas las opciones
interface FileWithConfig {
  id: string;
  file: File;
  filename: string;
  tags: string;
  split_mode: 'delimiter' | 'size' | 'pages';
  split_by: string;
  chunk_size: number;
  overlap: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

// La función de la API se mantiene igual
const uploadDocumentApi = async (params: Omit<FileWithConfig, 'id' | 'file' | 'status' | 'error'> & { file: File }) => {
    const formData = new FormData();
    formData.append("file", params.file, params.filename);
    formData.append("split_mode", params.split_mode);
    // Solo enviar el delimitador si es el modo correcto
    if (params.split_mode === 'delimiter') {
        formData.append("split_by", params.split_by.replace(/\\n/g, '\n'));
    }
    if (params.split_mode === 'size') {
        formData.append("chunk_size", params.chunk_size.toString());
        formData.append("overlap", params.overlap.toString());
    }
    formData.append("tags", params.tags);
    const { data } = await api.post("/api/v1/documents/upload/", formData);
    return data;
};

// Componente para un solo archivo, ahora con la configuración completa
const FileConfigItem: React.FC<{
  item: FileWithConfig;
  onUpdate: (id: string, newConfig: Partial<FileWithConfig>) => void;
  onRemove: (id: string) => void;
  isUploading: boolean;
}> = ({ item, onUpdate, onRemove, isUploading }) => {
  const [showConfig, setShowConfig] = useState(false);
  
  return (
    <div className="p-3 bg-slate-50 border rounded-lg transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          {item.status === 'uploading' && <CircleNotch size={20} className="animate-spin text-blue-500 flex-shrink-0" />}
          {item.status === 'success' && <CheckCircle size={20} className="text-green-500 flex-shrink-0" />}
          {item.status === 'error' && <WarningCircle size={20} className="text-red-500 flex-shrink-0" />}
          {item.status === 'pending' && <File size={20} className="text-gray-500 flex-shrink-0" />}
          <span className="font-medium text-sm truncate">{item.filename}</span>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setShowConfig(!showConfig)} disabled={isUploading} className="p-1.5 rounded-md hover:bg-slate-200 disabled:text-gray-300"><Gear size={18} /></button>
            <button onClick={() => onRemove(item.id)} disabled={isUploading} className="p-1.5 rounded-md hover:bg-red-100 hover:text-red-600 disabled:text-gray-300"><Trash size={18} /></button>
        </div>
      </div>
      {showConfig && (
        <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-600 block mb-1">Filename</label>
            <input type="text" value={item.filename} onChange={e => onUpdate(item.id, { filename: e.target.value })} className="form-input w-full" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Splitting Mode</label>
            <select value={item.split_mode} onChange={e => onUpdate(item.id, { split_mode: e.target.value as FileWithConfig['split_mode'] })} className="form-select w-full">
              <option value="delimiter">Delimiter</option>
              <option value="size">Size</option>
              <option value="pages">By Page/Sheet</option>
            </select>
          </div>
          {item.split_mode === 'delimiter' && 
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Delimiter</label>
              <input type="text" value={item.split_by} onChange={e => onUpdate(item.id, { split_by: e.target.value })} className="form-input w-full" />
            </div>
          }
          {item.split_mode === 'size' && 
            <>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Chunk Size</label>
                <input type="number" value={item.chunk_size} onChange={e => onUpdate(item.id, { chunk_size: parseInt(e.target.value) })} className="form-input w-full" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Overlap</label>
                <input type="number" value={item.overlap} onChange={e => onUpdate(item.id, { overlap: parseInt(e.target.value) })} className="form-input w-full" />
              </div>
            </>
          }
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-600 block mb-1">Tags (comma separated)</label>
            <input type="text" value={item.tags} onChange={e => onUpdate(item.id, { tags: e.target.value })} className="form-input w-full" placeholder="Urgent, Q3-Report..." />
          </div>
        </div>
      )}
      {item.error && <p className="text-xs text-red-600 mt-2">Error: {item.error}</p>}
    </div>
  )
}

// El Modal Principal actualizado
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
      split_by: '\\n\\n',
      chunk_size: 1000,
      overlap: 200,
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true, // Desactivamos el clic por defecto para usar nuestro propio botón
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
    // 1. Recorre los archivos pendientes e inicia su subida
    files
      .filter(f => f.status === 'pending')
      .forEach(fileConfig => {
        // La mutación se encargará del resto en segundo plano
        uploadFile(fileConfig);
      });

    // 2. Cierra el modal INMEDIATAMENTE
    onClose();
  };
  
  const isUploading = files.some(f => f.status === 'uploading');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <header className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Upload Documents</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X size={20} /></button>
        </header>

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-lg text-center transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
            <input {...getInputProps()} />
            <CloudArrowUp size={48} className="mx-auto text-gray-400 mb-2" />
            <p className="font-semibold">Drag & drop files here, or</p>
            <button onClick={open} className="text-blue-600 font-semibold hover:underline">
                click to browse
            </button>
          </div>
          
          {files.length > 0 && (
            <div className="space-y-3">
              {files.map(item => (
                <FileConfigItem key={item.id} item={item} onUpdate={updateFileConfig} onRemove={removeFile} isUploading={isUploading} />
              ))}
            </div>
          )}
        </div>

        <footer className="flex justify-between items-center p-4 bg-slate-50 border-t">
            <span>{files.length} file(s) selected</span>
            <div className="flex gap-3">
                <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold hover:bg-gray-100">Cancel</button>
                <button
                    onClick={handleUploadAll}
                    disabled={isUploading || files.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                    {isUploading ? 'Uploading...' : 'Upload All'}
                </button>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default UploadModal;