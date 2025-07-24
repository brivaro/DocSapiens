import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, AlertTriangle } from 'lucide-react';
import DeleteImage from '../../assets/delete_document.png'; 

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  documentName: string;
}

const DeleteConfirmModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, documentName }) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/60 data-[state=open]:animate-overlayShow fixed inset-0 z-50" />
        <Dialog.Content 
          className="data-[state=open]:animate-contentShow fixed top-1/2 left-1/2 w-[90vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 
          rounded-2xl bg-white shadow-2xl z-50 focus:outline-none overflow-hidden"
        >
          {/* Usamos flexbox para crear el layout partido */}
          <div className="flex flex-col md:flex-row">

            {/* Columna Izquierda: Ilustración (la parte gris) */}
            <div className="hidden md:flex flex-col items-center justify-center w-56 bg-slate-50 p-6 border-r border-slate-200 flex-shrink-0">
                <img 
                  src={DeleteImage} 
                  alt="A person throwing documents into a bin" 
                  className="w-32 h-32" 
                />
                <div className="mt-4 flex items-center gap-2 text-red-600">
                    <AlertTriangle size={16} />
                    <span className="font-bold text-xs tracking-wider">DESTRUCTIVE ACTION</span>
                </div>
            </div>

            {/* Columna Derecha: Contenido y Acciones */}
            <div className="flex flex-col p-6 sm:p-8">
                <Dialog.Title className="text-xl font-bold text-gray-900">
                    Are you absolutely sure?
                </Dialog.Title>

                <Dialog.Description className="mt-2 text-sm text-gray-600 leading-relaxed">
                    This action cannot be undone. This will permanently delete the document <br/>
                    <strong className="font-bold text-red-700 break-all">"{documentName}"</strong> 
                    <br/>and all of its associated data from our servers.
                </Dialog.Description>
              
                <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-3">
                    <Dialog.Close asChild>
                        <button
                        className="w-full sm:w-auto mt-2 sm:mt-0 inline-flex items-center justify-center rounded-md px-4 py-2 font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                        Cancel
                        </button>
                    </Dialog.Close>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose(); // Cierra el modal después de confirmar
                        }}
                        className="w-full sm:w-auto inline-flex items-center justify-center rounded-md px-4 py-2 font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                    >
                        Yes, delete document
                    </button>
                </div>
            </div>

          </div>

          {/* Botón de cierre en la esquina superior derecha */}
          <Dialog.Close asChild>
            <button className="absolute top-3 right-3 p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default DeleteConfirmModal;