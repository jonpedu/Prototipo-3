import React from 'react';

// ============================================================================
// BUTTON - Componente de botão reutilizável com tema Sci-Fi
// ============================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    isLoading?: boolean;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    isLoading = false,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles =
        'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
        primary:
            'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/50 focus:ring-blue-500',
        secondary:
            'bg-gray-700 hover:bg-gray-600 text-gray-100 shadow-lg hover:shadow-gray-500/30 focus:ring-gray-500',
        danger:
            'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/50 focus:ring-red-500',
        success:
            'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/50 focus:ring-green-500',
        ghost:
            'bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600',
    };

    const sizeStyles = {
        sm: 'text-sm px-3 py-1.5 rounded-md gap-1.5',
        md: 'text-base px-4 py-2 rounded-lg gap-2',
        lg: 'text-lg px-6 py-3 rounded-lg gap-2.5',
    };

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                </svg>
            ) : (
                icon && <span className="flex-shrink-0">{icon}</span>
            )}
            {children}
        </button>
    );
};
