import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
    children: React.ReactNode;
}

export function Portal({ children }: PortalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Busca el elemento del DOM que creamos en index.html
        const modalRoot = document.getElementById('modal-root');
        if (!modalRoot) {
            console.error("The element #modal-root was not found");
            return;
        }

        return () => setMounted(false);
    }, []);

    // createPortal toma dos argumentos: 
    // 1. El JSX que quieres renderizar (children)
    // 2. El nodo del DOM donde lo quieres renderizar
    return mounted
        ? createPortal(children, document.getElementById('modal-root')!)
        : null;
}