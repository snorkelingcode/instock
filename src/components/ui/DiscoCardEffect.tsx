
import React, { useState, useEffect, useRef } from "react";

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
  // We're not using the disco effect anymore, just wrapping the children
  return (
    <div
      className={`relative rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ${className}`}
      style={{
        boxShadow: "0px 2px 8px rgba(234, 76, 76, 0.15)"
      }}
    >
      {children}
    </div>
  );
};

export default DiscoCardEffect;
