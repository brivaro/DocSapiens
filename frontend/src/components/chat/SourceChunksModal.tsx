// components/chat/SourceChunksModal.tsx
import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, FileText, CheckCircle } from 'phosphor-react';
import { type Chunk } from '../../hooks/useChat';

interface Props {
    chunks: Chunk[];
    isOpen: boolean;
    onClose: () => void;
}

const SourceChunksModal: React.FC<Props> = ({ chunks, isOpen, onClose }) => {
    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="bg-black/40 fixed inset-0 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 w-[90vw] max-w-2xl max-h-[85vh] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-lg z-50 flex flex-col">
                    <header className="p-4 border-b flex justify-between items-center">
                        <Dialog.Title className="text-lg font-semibold flex items-center gap-2">
                            <FileText size={20} /> Sources Used
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="p-1 rounded-full hover:bg-gray-100" aria-label="Close">
                                <X size={20} />
                            </button>
                        </Dialog.Close>
                    </header>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {chunks.map((chunk, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-gray-50">
                                <div className="flex justify-between items-center mb-2 text-xs font-mono text-gray-500">
                                    <span>CHUNK #{chunk.chunk_id} (DOC: ...{chunk.document_id.slice(-12)})</span>
                                    <span className="flex items-center gap-1 font-sans text-green-600">
                                        <CheckCircle size={14} weight="bold" /> {(chunk.score * 100).toFixed(1)}% match
                                    </span>
                                </div>
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{chunk.text}</p>
                            </div>
                        ))}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default SourceChunksModal;