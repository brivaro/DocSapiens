import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
    children: React.ReactNode;
}

export function Portal({ children }: PortalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const modalRoot = document.getElementById('modal-root');
        if (!modalRoot) {
            console.error("The element #modal-root was not found");
            return;
        }

        return () => setMounted(false);
    }, []);

    return mounted
        ? createPortal(children, document.getElementById('modal-root')!)
        : null;
}