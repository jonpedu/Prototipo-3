/**
 * Componentes UI Base - Badge
 */

import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    className = ''
}) => {
    const variantClasses = {
        success: 'bg-green-900/50 text-green-400 border-green-700',
        warning: 'bg-yellow-900/50 text-yellow-400 border-yellow-700',
        error: 'bg-red-900/50 text-red-400 border-red-700',
        info: 'bg-blue-900/50 text-blue-400 border-blue-700',
        default: 'bg-gray-800 text-gray-400 border-gray-700'
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantClasses[variant]} ${className}`}>
            {children}
        </span>
    );
};
