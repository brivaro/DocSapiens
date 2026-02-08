import { useState } from 'react';
import { X, ArrowsClockwise, FileText, Scissors } from 'phosphor-react';
import { ApiDocument } from '../../hooks/useDocuments';
import clsx from 'clsx';

interface Props {
    document: ApiDocument;
    onClose: () => void;
    onConfirm: (params: any) => Promise<void>;
}

export default function ReIndexModal({ document, onClose, onConfirm }: Props) {
    const [splitMode, setSplitMode] = useState(document.split_mode || 'delimiter');
    const [splitBy, setSplitBy] = useState('\\n\\n'); // Valor por defecto visual
    const [chunkSize, setChunkSize] = useState(document.chunk_size || 1000);
    const [overlap, setOverlap] = useState(document.overlap || 200);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        await onConfirm({
            docId: document.id,
            split_mode: splitMode,
            split_by: splitBy,
            chunk_size: chunkSize,
            overlap: overlap
        });
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-800 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-zoomIn">
                <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ArrowsClockwise className="text-blue-400" size={20} />
                        Re-Indexar Documento
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/30 flex items-center gap-3">
                        <FileText size={24} className="text-blue-300" />
                        <div>
                            <p className="text-sm font-bold text-white truncate max-w-[250px]">{document.filename}</p>
                            <p className="text-xs text-gray-400">Esta acción regenerará los vectores solo para la dimensión activa.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Modo de División</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['delimiter', 'size', 'pages'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setSplitMode(mode)}
                                        className={clsx(
                                            "py-2 text-xs font-bold rounded-lg border transition-all",
                                            splitMode === mode 
                                                ? "bg-blue-600 border-blue-500 text-white" 
                                                : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                                        )}
                                    >
                                        {mode === 'delimiter' ? 'Delimitador' : mode === 'size' ? 'Tamaño Fijo' : 'Páginas'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {splitMode === 'delimiter' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">Delimitador (Carácter o Regex)</label>
                                <input 
                                    type="text" 
                                    value={splitBy} 
                                    onChange={(e) => setSplitBy(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="\n\n"
                                />
                                <p className="text-xs text-gray-500 mt-1">Usa \n para saltos de línea.</p>
                            </div>
                        )}

                        {splitMode === 'size' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">Tamaño (caracteres)</label>
                                    <input 
                                        type="number" 
                                        value={chunkSize} 
                                        onChange={(e) => setChunkSize(Number(e.target.value))}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">Solapamiento (Overlap)</label>
                                    <input 
                                        type="number" 
                                        value={overlap} 
                                        onChange={(e) => setOverlap(Number(e.target.value))}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        )}
                        
                        {splitMode === 'pages' && (
                            <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600 text-xs text-gray-300 flex gap-2">
                                <Scissors size={16} />
                                <p>Divide automáticamente por página (PDF) o diapositiva (PPTX).</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-5 border-t border-gray-700 bg-gray-800 flex justify-end gap-3">
                    <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">Cancelar</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting && <ArrowsClockwise className="animate-spin" />}
                        {isSubmitting ? 'Procesando...' : 'Re-Indexar'}
                    </button>
                </div>
            </div>
        </div>
    );
}