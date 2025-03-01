
import React from "react";

interface CardProps {
  productLine: string;
  product: string;
  source: string;
  price: number;
  listingLink: string;
  onListingClick: () => void;
}

export const Card: React.FC<CardProps> = ({
  productLine,
  product,
  source,
  price,
  listingLink,
  onListingClick,
}) => {
  return (
    <div className="w-full h-full bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-4 flex flex-col">
      <div className="flex-grow">
        <div className="text-sm text-gray-600">{productLine}</div>
        <div className="text-lg font-medium mt-1">{product}</div>
        <div className="text-sm text-gray-600 mt-2">{source}</div>
        <div className="text-lg font-medium mt-1">${price.toFixed(2)}</div>
      </div>
      <a
        href={listingLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          e.preventDefault();
          onListingClick();
          if (listingLink) window.open(listingLink, "_blank");
        }}
        className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded mt-4"
      >
        View Listing
      </a>
    </div>
  );
};
