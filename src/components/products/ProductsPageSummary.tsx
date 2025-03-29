
import React from "react";
import { Separator } from "@/components/ui/separator";

const ProductsPageSummary = () => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-xl font-semibold mb-2">TCG Product Tracker</h2>
    <Separator className="h-[2px] bg-red-500 mb-4" />
    <p className="text-gray-700 mb-4">
      Welcome to our comprehensive TCG product tracker. We monitor stock levels across popular retailers including 
      Pokemon Center, Target, Walmart, Best Buy, GameStop, and many more to help you find the cards you're looking for.
    </p>
    <p className="text-gray-700 mb-4">
      Our tracker features real-time updates for booster boxes, elite trainer boxes, special collections, and other 
      TCG products. We highlight featured items, currently in-stock products, and recently sold-out items so you can 
      stay informed about product availability.
    </p>
    <p className="text-gray-700">
      Bookmark this page to stay updated on TCG product availability and check back regularly as our inventory 
      tracking is updated frequently throughout the day.
    </p>
  </div>
);

export default ProductsPageSummary;
