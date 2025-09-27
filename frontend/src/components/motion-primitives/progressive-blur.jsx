export function ProgressiveBlur({ 
  className, 
  direction = 'left', 
  blurIntensity = 1,
  ...props 
}) {
  const getBlurStyles = () => {
    const blur = `blur(${blurIntensity * 4}px)`;
    
    switch (direction) {
      case 'left':
        return {
          background: `linear-gradient(to right, ${blur} 0%, transparent 100%)`,
          backdropFilter: blur,
        };
      case 'right':
        return {
          background: `linear-gradient(to left, ${blur} 0%, transparent 100%)`,
          backdropFilter: blur,
        };
      case 'top':
        return {
          background: `linear-gradient(to bottom, ${blur} 0%, transparent 100%)`,
          backdropFilter: blur,
        };
      case 'bottom':
        return {
          background: `linear-gradient(to top, ${blur} 0%, transparent 100%)`,
          backdropFilter: blur,
        };
      default:
        return {};
    }
  };

  return (
    <div 
      className={className}
      style={getBlurStyles()}
      {...props}
    />
  );
}