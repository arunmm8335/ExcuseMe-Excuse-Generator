import React from 'react';

/**
 * Reusable form input component with icon and consistent styling
 */
const FormInput = ({ 
  type, 
  name, 
  placeholder, 
  value,
  onChange, 
  required = false, 
  Icon, 
  label,
  tabIndex = 0 
}) => {
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text text-base-content/90 font-medium">{label}</span>
      </label>
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary text-xl z-10 pointer-events-none">
            <Icon />
          </span>
        )}
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          className="input input-bordered w-full bg-base-200/50 border-base-300/50 focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary transition-colors pl-10 rounded-xl"
          required={required}
          onChange={onChange}
          aria-label={label}
          tabIndex={tabIndex}
        />
      </div>
    </div>
  );
};

export default FormInput;
