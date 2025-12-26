import { useState, useEffect } from 'react';
import { validatePhoneNumber, formatPhoneInput, normalizePhoneNumber } from '../utils/phoneValidation';

/**
 * Reusable Phone Input Component with validation
 * Handles +91 prefix, spaces, and validates 10-digit Indian phone numbers
 */
export function PhoneInput({
    value,
    onChange,
    onValidation,
    placeholder = 'Enter phone number',
    className = '',
    required = false,
    disabled = false,
    autoFocus = false,
    name = 'phone',
    id,
}) {
    const [error, setError] = useState('');
    const [touched, setTouched] = useState(false);

    // Validate on value change
    useEffect(() => {
        if (touched && value) {
            const validation = validatePhoneNumber(value);
            setError(validation.error);

            // Notify parent of validation status
            if (onValidation) {
                onValidation(validation);
            }
        }
    }, [value, touched, onValidation]);

    const handleChange = (e) => {
        const formatted = formatPhoneInput(e.target.value);
        onChange({ target: { name, value: formatted } });
    };

    const handleBlur = () => {
        setTouched(true);

        if (value) {
            const validation = validatePhoneNumber(value);
            setError(validation.error);

            // Auto-normalize on blur if valid
            if (validation.isValid && validation.normalized !== value) {
                onChange({ target: { name, value: validation.normalized } });
            }

            if (onValidation) {
                onValidation(validation);
            }
        }
    };

    return (
        <div className="phone-input-wrapper">
            <input
                type="tel"
                id={id || name}
                name={name}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                className={className}
                required={required}
                disabled={disabled}
                autoFocus={autoFocus}
                autoComplete="tel"
                maxLength={13} // +91 + 10 digits
            />
            {touched && error && (
                <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
        </div>
    );
}
