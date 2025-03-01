import React from "react";

export const Hero: React.FC = () => {
  return (
    <header className="mb-[164px] max-md:mb-20 max-sm:mb-10" role="banner">
      <h1 className="text-[64px] text-[#1E1E1E] font-normal max-md:text-5xl max-sm:text-4xl">
        Find everything in stock.
      </h1>
      <h2 className="text-[64px] text-[#1E1E1E] font-normal max-md:text-5xl max-sm:text-4xl">
        In one place.
      </h2>
    </header>
  );
};
