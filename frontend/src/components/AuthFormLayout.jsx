import React from 'react';
import BackgroundSelector from './BackgroundSelector';

/**
 * Reusable layout component for authentication pages (Login/Register)
 */
const AuthFormLayout = ({ 
  children, 
  backgroundImage, 
  onBackgroundChange, 
  headerIcon: HeaderIcon, 
  title, 
  subtitle 
}) => {
  return (
    <div className="fixed inset-0 overflow-hidden pt-[64px] px-2 md:px-4 py-2">
      {/* Background Image with Overlay */}
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
          }}
        />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20"></div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Background Selector */}
      <BackgroundSelector onBackgroundChange={onBackgroundChange} />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center py-8 px-2 md:px-4">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center flex flex-col items-center justify-center mb-2">
            {HeaderIcon && (
              <HeaderIcon 
                className="mx-auto mb-2 text-primary drop-shadow-lg" 
                size={56} 
                aria-label={`${title} Icon`} 
              />
            )}
            <h2 
              className="text-5xl font-extrabold mb-2 text-primary drop-shadow-lg" 
              style={{ 
                letterSpacing: '0.02em', 
                textShadow: '0 2px 8px rgba(0,0,0,0.25)', 
                color: 'var(--tw-prose-invert, #2563eb)' 
              }}
            >
              {title}
            </h2>
            <p className="text-lg text-base-content/80 mb-2">
              {subtitle}
            </p>
          </div>

          {/* Form Card */}
          <div className="card bg-base-200/20 backdrop-blur-md p-6 md:p-8 shadow-2xl border border-base-300/30 w-full max-w-full rounded-2xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthFormLayout;
