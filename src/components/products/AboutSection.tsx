
import React from "react";

const AboutSection = () => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-xl font-semibold mb-4">About TCG Product Tracking</h2>
    <p className="text-gray-700 mb-4">
      The Pokemon Trading Card Game continues to be one of the most popular collectible card games worldwide. Due to high demand, many products quickly sell out at major retailers, making it difficult for collectors and players to find items at retail prices.
    </p>
    <p className="text-gray-700 mb-4">
      At TCG Updates, we continuously monitor stock levels manually at Pokemon Center, Target, Walmart, Best Buy, GameStop, and dozens of other retailers to provide you with the most up-to-date information on product availability.
    </p>
    <p className="text-gray-700 mb-4">
      We check inventory multiple times per day for high-demand products, ensuring you're among the first to know when restocks happen. For users who create a free account, we offer customizable alerts via email, text message, or push notification when specific products come back in stock.
    </p>
    <p className="text-gray-700">
      While we strive for 100% accuracy, inventory systems can sometimes experience delays. We recommend acting quickly when you receive an in-stock notification, as popular products may sell out within minutes.
    </p>
  </div>
);

export default AboutSection;
