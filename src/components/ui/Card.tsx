import React from 'react';

// ============================================================================
// CARD - Componente de card reutilizável com tema Sci-Fi
// ============================================================================

interface CardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'bordered' | 'elevated' | 'glass';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    variant = 'default',
    padding = 'md',
    hover = false,
    onClick,
}) => {
    const baseStyles = 'rounded-lg transition-all duration-200';

    const variantStyles = {
        default: 'bg-gray-900 border border-gray-800',
        bordered: 'bg-gray-900 border-2 border-blue-600/30 sci-fi-border',
        elevated: 'bg-gray-900 border border-gray-800 shadow-xl shadow-blue-500/10',
        glass: 'bg-gray-900/50 backdrop-blur-md border border-gray-800/50',
    };

    const paddingStyles = {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
    };

    const hoverStyles = hover
        ? 'cursor-pointer hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5'
        : '';

    return (
        <div
            className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

// ============================================================================
// CARD HEADER
// ============================================================================

interface CardHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    icon?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action, icon }) => {
    return (
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
                {icon && <div className="text-blue-400 flex-shrink-0">{icon}</div>}
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
                    {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {action && <div className="flex-shrink-0 ml-4">{action}</div>}
        </div>
    );
};

// ============================================================================
// CARD CONTENT
// ============================================================================

interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
    return <div className={className}>{children}</div>;
};
