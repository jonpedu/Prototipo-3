import React from 'react';

// ============================================================================
// INPUT - Componente de input reutilizável
// ============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    helperText,
    icon,
    fullWidth = false,
    className = '',
    id,
    ...props
}) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    const baseStyles =
        'bg-gray-800 border rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed';

    const borderStyles = hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500';

    const widthStyles = fullWidth ? 'w-full' : '';
    const iconPaddingStyles = icon ? 'pl-11' : '';

    return (
        <div className={`${fullWidth ? 'w-full' : ''}`}>
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1.5">
                    {label}
                </label>
            )}

            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        {icon}
                    </div>
                )}

                <input
                    id={inputId}
                    className={`${baseStyles} ${borderStyles} ${widthStyles} ${iconPaddingStyles} ${className}`}
                    {...props}
                />
            </div>

            {(error || helperText) && (
                <p className={`text-sm mt-1.5 ${hasError ? 'text-red-400' : 'text-gray-500'}`}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
};

// ============================================================================
// TEXTAREA
// ============================================================================

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
    label,
    error,
    helperText,
    fullWidth = false,
    className = '',
    id,
    ...props
}) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    const baseStyles =
        'bg-gray-800 border rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed resize-none';

    const borderStyles = hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500';

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
        <div className={`${fullWidth ? 'w-full' : ''}`}>
            {label && (
                <label htmlFor={textareaId} className="block text-sm font-medium text-gray-300 mb-1.5">
                    {label}
                </label>
            )}

            <textarea
                id={textareaId}
                className={`${baseStyles} ${borderStyles} ${widthStyles} ${className}`}
                {...props}
            />

            {(error || helperText) && (
                <p className={`text-sm mt-1.5 ${hasError ? 'text-red-400' : 'text-gray-500'}`}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
};
