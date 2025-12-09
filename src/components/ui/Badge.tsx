import React from 'react';

// ============================================================================
// BADGE - Componente de badge/tag
// ============================================================================

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'md',
    className = '',
}) => {
    const variantStyles = {
        default: 'bg-gray-700 text-gray-200',
        primary: 'bg-blue-600/20 text-blue-300 border border-blue-500/30',
        success: 'bg-green-600/20 text-green-300 border border-green-500/30',
        warning: 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/30',
        danger: 'bg-red-600/20 text-red-300 border border-red-500/30',
        info: 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30',
    };

    const sizeStyles = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5',
    };

    return (
        <span
            className={`inline-flex items-center font-medium rounded-md ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        >
            {children}
        </span>
    );
};

// ============================================================================
// PILL - Variante arredondada do Badge
// ============================================================================

export const Pill: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'md', className = '' }) => {
    return (
        <Badge variant={variant} size={size} className={`rounded-full ${className}`}>
            {children}
        </Badge>
    );
};
