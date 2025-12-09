import React from 'react';

// ============================================================================
// SELECT - Componente de select reutilizável
// ============================================================================

interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    label?: string;
    error?: string;
    helperText?: string;
    options: SelectOption[];
    placeholder?: string;
    fullWidth?: boolean;
    onChange?: (value: string) => void;
}

export const Select: React.FC<SelectProps> = ({
    label,
    error,
    helperText,
    options,
    placeholder,
    fullWidth = false,
    className = '',
    id,
    onChange,
    ...props
}) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    const baseStyles =
        'bg-gray-800 border rounded-lg px-4 py-2 text-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer';

    const borderStyles = hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500';

    const widthStyles = fullWidth ? 'w-full' : '';

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (onChange) {
            onChange(e.target.value);
        }
    };

    return (
        <div className={`${fullWidth ? 'w-full' : ''}`}>
            {label && (
                <label htmlFor={selectId} className="block text-sm font-medium text-gray-300 mb-1.5">
                    {label}
                </label>
            )}

            <div className="relative">
                <select
                    id={selectId}
                    className={`${baseStyles} ${borderStyles} ${widthStyles} ${className}`}
                    onChange={handleChange}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option key={option.value} value={option.value} disabled={option.disabled}>
                            {option.label}
                        </option>
                    ))}
                </select>

                {/* Chevron Icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            </div>

            {(error || helperText) && (
                <p className={`text-sm mt-1.5 ${hasError ? 'text-red-400' : 'text-gray-500'}`}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
};
