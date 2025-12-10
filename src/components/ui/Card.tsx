/**
 * Componentes UI Base - Card
 */

import React from 'react';

interface CardProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
    return (
        <div className={`bg-gray-900 border border-gray-800 rounded-lg shadow-xl ${className}`}>
            {title && (
                <div className="px-4 py-3 border-b border-gray-800">
                    <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
                </div>
            )}
            <div className="p-4">
                {children}
            </div>
        </div>
    );
};
