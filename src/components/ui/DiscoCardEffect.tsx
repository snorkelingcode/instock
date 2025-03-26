
import React from "react";

interface DiscoCardEffectProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
}

const DiscoCardEffect: React.FC<DiscoCardEffectProps> = ({
  children,
  className = "",
  index = 0
}) => {
  return (
    <div
      className={`relative rounded-lg transition-all duration-300 ${className}`}
      style={{
        boxShadow: "0px 2px 12px rgba(234, 56, 76, 0.25)",
        border: "1px solid rgba(234, 56, 76, 0.3)"
      }}
    >
      {children}
    </div>
  );
};

export default DiscoCardEffect;
