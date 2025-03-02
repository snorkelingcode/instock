import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// News article preview component without images
const NewsPreview = ({ title, date, category, excerpt, featured = false }) => (
  <div className={`bg-white rounded-lg overflow-hidden shadow-md border ${featured ? 'border-blue-300' : 'border-gray-200'} transition-all hover:shadow-lg p-4`}>
    <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
      <Badge variant={category === 'Product News' ? 'default' : category === 'Release Dates' ? 'secondary' : 'outline'}>
        {category}
      </Badge>
      {featured && <Badge className="bg-blue-500">Featured</Badge>}
    </div>
    <h3 className="font-medium text-lg mb-1">{title}</h3>
    <p className="text-gray-500 text-xs mb-2">{date}</p>
    <p className="text-gray-700 text-sm mb-4">{excerpt}</p>
    <Button variant="outline" size="sm">
      Read More
    </Button>
  </div>
);

// Featured news article without image
const FeaturedNews = ({ title, date, category, content }) => (
  <div className="bg-white rounded-lg overflow-hidden shadow-md border border-blue-200 mb-8 hover:shadow-lg transition-all p-6">
    <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
      <Badge variant="default">{category}</Badge>
      <Badge className="bg-blue-500">Featured Story</Badge>
    </div>
    <h2 className="text-xl font-bold mb-2">{title}</h2>
    <p className="text-gray-500 text-sm mb-4">{date}</p>
    <div className="prose max-w-none mb-6">
      <p className="text-gray-700">{content}</p>
    </div>
    <Button>
      Read Full Article
    </Button>
  </div>
);

// Example of the news grid with the new components
const NewsGrid = () => {
  // Sample news data
  const recentNews = [
    {
      title: "Target Announces New Pokemon TCG Restock Policy",
      date: "February 27, 2025",
      category: "Retailer Updates",
      excerpt: "Target has announced changes to their Pokemon TCG restocking process to ensure fair distribution and combat scalping. Starting March 15, purchases of certain high-demand products will be limited to 2 per customer."
    },
    {
      title: "Paldean Fates Restock Coming to Pokemon Center Next Week",
      date: "February 25, 2025",
      category: "Restocks",
      excerpt: "The Pokemon Company has confirmed that Pokemon Center will be restocking Paldean Fates Elite Trainer Boxes and booster boxes next Tuesday at 10am EST."
    },
    {
      title: "Pokemon TCG Championship Series 2025 Dates Announced",
      date: "February 20, 2025",
      category: "Events",
      excerpt: "The Pokemon Company International has revealed dates for the 2025 Championship Series, with Regional Championships scheduled across North America, Europe, Latin America, and Oceania."
    }
  ];
  
  return (
    <div className="space-y-4">
      {recentNews.map((article, index) => (
        <NewsPreview key={index} {...article} featured={index === 0} />
      ))}
    </div>
  );
};

// Main component for demonstration
const NewsPageExample = () => {
  const featuredArticle = {
    title: "Twilight Masquerade Set Revealed: New Trainer Gallery and Ancient Pokemon",
    date: "March 1, 2025",
    category: "Product News",
    content: "The Pokemon Company has officially unveiled the next major expansion for the Pokemon Trading Card Game: Twilight Masquerade. Set to release on May 10, 2025, this expansion introduces over 190 new cards, including 15 Pokemon ex, 3 Ace Spec Trainer cards, and a special Trainer Gallery subset featuring alternate-art Pokemon paired with popular characters from the games."
  };
  
  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold mb-4">Pokemon TCG News</h1>
      <FeaturedNews {...featuredArticle} />
      <h2 className="text-xl font-semibold">Latest Updates</h2>
      <NewsGrid />
    </div>
  );
};

export default NewsPage;
