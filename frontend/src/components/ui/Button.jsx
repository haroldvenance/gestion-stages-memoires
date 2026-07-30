import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  icon: Icon,
  ...props
}) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-blue-700 focus:ring-blue-300',
    secondary: 'bg-secondary text-white hover:bg-gray-600 focus:ring-gray-300',
    outline: 'border border-primary text-primary hover:bg-primary/10 focus:ring-blue-300',
    ghost: 'text-secondary hover:bg-gray-100 focus:ring-gray-300',
    danger: 'bg-danger text-white hover:bg-red-600 focus:ring-red-300',
    success: 'bg-success text-white hover:bg-green-600 focus:ring-green-300',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-all duration-200 ease-in-out focus:outline-none focus:ring-2
        ${variants[variant]} ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
        ${className}
      `}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};

export default Button;