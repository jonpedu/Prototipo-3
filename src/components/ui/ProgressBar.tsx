import React from 'react';

// ============================================================================
// PROGRESS BAR - Componente de barra de progresso
// ============================================================================

interface ProgressBarProps {
    value: number; // 0-100
    label?: string;
    showPercentage?: boolean;
    variant?: 'default' | 'success' | 'warning' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    label,
    showPercentage = true,
    variant = 'default',
    size = 'md',
    className = '',
}) => {
    const clampedValue = Math.max(0, Math.min(100, value));

    const variantStyles = {
        default: 'bg-blue-600',
        success: 'bg-green-600',
        warning: 'bg-yellow-600',
        danger: 'bg-red-600',
    };

    const sizeStyles = {
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4',
    };

    return (
        <div className={`w-full ${className}`}>
            {(label || showPercentage) && (
                <div className="flex items-center justify-between mb-2">
                    {label && <span className="text-sm font-medium text-gray-300">{label}</span>}
                    {showPercentage && (
                        <span className="text-sm font-semibold text-gray-400">{clampedValue.toFixed(0)}%</span>
                    )}
                </div>
            )}

            <div className={`w-full bg-gray-800 rounded-full overflow-hidden ${sizeStyles[size]}`}>
                <div
                    className={`${sizeStyles[size]} ${variantStyles[variant]} transition-all duration-300 ease-out rounded-full`}
                    style={{ width: `${clampedValue}%` }}
                >
                    {size === 'lg' && (
                        <div className="w-full h-full animate-pulse-slow opacity-30 bg-white rounded-full"></div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// CIRCULAR PROGRESS - Progresso circular
// ============================================================================

interface CircularProgressProps {
    value: number; // 0-100
    size?: number;
    strokeWidth?: number;
    showPercentage?: boolean;
    variant?: 'default' | 'success' | 'warning' | 'danger';
    className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
    value,
    size = 120,
    strokeWidth = 8,
    showPercentage = true,
    variant = 'default',
    className = '',
}) => {
    const clampedValue = Math.max(0, Math.min(100, value));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clampedValue / 100) * circumference;

    const variantColors = {
        default: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
    };

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(75, 85, 99, 0.3)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={variantColors[variant]}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-300 ease-out"
                />
            </svg>
            {showPercentage && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-100">{clampedValue.toFixed(0)}%</span>
                </div>
            )}
        </div>
    );
};
