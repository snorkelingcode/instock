
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
        boxShadow: "0px 2px 12px rgba(234, 56, 76, 0.8)" // Keep shadow but remove border
      }}
    >
      {children}
    </div>
  );
};

export default DiscoCardEffect;
