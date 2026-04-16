import "./GradientText.css";

export default function GradientText({
  children,

  className = "",

  colors = ["#3b3b3bff", "#8b8b8bff", "#7a7a7aff"],

  animationSpeed = 8,

  showBorder = false,
}) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(", ")})`,

    animationDuration: `${animationSpeed}s`,
  };

  return (
    <div className={`animated-gradient-text ${className}`}>
      {showBorder && (
        <div className="gradient-overlay" style={gradientStyle}></div>
      )}

      <div className="text-content" style={gradientStyle}>
        {children}
      </div>
    </div>
  );
}
