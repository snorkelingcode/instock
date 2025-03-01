import React from "react";

export const Hero: React.FC = () => {
  return (
    <header className="mb-8 md:mb-12" role="banner">
      <h1 className="text-4xl md:text-5xl lg:text-6xl text-[#1E1E1E] font-normal">
        Find everything in stock.
      </h1>
      <h2 className="text-4xl md:text-5xl lg:text-6xl text-[#1E1E1E] font-normal">
        In one place.
      </h2>
    </header>
  );
};
