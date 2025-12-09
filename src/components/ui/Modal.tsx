import React, { useEffect } from 'react';
import { X } from 'lucide-react';

// ============================================================================
// MODAL - Componente de modal reutilizável
// ============================================================================

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
}) => {
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, closeOnEscape, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeStyles = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-[95vw]',
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={handleOverlayClick}
        >
            <div
                className={`bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full ${sizeStyles[size]} max-h-[90vh] overflow-hidden flex flex-col animate-slide-in-bottom`}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                        {title && <h2 className="text-xl font-semibold text-gray-100">{title}</h2>}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-200 transition-colors p-1 hover:bg-gray-800 rounded-lg"
                                aria-label="Fechar"
                            >
                                <X size={24} />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">{children}</div>
            </div>
        </div>
    );
};

// ============================================================================
// MODAL FOOTER
// ============================================================================

interface ModalFooterProps {
    children: React.ReactNode;
    className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children, className = '' }) => {
    return (
        <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800 ${className}`}>
            {children}
        </div>
    );
};

// Adicionar animação ao CSS global
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-in-bottom {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  .animate-slide-in-bottom {
    animation: slide-in-bottom 0.3s ease-out;
  }
`;
document.head.appendChild(style);
