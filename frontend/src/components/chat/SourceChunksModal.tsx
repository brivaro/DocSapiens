import { Portal } from '../common/Portal';
import { X, FileText, CheckCircle, Hash } from 'phosphor-react';
import { Chunk } from '../../types/chat';

interface Props {
    chunks: Chunk[];
    isOpen: boolean;
    onClose: () => void;
}

export default function SourceChunksModal({ chunks, isOpen, onClose }: Props) {
    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
                <div 
                    className="bg-gray-900 border border-gray-700 w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-zoomIn"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                                <FileText size={24} weight="fill" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Fuentes Utilizadas</h2>
                                <p className="text-xs text-gray-400">{chunks.length} fragmentos recuperados para generar la respuesta</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent space-y-4">
                        {chunks.map((chunk, index) => (
                            <div key={index} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-blue-500/30 transition-colors group">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono border border-gray-600 flex items-center gap-1">
                                            <Hash size={12} /> {chunk.chunk_id}
                                        </span>
                                        <span className="text-xs text-gray-400 truncate max-w-[200px]" title={chunk.document_id}>
                                            ID: {chunk.document_id.split('-')[0]}...
                                        </span>
                                    </div>
                                    <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-900/20 px-2 py-1 rounded border border-green-500/20">
                                        <CheckCircle size={12} weight="fill" /> 
                                        {(chunk.score * 100).toFixed(1)}% Match
                                    </span>
                                </div>
                                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50 text-sm text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">
                                    {chunk.text}
                                </div>
                                {chunk.chunk_tags && chunk.chunk_tags.length > 0 && (
                                    <div className="mt-3 flex gap-2 flex-wrap">
                                        {chunk.chunk_tags.map(tag => (
                                            <span key={tag} className="text-[10px] bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Portal>
    );
}