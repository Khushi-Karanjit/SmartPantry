import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  borderRadius?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  width = "100%", 
  height = "1rem", 
  className = "",
  borderRadius = "0.5rem"
}) => {
  return (
    <div 
      className={`skeleton-loader ${className}`}
      style={{ 
        width, 
        height, 
        borderRadius,
        background: "rgba(255, 255, 255, 0.05)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div 
        className="skeleton-shimmer"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)",
          animation: "shimmer 1.5s infinite"
        }}
      />
    </div>
  );
};

export default Skeleton;
