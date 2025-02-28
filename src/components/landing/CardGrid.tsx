import React from "react";
import { Card } from "./Card";

export const CardGrid: React.FC = () => {
  const handleListingClick = (index: number) => {
    console.log(`Listing ${index + 1} clicked`);
  };

  return (
    <div
      className="flex justify-between gap-[19px] max-md:flex-col max-md:items-center"
      role="region"
      aria-label="Product listings"
    >
      {[0, 1, 2].map((index) => (
        <Card key={index} onListingClick={() => handleListingClick(index)} />
      ))}
    </div>
  );
};
