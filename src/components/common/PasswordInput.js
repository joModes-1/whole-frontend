import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './PasswordInput.css';

const PasswordInput = ({ value, onChange, name, placeholder, required }) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="password-input-container">
            <input
                type={showPassword ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                name={name}
                placeholder={placeholder}
                required={required}
                className="password-input"
                autoComplete="new-password"
            />
            <span onClick={togglePasswordVisibility} className="password-toggle-icon">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
        </div>
    );
};

export default PasswordInput;
